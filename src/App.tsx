/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { BillingScreen } from './components/BillingScreen';
import { Header } from './components/Header';
import { HisabScreen } from './components/HisabScreen';
import { HomeScreen } from './components/HomeScreen';
import { KhataScreen } from './components/KhataScreen';
import { ReceiptModal } from './components/ReceiptModal';
import { StockScreen } from './components/StockScreen';
import {
  downloadBackupJson,
  loadFromIndexedDB,
  loadInitialStoreSyncWithMeta,
  persistStore,
} from './db/storage';
import { isSameDay, translations } from './i18n/translations';
import {
  Bill,
  CartItem,
  Customer,
  KhataEntry,
  Language,
  PaymentMode,
  Product,
  Screen,
  StoreData,
} from './types/pos';
import { toMarathiReceiptName } from './utils/transliterate';

interface ToastState {
  message: string;
  tone: 'success' | 'error';
}

function makeUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function computeCustomerBalance(entries: KhataEntry[]): number {
  const totalUdhaar = entries
    .filter((e) => e.type === 'udhaar')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalJama = entries
    .filter((e) => e.type === 'jama')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  return Math.max(0, Math.round((totalUdhaar - totalJama) * 100) / 100);
}

export default function App() {
  const initialBootstrap = useMemo(() => loadInitialStoreSyncWithMeta(), []);
  const [store, setStore] = useState<StoreData>(initialBootstrap.data);
  const storeRef = useRef<StoreData>(store);
  storeRef.current = store;

  const [screen, setScreen] = useState<Screen>('home');
  const [receiptState, setReceiptState] = useState<{
    bill: Bill;
    isFromNewBill: boolean;
  } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const lang = store.language;
  const t = translations[lang];

  // Hydrate from IndexedDB if localStorage was cleared (fromSeed) or if IndexedDB is newer
  useEffect(() => {
    let active = true;
    loadFromIndexedDB().then((idbData) => {
      if (!active) return;
      if (idbData) {
        const currentTime = new Date(storeRef.current.lastSavedAt || 0).getTime();
        const idbTime = new Date(idbData.lastSavedAt || 0).getTime();
        if (initialBootstrap.fromSeed || idbTime > currentTime) {
          const synced = persistStore(idbData);
          storeRef.current = synced;
          setStore(synced);
          return;
        }
      }
      if (initialBootstrap.fromSeed) {
        persistStore(storeRef.current);
      }
    });
    return () => {
      active = false;
    };
  }, [initialBootstrap.fromSeed]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Synchronously updates ref + React state + localStorage + IndexedDB
  const commitStoreUpdate = useCallback(
    (updater: (prev: StoreData) => StoreData): StoreData => {
      const next = persistStore(updater(storeRef.current));
      storeRef.current = next;
      setStore(next);
      return next;
    },
    []
  );

  const showToast = useCallback(
    (message: string, tone: 'success' | 'error' = 'success') => {
      setToast({ message, tone });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Global Keyboard Shortcuts: F1 New Bill, F2 Udhaar, F3 Stock, F4 Today's Hisab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setReceiptState(null);
        setScreen('billing');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setReceiptState(null);
        setScreen('khata');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setReceiptState(null);
        setScreen('stock');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setReceiptState(null);
        setScreen('hisab');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleLang = (nextLang: Language) => {
    if (nextLang === lang) return;
    commitStoreUpdate((prev) => ({ ...prev, language: nextLang }));
  };

  // Add Customer
  const handleAddCustomer = useCallback(
    (
      nameMr: string,
      nameEn: string,
      mobile: string,
      openingBalance: number
    ): Customer => {
      const nowIso = new Date().toISOString();
      const safeBal = Math.max(0, Math.round((Number(openingBalance) || 0) * 100) / 100);
      const resolvedMr = toMarathiReceiptName(nameMr, nameEn);
      const resolvedEn = nameEn.trim() || nameMr.trim() || resolvedMr;

      const entries: KhataEntry[] =
        safeBal > 0
          ? [
              {
                id: makeUniqueId('kh'),
                createdAt: nowIso,
                type: 'udhaar',
                amount: safeBal,
                noteMr: 'आधीची बाकी रक्कम',
                noteEn: 'Opening pending balance',
                paymentMode: 'khata',
              },
            ]
          : [];

      const newCustomer: Customer = {
        id: makeUniqueId('cust'),
        nameMr: resolvedMr,
        nameEn: resolvedEn,
        mobile: mobile.trim(),
        balance: computeCustomerBalance(entries),
        entries,
      };

      commitStoreUpdate((prev) => ({
        ...prev,
        customers: [newCustomer, ...prev.customers],
      }));
      showToast(translations[storeRef.current.language].customerAddedToast);
      return newCustomer;
    },
    [commitStoreUpdate, showToast]
  );

  // Add Khata Entry (+ Udhaar or - Payment Received)
  const handleAddKhataEntry = useCallback(
    (
      customerId: string,
      type: 'udhaar' | 'jama',
      amount: number,
      note: string,
      paymentMode?: 'cash' | 'upi'
    ) => {
      const safeAmount = Math.round((Number(amount) || 0) * 100) / 100;
      if (safeAmount <= 0) return;

      const nowIso = new Date().toISOString();
      const noteMr =
        note ||
        (type === 'udhaar'
          ? translations.mr.defaultCreditNote
          : translations.mr.defaultPaymentNote);
      const noteEn =
        note ||
        (type === 'udhaar'
          ? translations.en.defaultCreditNote
          : translations.en.defaultPaymentNote);

      commitStoreUpdate((prev) => ({
        ...prev,
        customers: prev.customers.map((c) => {
          if (c.id !== customerId) return c;
          const nextEntries: KhataEntry[] = [
            {
              id: makeUniqueId('kh'),
              createdAt: nowIso,
              type,
              amount: safeAmount,
              noteMr,
              noteEn,
              paymentMode: type === 'udhaar' ? 'khata' : paymentMode || 'cash',
            },
            ...c.entries,
          ];
          return {
            ...c,
            balance: computeCustomerBalance(nextEntries),
            entries: nextEntries,
          };
        }),
      }));

      const currT = translations[storeRef.current.language];
      showToast(
        type === 'udhaar' ? currT.creditSavedToast : currT.paymentSavedToast
      );
    },
    [commitStoreUpdate, showToast]
  );

  // Complete Bill atomically for CASH, UPI, and UDHAAR (never uses stale state!)
  const handleCompleteBill = useCallback(
    (
      items: CartItem[],
      paymentMode: PaymentMode,
      customerOptions?: {
        customerId?: string;
        customerName?: string;
        customerMobile?: string;
      }
    ) => {
      const normalizedItems: CartItem[] = items
        .map((item) => {
          const qty = Math.round((Number(item.quantity) || 0) * 1000) / 1000;
          const rate = Math.round((Number(item.rate) || 0) * 100) / 100;
          const rawAmount = Number(item.amount);
          const amount =
            Number.isFinite(rawAmount) && rawAmount > 0
              ? Math.round(rawAmount * 100) / 100
              : Math.round(qty * rate * 100) / 100;
          return {
            ...item,
            quantity: qty,
            rate,
            amount,
          };
        })
        .filter((i) => i.quantity > 0 && i.amount > 0);

      if (normalizedItems.length === 0) return;

      const total =
        Math.round(
          normalizedItems.reduce((sum, i) => sum + i.amount, 0) * 100
        ) / 100;
      const nowIso = new Date().toISOString();
      const billId = makeUniqueId('bill');

      let createdBill: Bill | null = null;

      commitStoreUpdate((prev) => {
        const billNumber = prev.nextBillNumber;
        const rawTypedName = (customerOptions?.customerName || '').trim();
        const rawTypedMobile = (customerOptions?.customerMobile || '').trim();

        let targetCustomer: Customer | undefined;
        let isNewCustomer = false;

        // 1. Match by explicit customerId first
        if (customerOptions?.customerId) {
          targetCustomer = prev.customers.find(
            (c) => c.id === customerOptions.customerId
          );
        }

        // 2. Match by typed name (English, Marathi, or transliterated Marathi) or auto-create
        if (!targetCustomer && rawTypedName) {
          const lower = rawTypedName.toLowerCase();
          const isExplicitWalkIn =
            lower === 'cash customer' || lower === 'रोख ग्राहक';

          if (!isExplicitWalkIn) {
            const transliterated = toMarathiReceiptName(
              rawTypedName,
              rawTypedName
            ).toLowerCase();
            targetCustomer = prev.customers.find(
              (c) =>
                c.id !== 'cust-cash' &&
                (c.nameMr.trim().toLowerCase() === lower ||
                  c.nameEn.trim().toLowerCase() === lower ||
                  c.nameMr.trim().toLowerCase() === transliterated)
            );

            if (!targetCustomer) {
              targetCustomer = {
                id: makeUniqueId('cust'),
                nameMr: toMarathiReceiptName(rawTypedName, rawTypedName),
                nameEn: rawTypedName,
                mobile: rawTypedMobile,
                balance: 0,
                entries: [],
              };
              isNewCustomer = true;
            }
          }
        }

        // 3. Default to Cash Customer ("रोख ग्राहक / Cash Customer") when left blank
        if (!targetCustomer) {
          targetCustomer = prev.customers.find((c) => c.id === 'cust-cash');
          if (!targetCustomer) {
            targetCustomer = {
              id: 'cust-cash',
              nameMr: 'रोख ग्राहक',
              nameEn: 'Cash Customer',
              mobile: '',
              balance: 0,
              entries: [],
            };
            isNewCustomer = true;
          }
        }

        const resolvedCustomer = targetCustomer;

        const newBill: Bill = {
          id: billId,
          billNumber,
          createdAt: nowIso,
          items: normalizedItems,
          total,
          paymentMode,
          customerId: resolvedCustomer.id,
          customerNameMr: resolvedCustomer.nameMr,
          customerNameEn: resolvedCustomer.nameEn,
        };
        createdBill = newBill;

        const khataEntry: KhataEntry = {
          id: makeUniqueId(`kh-bill-${billNumber}`),
          createdAt: nowIso,
          type: paymentMode === 'khata' ? 'udhaar' : 'paid_bill',
          amount: total,
          noteMr:
            paymentMode === 'khata'
              ? `बिल क्र. #${billNumber} (${normalizedItems.length} वस्तू)`
              : paymentMode === 'upi'
                ? `बिल क्र. #${billNumber} (फोनपे / UPI)`
                : `बिल क्र. #${billNumber} (रोख)`,
          noteEn:
            paymentMode === 'khata'
              ? `Bill #${billNumber} (${normalizedItems.length} items)`
              : paymentMode === 'upi'
                ? `Bill #${billNumber} (UPI)`
                : `Bill #${billNumber} (Cash)`,
          paymentMode,
          billId,
          billNumber,
        };

        // Deduct sold stock
        const qtyByProduct = new Map<string, number>();
        normalizedItems.forEach((item) => {
          qtyByProduct.set(
            item.productId,
            (qtyByProduct.get(item.productId) || 0) + item.quantity
          );
        });

        const updatedProducts = prev.products.map((prod) => {
          const soldQty = qtyByProduct.get(prod.id);
          if (!soldQty) return prod;
          return {
            ...prod,
            stock: Math.max(0, Math.round((prod.stock - soldQty) * 1000) / 1000),
          };
        });

        const baseCustomers = isNewCustomer
          ? [resolvedCustomer, ...prev.customers]
          : prev.customers;

        const updatedCustomers = baseCustomers.map((c) => {
          if (c.id !== resolvedCustomer.id) return c;
          const nextEntries = [khataEntry, ...c.entries];
          return {
            ...c,
            mobile: c.mobile || rawTypedMobile,
            balance: computeCustomerBalance(nextEntries),
            entries: nextEntries,
          };
        });

        return {
          ...prev,
          nextBillNumber: prev.nextBillNumber + 1,
          products: updatedProducts,
          customers: updatedCustomers,
          bills: [newBill, ...prev.bills],
        };
      });

      if (createdBill) {
        setReceiptState({ bill: createdBill, isFromNewBill: true });
        showToast(translations[storeRef.current.language].billSavedToast);
      }
    },
    [commitStoreUpdate, showToast]
  );

  // Add or Edit Stock Product
  const handleSaveProduct = useCallback(
    (savedProduct: Product) => {
      commitStoreUpdate((prev) => {
        const exists = prev.products.some((p) => p.id === savedProduct.id);
        return {
          ...prev,
          products: exists
            ? prev.products.map((p) =>
                p.id === savedProduct.id ? savedProduct : p
              )
            : [savedProduct, ...prev.products],
        };
      });
      showToast(translations[storeRef.current.language].itemSavedToast);
    },
    [commitStoreUpdate, showToast]
  );

  const handleDeleteProduct = useCallback(
    (productId: string) => {
      commitStoreUpdate((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== productId),
      }));
      showToast(translations[storeRef.current.language].itemDeletedToast);
    },
    [commitStoreUpdate, showToast]
  );

  // Backup Download & Restore
  const handleDownloadBackup = useCallback(() => {
    const backupIso = downloadBackupJson(storeRef.current);
    commitStoreUpdate((prev) => ({
      ...prev,
      lastBackupAt: backupIso,
    }));
    showToast(translations[storeRef.current.language].backupDownloadedToast);
  }, [commitStoreUpdate, showToast]);

  const handleRestoreBackup = useCallback(
    (restored: StoreData) => {
      commitStoreUpdate(() => ({
        ...restored,
        language: restored.language || storeRef.current.language,
      }));
      showToast(translations[storeRef.current.language].restoreSuccessToast);
    },
    [commitStoreUpdate, showToast]
  );

  // Derived Home Screen Live Metrics
  const homeMetrics = useMemo(() => {
    const today = new Date();
    const totalPendingUdhaar = store.customers.reduce(
      (sum, c) => sum + Math.max(0, c.balance),
      0
    );
    const lowStockCount = store.products.filter(
      (p) => p.stock <= p.lowStockLimit
    ).length;
    const todayBills = store.bills.filter((b) => isSameDay(b.createdAt, today));
    const todaySalesTotal = todayBills.reduce((sum, b) => sum + b.total, 0);

    return {
      totalPendingUdhaar,
      lowStockCount,
      todaySalesTotal,
      todayBillCount: todayBills.length,
    };
  }, [store.bills, store.customers, store.products]);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 pb-10">
      <Header
        lang={lang}
        screen={screen}
        onToggleLang={handleToggleLang}
        onGoHome={() => setScreen('home')}
        onGoHisab={() => setScreen('hisab')}
      />

      {screen === 'home' && (
        <HomeScreen
          lang={lang}
          totalPendingUdhaar={homeMetrics.totalPendingUdhaar}
          lowStockCount={homeMetrics.lowStockCount}
          todaySalesTotal={homeMetrics.todaySalesTotal}
          todayBillCount={homeMetrics.todayBillCount}
          onNavigate={setScreen}
        />
      )}

      {screen === 'billing' && (
        <BillingScreen
          lang={lang}
          products={store.products}
          customers={store.customers}
          onCompleteBill={handleCompleteBill}
          onNotify={showToast}
        />
      )}

      {screen === 'khata' && (
        <KhataScreen
          lang={lang}
          customers={store.customers}
          bills={store.bills}
          onAddCustomer={handleAddCustomer}
          onAddKhataEntry={handleAddKhataEntry}
          onViewReceipt={(bill) =>
            setReceiptState({ bill, isFromNewBill: false })
          }
        />
      )}

      {screen === 'stock' && (
        <StockScreen
          lang={lang}
          products={store.products}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {screen === 'hisab' && (
        <HisabScreen
          lang={lang}
          bills={store.bills}
          customers={store.customers}
          lastBackupAt={store.lastBackupAt}
          onViewReceipt={(bill) =>
            setReceiptState({ bill, isFromNewBill: false })
          }
          onDownloadBackup={handleDownloadBackup}
          onRestoreBackup={handleRestoreBackup}
          onNotify={showToast}
        />
      )}

      {/* 80mm Marathi Thermal Receipt Modal */}
      {receiptState && (
        <ReceiptModal
          bill={receiptState.bill}
          lang={lang}
          isFromNewBill={receiptState.isFromNewBill}
          onClose={() => setReceiptState(null)}
        />
      )}

      {/* Non-blocking High-Contrast Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-xl border-2 flex items-center gap-3 text-[19px] font-extrabold max-w-[92vw] ${
            toast.tone === 'error'
              ? 'bg-red-50 border-red-600 text-red-900'
              : 'bg-emerald-800 border-emerald-700 text-white'
          }`}
        >
          {toast.tone === 'error' ? (
            <AlertCircle className="w-6 h-6 shrink-0" />
          ) : (
            <CheckCircle2 className="w-6 h-6 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
