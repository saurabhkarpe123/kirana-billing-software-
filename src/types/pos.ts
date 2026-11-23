export type Language = 'mr' | 'en';

export type Screen = 'home' | 'billing' | 'khata' | 'stock' | 'hisab';

export type UnitType = 'kg' | 'piece' | 'katta';

export type PaymentMode = 'cash' | 'upi' | 'khata';

export interface Product {
  id: string;
  nameMr: string;
  nameEn: string;
  phonetic: string; // Phonetic Marathi keywords in English letters (e.g. "sakhar tandul dal katta")
  barcode: string;
  unit: UnitType;
  bagWeightKg?: number; // Bag weight in kg when unit === 'katta' (e.g. 30 or 50)
  rate: number; // Selling price per kg, per piece, or per katta bag (in ₹)
  stock: number; // Current stock in kg, pieces, or bags
  lowStockLimit: number;
}

export interface CartItem {
  productId: string;
  nameMr: string;
  nameEn: string;
  unit: UnitType;
  bagWeightKg?: number;
  rate: number;
  quantity: number; // In kg (e.g., 0.1, 0.25, 0.5, 1), pieces (1, 2), or katta bags (1, 2)
  amount: number;
  isTempTotal?: boolean; // True when user edited Total directly via 'T' hotkey
}

export interface Bill {
  id: string;
  billNumber: number;
  createdAt: string; // ISO string
  items: CartItem[];
  total: number;
  paymentMode: PaymentMode;
  customerId?: string;
  customerNameMr: string;
  customerNameEn: string;
}

export interface KhataEntry {
  id: string;
  createdAt: string; // ISO string
  type: 'udhaar' | 'jama' | 'paid_bill';
  amount: number;
  noteMr: string;
  noteEn: string;
  paymentMode?: PaymentMode;
  billId?: string;
  billNumber?: number;
}

export interface Customer {
  id: string;
  nameMr: string;
  nameEn: string;
  mobile: string;
  balance: number; // Positive = customer owes shop (बाकी आहे)
  entries: KhataEntry[];
}

export interface StoreData {
  version: number;
  language: Language;
  nextBillNumber: number;
  lastSavedAt: string;
  lastBackupAt: string | null;
  products: Product[];
  customers: Customer[];
  bills: Bill[];
}
