import {
  createInitialStoreData,
  MAHARASHTRA_KIRANA_CATALOG,
} from '../data/seedData';
import { Bill, Customer, Product, StoreData } from '../types/pos';
import { toMarathiReceiptName } from '../utils/transliterate';

const LOCAL_STORAGE_KEY = 'janshanti_kirana_pos_v2';
const LEGACY_STORAGE_KEY = 'janshanti_kirana_pos_v1';
const IDB_NAME = 'JanshantiKiranaPOS_DB';
const IDB_STORE = 'store_snapshot';
const IDB_KEY = 'main_v2';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(data: StoreData): Promise<void> {
  try {
    const db = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(data, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // localStorage remains primary instant mirror
  }
}

export async function loadFromIndexedDB(): Promise<StoreData | null> {
  try {
    const db = await openIDB();
    const result = await new Promise<StoreData | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as StoreData) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return isValidStoreData(result) ? normalizeStoreData(result) : null;
  } catch {
    return null;
  }
}

export function isValidStoreData(data: unknown): data is StoreData {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<StoreData>;
  return (
    Array.isArray(candidate.products) &&
    Array.isArray(candidate.customers) &&
    Array.isArray(candidate.bills) &&
    typeof candidate.nextBillNumber === 'number'
  );
}

/**
 * Ensures older backup/v1/v2 payloads get phonetic search tags, the expanded 76-item
 * Maharashtra catalog (including 30kg/50kg Katta bags), normalized customer names on bills,
 * and reconciled Khata entries/balances.
 */
export function normalizeStoreData(raw: StoreData): StoreData {
  const catalogById = new Map(
    MAHARASHTRA_KIRANA_CATALOG.map((item) => [item.id, item])
  );

  const normalizedProducts: Product[] = raw.products.map((p) => {
    const catalogMatch = catalogById.get(p.id);
    return {
      ...p,
      rate: Number(p.rate) || 0,
      stock: Number(p.stock) || 0,
      lowStockLimit: Number(p.lowStockLimit) || 5,
      bagWeightKg:
        p.unit === 'katta'
          ? Number(p.bagWeightKg) || catalogMatch?.bagWeightKg || 30
          : undefined,
      phonetic:
        typeof p.phonetic === 'string' && p.phonetic.trim() !== ''
          ? p.phonetic
          : catalogMatch?.phonetic || `${p.nameEn.toLowerCase()}`,
    };
  });

  const existingIds = new Set(normalizedProducts.map((p) => p.id));
  if ((raw.version || 1) < 3) {
    for (const item of MAHARASHTRA_KIRANA_CATALOG) {
      if (!existingIds.has(item.id)) {
        normalizedProducts.push(item);
      }
    }
  }

  const normalizedBills: Bill[] = raw.bills.map((b) => {
    const computedItemsTotal =
      Math.round(
        (b.items || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0) *
          100
      ) / 100;
    const total = Number(b.total) > 0 ? Number(b.total) : computedItemsTotal;
    const nameEn = (b.customerNameEn || b.customerNameMr || 'Cash Customer').trim();
    const nameMr =
      (b.customerNameMr || '').trim() || toMarathiReceiptName(nameEn, nameEn);
    return {
      ...b,
      total,
      customerId: b.customerId || 'cust-cash',
      customerNameMr: nameMr,
      customerNameEn: nameEn,
    };
  });

  const customerMap = new Map<string, Customer>();
  raw.customers.forEach((c) => {
    const safeEntries = Array.isArray(c.entries)
      ? c.entries.map((e) => ({
          ...e,
          amount: Number(e.amount) || 0,
        }))
      : [];
    const safeBalance = Number.isFinite(Number(c.balance))
      ? Math.max(0, Math.round(Number(c.balance) * 100) / 100)
      : 0;
    customerMap.set(c.id, {
      ...c,
      nameMr: c.nameMr || toMarathiReceiptName(c.nameEn, c.nameEn),
      nameEn: c.nameEn || c.nameMr,
      mobile: c.mobile || '',
      balance: safeBalance,
      entries: safeEntries,
    });
  });

  // Self-heal: ensure every saved bill is present in its customer's Khata entries with accurate amount
  normalizedBills.forEach((bill) => {
    const custId = bill.customerId || 'cust-cash';
    let cust = customerMap.get(custId);
    if (!cust) {
      cust = {
        id: custId,
        nameMr: bill.customerNameMr || 'रोख ग्राहक',
        nameEn: bill.customerNameEn || 'Cash Customer',
        mobile: '',
        balance: 0,
        entries: [],
      };
      customerMap.set(custId, cust);
    }

    const existingEntry = cust.entries.find(
      (e) =>
        (e.billId && e.billId === bill.id) ||
        (e.billNumber && e.billNumber === bill.billNumber)
    );

    if (!existingEntry) {
      cust.entries.push({
        id: `kh-sync-${bill.id}`,
        createdAt: bill.createdAt,
        type: bill.paymentMode === 'khata' ? 'udhaar' : 'paid_bill',
        amount: bill.total,
        noteMr:
          bill.paymentMode === 'khata'
            ? `बिल क्र. #${bill.billNumber} (${bill.items.length} वस्तू)`
            : bill.paymentMode === 'upi'
              ? `बिल क्र. #${bill.billNumber} (फोनपे / UPI)`
              : `बिल क्र. #${bill.billNumber} (रोख)`,
        noteEn:
          bill.paymentMode === 'khata'
            ? `Bill #${bill.billNumber} (${bill.items.length} items)`
            : bill.paymentMode === 'upi'
              ? `Bill #${bill.billNumber} (UPI)`
              : `Bill #${bill.billNumber} (Cash)`,
        paymentMode: bill.paymentMode,
        billId: bill.id,
        billNumber: bill.billNumber,
      });
    } else if (!existingEntry.amount || existingEntry.amount <= 0) {
      existingEntry.amount = bill.total;
    }
  });

  // Recompute customer Udhaar balance reliably from entries (sum of udhaar - sum of jama)
  const normalizedCustomers: Customer[] = Array.from(customerMap.values()).map(
    (c) => {
      const sortedEntries = [...c.entries].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const totalUdhaar = sortedEntries
        .filter((e) => e.type === 'udhaar')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const totalJama = sortedEntries
        .filter((e) => e.type === 'jama')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const computedBalance = Math.max(
        0,
        Math.round((totalUdhaar - totalJama) * 100) / 100
      );
      return {
        ...c,
        balance: computedBalance,
        entries: sortedEntries,
      };
    }
  );

  const maxExistingBillNumber = normalizedBills.reduce(
    (max, b) => Math.max(max, Number(b.billNumber) || 0),
    100
  );
  const safeNextBillNumber = Math.max(
    Number(raw.nextBillNumber) || 101,
    maxExistingBillNumber + 1
  );

  return {
    ...raw,
    version: 3,
    nextBillNumber: safeNextBillNumber,
    products: normalizedProducts,
    customers: normalizedCustomers,
    bills: normalizedBills,
  };
}

export function loadInitialStoreSyncWithMeta(): {
  data: StoreData;
  fromSeed: boolean;
} {
  try {
    const rawV2 = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (isValidStoreData(parsed)) {
        const normalized = normalizeStoreData(parsed);
        persistStore(normalized);
        return { data: normalized, fromSeed: false };
      }
    }

    const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawV1) {
      const parsedV1 = JSON.parse(rawV1);
      if (isValidStoreData(parsedV1)) {
        const migrated = normalizeStoreData(parsedV1);
        persistStore(migrated);
        return { data: migrated, fromSeed: false };
      }
    }
  } catch {
    // fall through to seed data
  }

  // Do NOT overwrite IndexedDB yet — App.tsx checks IndexedDB first to rescue saved data if localStorage was cleared.
  const seeded = createInitialStoreData();
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // Ignore storage quota errors
  }
  return { data: seeded, fromSeed: true };
}

export function loadInitialStoreSync(): StoreData {
  return loadInitialStoreSyncWithMeta().data;
}

export function persistStore(data: StoreData): StoreData {
  const stamped: StoreData = {
    ...data,
    version: 3,
    lastSavedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stamped));
  } catch {
    // Ignore quota errors, IDB still saves
  }
  void saveToIndexedDB(stamped);
  return stamped;
}

export function downloadBackupJson(data: StoreData): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const filename = `janshanti-kirana-backup-${yyyy}-${mm}-${dd}.json`;

  const payload = JSON.stringify(
    {
      ...data,
      lastBackupAt: now.toISOString(),
    },
    null,
    2
  );

  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return now.toISOString();
}
