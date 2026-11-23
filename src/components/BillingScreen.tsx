import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Barcode,
  Search,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import {
  formatQuantity,
  formatRupees,
  formatUnitRateLabel,
  getDisplayName,
  matchesProductQuery,
  translations,
} from '../i18n/translations';
import {
  CartItem,
  Customer,
  Language,
  PaymentMode,
  Product,
} from '../types/pos';

interface BillingScreenProps {
  lang: Language;
  products: Product[];
  customers: Customer[];
  onCompleteBill: (
    items: CartItem[],
    paymentMode: PaymentMode,
    customerOptions?: {
      customerId?: string;
      customerName?: string;
      customerMobile?: string;
    }
  ) => void;
  onNotify: (message: string, tone?: 'success' | 'error') => void;
}

type InlineEditField = 'qty' | 'rate' | 'total';

export function BillingScreen({
  lang,
  products,
  customers,
  onCompleteBill,
  onNotify,
}: BillingScreenProps) {
  const t = translations[lang];
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyModalInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const payModalInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    productId: string;
    field: InlineEditField;
    value: string;
  } | null>(null);

  // Direct decimal Qty/Weight popup state (NO preset buttons)
  const [qtyModalProduct, setQtyModalProduct] = useState<Product | null>(null);
  const [qtyModalValue, setQtyModalValue] = useState('1');

  // Cash / UPI Customer Name prompt modal (shown before saving if name not yet entered)
  const [pendingPayMode, setPendingPayMode] = useState<'cash' | 'upi' | null>(
    null
  );
  const [payModalName, setPayModalName] = useState('');
  const [payModalMobile, setPayModalMobile] = useState('');

  // Khata customer selector modal state (when UDHAAR clicked with blank customer)
  const [showKhataModal, setShowKhataModal] = useState(false);
  const [customerModalQuery, setCustomerModalQuery] = useState('');
  const [showInlineAddCustomer, setShowInlineAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');

  // Auto-focus search box on mount and after popups close
  useEffect(() => {
    if (!qtyModalProduct && !showKhataModal && !pendingPayMode && !editingCell) {
      searchInputRef.current?.focus();
    }
  }, [qtyModalProduct, showKhataModal, pendingPayMode, editingCell]);

  // Auto-focus customer name input when Cash / UPI modal opens
  useEffect(() => {
    if (pendingPayMode) {
      const id = window.setTimeout(() => {
        payModalInputRef.current?.focus();
      }, 20);
      return () => window.clearTimeout(id);
    }
  }, [pendingPayMode]);

  // Auto-focus and select text in Decimal Qty modal
  useEffect(() => {
    if (qtyModalProduct) {
      const id = window.setTimeout(() => {
        qtyModalInputRef.current?.focus();
        qtyModalInputRef.current?.select();
      }, 20);
      return () => window.clearTimeout(id);
    }
  }, [qtyModalProduct]);

  // Auto-focus and select text in inline Q / R / T edit cell
  useEffect(() => {
    if (editingCell) {
      const id = window.setTimeout(() => {
        inlineInputRef.current?.focus();
        inlineInputRef.current?.select();
      }, 10);
      return () => window.clearTimeout(id);
    }
  }, [editingCell?.productId, editingCell?.field]);

  const startInlineEdit = (productId: string, field: InlineEditField) => {
    const row = cart.find((item) => item.productId === productId);
    if (!row) return;
    setSelectedRowId(productId);
    const initialVal =
      field === 'qty'
        ? String(row.quantity)
        : field === 'rate'
          ? String(row.rate)
          : String(row.amount);
    setEditingCell({ productId, field, value: initialVal });
  };

  // Keyboard hotkeys Q (Qty), R (Rate), T (Temp Total) for selected bill row
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (qtyModalProduct || showKhataModal || pendingPayMode || editingCell) {
        return;
      }

      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select'
      ) {
        return;
      }

      if (!selectedRowId) return;
      const key = e.key.toLowerCase();
      if (key === 'q') {
        e.preventDefault();
        startInlineEdit(selectedRowId, 'qty');
      } else if (key === 'r') {
        e.preventDefault();
        startInlineEdit(selectedRowId, 'rate');
      } else if (key === 't') {
        e.preventDefault();
        startInlineEdit(selectedRowId, 'total');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    qtyModalProduct,
    showKhataModal,
    pendingPayMode,
    editingCell,
    selectedRowId,
    cart,
  ]);

  // Unified filtered product list (Phonetic Marathi + Marathi script + English + Barcode)
  const filteredProducts = useMemo(
    () => products.filter((p) => matchesProductQuery(p, searchQuery)),
    [products, searchQuery]
  );

  // Named customers (excluding default Cash Customer from suggestions)
  const namedCustomers = useMemo(
    () => customers.filter((c) => c.id !== 'cust-cash'),
    [customers]
  );

  const customerSuggestions = useMemo(() => {
    const q = customerNameInput.trim().toLowerCase();
    if (!q) return namedCustomers.slice(0, 6);
    return namedCustomers
      .filter(
        (c) =>
          c.nameMr.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.mobile.includes(q)
      )
      .slice(0, 6);
  }, [namedCustomers, customerNameInput]);

  const filteredModalCustomers = useMemo(() => {
    const q = customerModalQuery.trim().toLowerCase();
    if (!q) return namedCustomers;
    return namedCustomers.filter(
      (c) =>
        c.nameMr.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.mobile.includes(q)
    );
  }, [namedCustomers, customerModalQuery]);

  const filteredPayModalCustomers = useMemo(() => {
    const q = payModalName.trim().toLowerCase();
    if (!q) return namedCustomers.slice(0, 6);
    return namedCustomers
      .filter(
        (c) =>
          c.nameMr.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.mobile.includes(q)
      )
      .slice(0, 6);
  }, [namedCustomers, payModalName]);

  const billTotal = useMemo(
    () =>
      Math.round(cart.reduce((sum, item) => sum + item.amount, 0) * 100) / 100,
    [cart]
  );

  const openDecimalQtyModal = (product: Product) => {
    setQtyModalProduct(product);
    setQtyModalValue('1');
  };

  const addItemToCart = (product: Product, quantityToAdd: number) => {
    if (quantityToAdd <= 0 || Number.isNaN(quantityToAdd)) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const nextQty =
          Math.round((updated[existingIndex].quantity + quantityToAdd) * 1000) /
          1000;
        const rate = updated[existingIndex].rate;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: nextQty,
          amount: Math.max(0.01, Math.round(nextQty * rate * 100) / 100),
          isTempTotal: false,
        };
        return updated;
      }
      const amount = Math.max(
        0.01,
        Math.round(quantityToAdd * product.rate * 100) / 100
      );
      return [
        ...prev,
        {
          productId: product.id,
          nameMr: product.nameMr,
          nameEn: product.nameEn,
          unit: product.unit,
          bagWeightKg: product.bagWeightKg,
          rate: product.rate,
          quantity: Math.round(quantityToAdd * 1000) / 1000,
          amount,
          isTempTotal: false,
        },
      ];
    });
    setSelectedRowId(product.id);
  };

  const handleConfirmQtyModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtyModalProduct) return;
    const parsed = Number(qtyModalValue);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    addItemToCart(qtyModalProduct, parsed);
    setQtyModalProduct(null);
    setQtyModalValue('1');
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // 1. Exact barcode match
    const exactBarcode = products.find((p) => p.barcode === q);
    if (exactBarcode) {
      openDecimalQtyModal(exactBarcode);
      return;
    }

    // 2. First matching item from phonetic/bilingual search
    if (filteredProducts.length > 0) {
      openDecimalQtyModal(filteredProducts[0]);
      return;
    }

    onNotify(t.barcodeNotFoundToast, 'error');
  };

  const commitInlineEdit = () => {
    if (!editingCell) return;
    const num = Number(editingCell.value);
    if (!Number.isNaN(num) && num > 0) {
      setCart((prev) =>
        prev.map((item) => {
          if (item.productId !== editingCell.productId) return item;
          if (editingCell.field === 'qty') {
            const nextQty = Math.round(num * 1000) / 1000;
            return {
              ...item,
              quantity: nextQty,
              amount: Math.round(nextQty * item.rate * 100) / 100,
              isTempTotal: false,
            };
          }
          if (editingCell.field === 'rate') {
            const nextRate = Math.round(num * 100) / 100;
            return {
              ...item,
              rate: nextRate,
              amount: Math.round(item.quantity * nextRate * 100) / 100,
              isTempTotal: false,
            };
          }
          // Temporary Total ('T') — overrides row amount for this bill only without changing master rate
          return {
            ...item,
            amount: Math.round(num * 100) / 100,
            isTempTotal: true,
          };
        })
      );
    }
    setEditingCell(null);
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    if (selectedRowId === productId) {
      setSelectedRowId(null);
    }
    if (editingCell?.productId === productId) {
      setEditingCell(null);
    }
  };

  const getCommittedCart = (): CartItem[] => {
    if (!editingCell) return cart;
    const num = Number(editingCell.value);
    if (Number.isNaN(num) || num <= 0) return cart;
    return cart.map((item) => {
      if (item.productId !== editingCell.productId) return item;
      if (editingCell.field === 'qty') {
        const nextQty = Math.round(num * 1000) / 1000;
        return {
          ...item,
          quantity: nextQty,
          amount: Math.round(nextQty * item.rate * 100) / 100,
          isTempTotal: false,
        };
      }
      if (editingCell.field === 'rate') {
        const nextRate = Math.round(num * 100) / 100;
        return {
          ...item,
          rate: nextRate,
          amount: Math.round(item.quantity * nextRate * 100) / 100,
          isTempTotal: false,
        };
      }
      return {
        ...item,
        amount: Math.round(num * 100) / 100,
        isTempTotal: true,
      };
    });
  };

  const resetBillState = () => {
    setCart([]);
    setSelectedRowId(null);
    setEditingCell(null);
    setSearchQuery('');
    setCustomerNameInput('');
    setSelectedCustomerId(null);
  };

  const handlePayCashOrUpi = (mode: 'cash' | 'upi') => {
    const finalCart = getCommittedCart();
    if (finalCart.length === 0) return;
    if (editingCell) {
      setCart(finalCart);
      setEditingCell(null);
    }
    const trimmedName = customerNameInput.trim();
    // If customer name is already entered/selected at the top, save directly under that customer
    if (selectedCustomerId || trimmedName) {
      onCompleteBill(finalCart, mode, {
        customerId: selectedCustomerId || undefined,
        customerName: trimmedName || undefined,
      });
      resetBillState();
      return;
    }
    // Otherwise ask for customer name BEFORE saving the Cash/UPI bill
    setPendingPayMode(mode);
    setPayModalName('');
    setPayModalMobile('');
  };

  const handleConfirmPayWithName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPayMode) return;
    const finalCart = getCommittedCart();
    const trimmedName = payModalName.trim();
    if (finalCart.length === 0 || !trimmedName) return;

    onCompleteBill(finalCart, pendingPayMode, {
      customerName: trimmedName,
      customerMobile: payModalMobile.trim() || undefined,
    });
    setPendingPayMode(null);
    setPayModalName('');
    setPayModalMobile('');
    resetBillState();
  };

  const handleConfirmPayForExistingCustomer = (customerId: string) => {
    if (!pendingPayMode) return;
    const finalCart = getCommittedCart();
    if (finalCart.length === 0) return;

    onCompleteBill(finalCart, pendingPayMode, { customerId });
    setPendingPayMode(null);
    setPayModalName('');
    setPayModalMobile('');
    resetBillState();
  };

  const handleConfirmPayAsWalkIn = () => {
    if (!pendingPayMode) return;
    const finalCart = getCommittedCart();
    if (finalCart.length === 0) return;

    onCompleteBill(finalCart, pendingPayMode);
    setPendingPayMode(null);
    setPayModalName('');
    setPayModalMobile('');
    resetBillState();
  };

  const handleClickUdhaar = () => {
    const finalCart = getCommittedCart();
    if (finalCart.length === 0) return;
    if (editingCell) {
      setCart(finalCart);
      setEditingCell(null);
    }
    const trimmedName = customerNameInput.trim();
    if (selectedCustomerId || trimmedName) {
      onCompleteBill(finalCart, 'khata', {
        customerId: selectedCustomerId || undefined,
        customerName: trimmedName || undefined,
      });
      resetBillState();
      return;
    }
    setShowKhataModal(true);
    setCustomerModalQuery('');
    setShowInlineAddCustomer(false);
  };

  const handleConfirmKhataForCustomer = (customerId: string) => {
    const finalCart = getCommittedCart();
    if (finalCart.length === 0) return;
    onCompleteBill(finalCart, 'khata', { customerId });
    resetBillState();
    setShowKhataModal(false);
    setCustomerModalQuery('');
    setShowInlineAddCustomer(false);
  };

  const handleInlineCustomerCreateAndBill = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCart = getCommittedCart();
    const trimmedName = newCustName.trim();
    const trimmedMobile = newCustMobile.trim();
    if (!trimmedName || finalCart.length === 0) return;
    // Atomic single call creates the customer AND saves their Udhaar bill + amount together!
    onCompleteBill(finalCart, 'khata', {
      customerName: trimmedName,
      customerMobile: trimmedMobile,
    });
    setNewCustName('');
    setNewCustMobile('');
    resetBillState();
    setShowKhataModal(false);
    setCustomerModalQuery('');
    setShowInlineAddCustomer(false);
  };

  const parsedQtyModal = Number(qtyModalValue);
  const qtyModalValid = !Number.isNaN(parsedQtyModal) && parsedQtyModal > 0;

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDE: Unified Search + Single Merged Product List */}
        <section className="lg:col-span-5 bg-white rounded-2xl border-2 border-slate-200 overflow-hidden flex flex-col">
          {/* Auto-focused Phonetic + Bilingual Search / Barcode Box */}
          <div className="p-4 border-b-2 border-slate-200 bg-slate-50">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-emerald-700 pointer-events-none">
                <Barcode className="w-7 h-7" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t.scanOrSearchPlaceholder}
                className="w-full h-16 pl-14 pr-12 rounded-xl bg-white border-2 border-slate-300 focus:border-emerald-600 text-[19px] font-semibold text-slate-900 placeholder:text-slate-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label={t.closeBtn}
                  className="absolute right-3 w-10 h-10 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[18px] text-slate-600 font-semibold px-1">
              <span>{t.allProductsCatalogTitle}</span>
              <span className="tabular-nums">
                {filteredProducts.length} / {products.length}
              </span>
            </div>
          </div>

          {/* Single Unified Product List (All Loose + Packaged Items Together) */}
          <div className="divide-y divide-slate-200 max-h-[650px] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="py-12 px-6 text-center text-[20px] font-bold text-slate-500">
                {t.noMatchingItem}
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => openDecimalQtyModal(product)}
                  className="w-full text-left px-4 py-3.5 hover:bg-emerald-50 active:bg-emerald-100 transition flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[19px] font-extrabold text-slate-900 leading-snug truncate">
                      {getDisplayName(product, lang)}
                    </div>
                    <div className="text-[18px] text-slate-500 font-medium truncate">
                      {lang === 'mr' ? product.nameEn : product.nameMr}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[20px] font-extrabold text-emerald-800 tabular-nums">
                      {formatRupees(product.rate)}
                      <span className="text-[18px] font-semibold text-slate-600">
                        /{formatUnitRateLabel(product.unit, lang, product.bagWeightKg)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* RIGHT SIDE: Customer Name + Auto-Expanding 4-Col Horizontal Bill Table + Q/R/T Hotkeys + Payment */}
        <section className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-300 shadow-sm flex flex-col">
          {/* Customer Name Input (Always visible & saved on ALL bills: CASH, UPI, UDHAAR) */}
          <div className="px-5 py-4 bg-slate-50 border-b-2 border-slate-200 space-y-3 rounded-t-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-[22px] font-extrabold text-slate-900">
                  {t.currentBillTitle}{' '}
                  <span className="text-slate-500 font-bold tabular-nums">
                    ({cart.length})
                  </span>
                </h2>
                <div className="text-[18px] font-bold text-blue-800 truncate mt-0.5">
                  {t.receiptCustomer}:{' '}
                  {customerNameInput.trim() ||
                    (lang === 'mr'
                      ? t.defaultCashCustomerMr
                      : t.defaultCashCustomerEn)}
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setSelectedRowId(null);
                    setEditingCell(null);
                  }}
                  className="px-4 py-1.5 min-h-[42px] rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[18px] font-bold transition cursor-pointer whitespace-nowrap"
                >
                  {t.clearBillBtn}
                </button>
              )}
            </div>

            <div className="relative">
              <label className="block text-[18px] font-bold text-slate-700 mb-1.5">
                {t.customerNameInputLabel}
              </label>
              <div className="relative flex items-center">
                <User className="w-6 h-6 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={customerNameInput}
                  onFocus={() => setShowCustomerSuggestions(true)}
                  onBlur={() => {
                    window.setTimeout(
                      () => setShowCustomerSuggestions(false),
                      160
                    );
                  }}
                  onChange={(e) => {
                    setCustomerNameInput(e.target.value);
                    setSelectedCustomerId(null);
                    setShowCustomerSuggestions(true);
                  }}
                  placeholder={t.customerNameInputPlaceholder}
                  className="w-full h-14 pl-12 pr-11 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 text-[19px] font-semibold text-slate-900 placeholder:text-slate-400"
                />
                {customerNameInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerNameInput('');
                      setSelectedCustomerId(null);
                    }}
                    aria-label={t.closeBtn}
                    className="absolute right-2.5 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Customer Autocomplete Suggestions */}
              {showCustomerSuggestions && customerSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border-2 border-slate-300 rounded-xl shadow-lg max-h-[220px] overflow-y-auto divide-y divide-slate-100">
                  {customerSuggestions.map((cust) => (
                    <button
                      key={cust.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCustomerNameInput(getDisplayName(cust, lang));
                        setSelectedCustomerId(cust.id);
                        setShowCustomerSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="text-[19px] font-bold text-slate-900">
                        {getDisplayName(cust, lang)}
                      </span>
                      <span className="text-[18px] text-slate-600 tabular-nums">
                        {cust.mobile}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hotkey Action Bar (Q, R, T) */}
          {cart.length > 0 && (
            <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[18px] font-bold text-blue-950">
                {t.hotkeyBarHint}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!selectedRowId}
                  onClick={() =>
                    selectedRowId && startInlineEdit(selectedRowId, 'qty')
                  }
                  className="px-3.5 py-1.5 min-h-[42px] rounded-lg bg-white hover:bg-blue-600 hover:text-white disabled:opacity-50 border-2 border-blue-300 text-blue-950 text-[18px] font-extrabold transition cursor-pointer whitespace-nowrap"
                >
                  {t.hotkeyQtyLabel}
                </button>
                <button
                  type="button"
                  disabled={!selectedRowId}
                  onClick={() =>
                    selectedRowId && startInlineEdit(selectedRowId, 'rate')
                  }
                  className="px-3.5 py-1.5 min-h-[42px] rounded-lg bg-white hover:bg-blue-600 hover:text-white disabled:opacity-50 border-2 border-blue-300 text-blue-950 text-[18px] font-extrabold transition cursor-pointer whitespace-nowrap"
                >
                  {t.hotkeyRateLabel}
                </button>
                <button
                  type="button"
                  disabled={!selectedRowId}
                  onClick={() =>
                    selectedRowId && startInlineEdit(selectedRowId, 'total')
                  }
                  className="px-3.5 py-1.5 min-h-[42px] rounded-lg bg-white hover:bg-amber-600 hover:text-white disabled:opacity-50 border-2 border-amber-400 text-amber-950 text-[18px] font-extrabold transition cursor-pointer whitespace-nowrap"
                >
                  {t.hotkeyTempTotalLabel}
                </button>
              </div>
            </div>
          )}

          {/* Auto-Expanding Horizontal 4-Column Bill Table: [Item Name] | [Qty] | [Rate] | [Total] */}
          <div className="min-h-[200px] h-auto">
            {cart.length === 0 ? (
              <div className="py-14 px-6 text-center">
                <div className="text-[22px] font-bold text-slate-500">
                  {t.emptyBillMessage}
                </div>
                <p className="mt-2 text-[18px] text-slate-400 font-medium">
                  {t.emptyBillSubMessage}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 border-b-2 border-slate-200">
                  <tr className="text-[18px] text-slate-800">
                    <th className="py-3 px-4 font-extrabold">{t.colBillItem}</th>
                    <th className="py-3 px-3 font-extrabold text-right whitespace-nowrap">
                      {t.colBillQty}
                    </th>
                    <th className="py-3 px-3 font-extrabold text-right whitespace-nowrap">
                      {t.colBillRate}
                    </th>
                    <th className="py-3 px-4 font-extrabold text-right whitespace-nowrap">
                      {t.colBillTotal}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[19px]">
                  {cart.map((item) => {
                    const isSelected = selectedRowId === item.productId;
                    const isEditingQty =
                      editingCell?.productId === item.productId &&
                      editingCell.field === 'qty';
                    const isEditingRate =
                      editingCell?.productId === item.productId &&
                      editingCell.field === 'rate';
                    const isEditingTotal =
                      editingCell?.productId === item.productId &&
                      editingCell.field === 'total';

                    return (
                      <tr
                        key={item.productId}
                        onClick={() => {
                          if (!editingCell) {
                            setSelectedRowId(item.productId);
                            // Blur search box so Q / R / T hotkeys fire right away
                            if (
                              document.activeElement instanceof HTMLElement &&
                              document.activeElement.tagName === 'INPUT'
                            ) {
                              document.activeElement.blur();
                            }
                          }
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 ring-2 ring-inset ring-blue-500'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Col 1: Item Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-900 leading-snug">
                              {getDisplayName(item, lang)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCartItem(item.productId);
                              }}
                              aria-label={t.deleteBtn}
                              className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                        {/* Col 2: Qty */}
                        <td
                          className="py-3.5 px-3 text-right whitespace-nowrap tabular-nums"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startInlineEdit(item.productId, 'qty');
                          }}
                        >
                          {isEditingQty ? (
                            <input
                              ref={inlineInputRef}
                              type="number"
                              step="any"
                              min="0.01"
                              value={editingCell.value}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setEditingCell({
                                  ...editingCell,
                                  value: e.target.value,
                                })
                              }
                              onBlur={commitInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  commitInlineEdit();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setEditingCell(null);
                                }
                              }}
                              className="w-24 h-11 px-2 text-right rounded-lg bg-white border-2 border-blue-600 text-[19px] font-extrabold text-slate-900 tabular-nums"
                            />
                          ) : (
                            <span className="font-bold text-slate-800">
                              {formatQuantity(
                                item.quantity,
                                item.unit,
                                lang,
                                item.bagWeightKg
                              )}
                            </span>
                          )}
                        </td>

                        {/* Col 3: Rate */}
                        <td
                          className="py-3.5 px-3 text-right whitespace-nowrap tabular-nums"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startInlineEdit(item.productId, 'rate');
                          }}
                        >
                          {isEditingRate ? (
                            <input
                              ref={inlineInputRef}
                              type="number"
                              step="any"
                              min="0.5"
                              value={editingCell.value}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setEditingCell({
                                  ...editingCell,
                                  value: e.target.value,
                                })
                              }
                              onBlur={commitInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  commitInlineEdit();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setEditingCell(null);
                                }
                              }}
                              className="w-24 h-11 px-2 text-right rounded-lg bg-white border-2 border-blue-600 text-[19px] font-extrabold text-slate-900 tabular-nums"
                            />
                          ) : (
                            <span className="font-semibold text-slate-700">
                              {formatRupees(item.rate)}
                            </span>
                          )}
                        </td>

                        {/* Col 4: Total (Supports Temporary Total via 'T') */}
                        <td
                          className="py-3.5 px-4 text-right whitespace-nowrap tabular-nums"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startInlineEdit(item.productId, 'total');
                          }}
                        >
                          {isEditingTotal ? (
                            <input
                              ref={inlineInputRef}
                              type="number"
                              step="any"
                              min="0.5"
                              value={editingCell.value}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setEditingCell({
                                  ...editingCell,
                                  value: e.target.value,
                                })
                              }
                              onBlur={commitInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  commitInlineEdit();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setEditingCell(null);
                                }
                              }}
                              className="w-28 h-11 px-2 text-right rounded-lg bg-amber-50 border-2 border-amber-600 text-[19px] font-extrabold text-slate-900 tabular-nums"
                            />
                          ) : (
                            <span
                              className={`font-extrabold text-[20px] ${
                                item.isTempTotal
                                  ? 'text-amber-800 underline decoration-amber-500 decoration-2 underline-offset-4'
                                  : 'text-slate-900'
                              }`}
                            >
                              {formatRupees(item.amount)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Huge Total Amount Box + 3 Large 1-Click Payment Buttons */}
          <div className="p-5 bg-slate-50 border-t-2 border-slate-200 space-y-4 rounded-b-2xl">
            <div className="bg-white rounded-2xl border-2 border-slate-900 px-5 py-4 flex items-center justify-between gap-3">
              <span className="text-[22px] font-bold text-slate-700">
                {t.totalAmountLabel}
              </span>
              <span className="text-[36px] sm:text-[40px] font-extrabold text-slate-900 tabular-nums leading-none">
                {formatRupees(billTotal)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Green: CASH */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => handlePayCashOrUpi('cash')}
                className="w-full min-h-[64px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 active:scale-[0.99] text-white text-[21px] font-extrabold transition cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                {t.payCashBtn}
              </button>

              {/* Blue: PhonePe / UPI */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => handlePayCashOrUpi('upi')}
                className="w-full min-h-[64px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 active:scale-[0.99] text-white text-[20px] font-extrabold transition cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                {t.payUpiBtn}
              </button>

              {/* Orange: Udhaar */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleClickUdhaar}
                className="w-full min-h-[64px] px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:text-slate-500 active:scale-[0.99] text-white text-[21px] font-extrabold transition cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                {t.payKhataBtn}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* DIRECT DECIMAL WEIGHT / QUANTITY INPUT MODAL (NO PRESET BUTTONS) */}
      {qtyModalProduct && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.qtyModalTitle}
        >
          <div className="bg-white rounded-2xl border-2 border-slate-200 max-w-[480px] w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-extrabold leading-tight">
                  {getDisplayName(qtyModalProduct, lang)}
                </h3>
                <p className="text-[18px] text-emerald-100 font-semibold tabular-nums">
                  {formatRupees(qtyModalProduct.rate)} /{' '}
                  {formatUnitRateLabel(
                    qtyModalProduct.unit,
                    lang,
                    qtyModalProduct.bagWeightKg
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQtyModalProduct(null)}
                aria-label={t.closeBtn}
                className="w-11 h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleConfirmQtyModal} className="p-6 space-y-5">
              <div>
                <label className="block text-[19px] font-bold text-slate-800 mb-2">
                  {qtyModalProduct.unit === 'kg'
                    ? t.qtyInputLabelKg
                    : qtyModalProduct.unit === 'katta'
                      ? t.qtyInputLabelKatta
                      : t.qtyInputLabelPiece}
                </label>
                <input
                  ref={qtyModalInputRef}
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={qtyModalValue}
                  onChange={(e) => setQtyModalValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setQtyModalProduct(null);
                    }
                  }}
                  className="w-full h-18 px-5 rounded-xl bg-slate-50 border-2 border-emerald-600 focus:bg-white text-[34px] font-extrabold text-slate-900 tabular-nums"
                />
                <p className="mt-2.5 text-[18px] font-semibold text-slate-600 leading-snug">
                  {qtyModalProduct.unit === 'kg'
                    ? t.qtyModalHelperKg
                    : qtyModalProduct.unit === 'katta'
                      ? t.qtyModalHelperKatta
                      : t.qtyModalHelperPiece}
                </p>
              </div>

              {/* Live Calculated Preview */}
              <div className="px-4 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[20px]">
                <span className="font-bold text-emerald-950">
                  {qtyModalValid
                    ? formatQuantity(
                        parsedQtyModal,
                        qtyModalProduct.unit,
                        lang,
                        qtyModalProduct.bagWeightKg
                      )
                    : '—'}
                </span>
                <span className="text-[26px] font-extrabold text-emerald-800 tabular-nums">
                  {qtyModalValid
                    ? formatRupees(parsedQtyModal * qtyModalProduct.rate)
                    : '₹0'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setQtyModalProduct(null)}
                  className="min-h-[56px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-[19px] font-bold cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={!qtyModalValid}
                  className="min-h-[56px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[20px] font-extrabold cursor-pointer disabled:cursor-not-allowed"
                >
                  {t.addToBillBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CASH / UPI CUSTOMER NAME PROMPT MODAL (BEFORE SAVING BILL) */}
      {pendingPayMode && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={
            pendingPayMode === 'cash'
              ? t.cashUpiCustomerModalTitleCash
              : t.cashUpiCustomerModalTitleUpi
          }
        >
          <div className="bg-white rounded-2xl border-2 border-slate-200 max-w-[540px] w-full shadow-2xl overflow-hidden my-auto">
            <div
              className={`px-6 py-4 text-white flex items-center justify-between gap-4 ${
                pendingPayMode === 'cash' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
            >
              <div>
                <h3 className="text-[22px] font-extrabold leading-tight">
                  {pendingPayMode === 'cash'
                    ? t.cashUpiCustomerModalTitleCash
                    : t.cashUpiCustomerModalTitleUpi}
                </h3>
                <p className="text-[20px] font-extrabold text-white/90 tabular-nums mt-0.5">
                  {t.totalAmountLabel}: {formatRupees(billTotal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingPayMode(null)}
                aria-label={t.closeBtn}
                className={`w-11 h-11 rounded-xl text-white flex items-center justify-center cursor-pointer ${
                  pendingPayMode === 'cash'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-blue-700 hover:bg-blue-800'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleConfirmPayWithName}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[19px] font-bold text-slate-800 mb-1.5">
                  {t.enterCustomerNameRequiredLabel}
                </label>
                <div className="relative flex items-center">
                  <User className="w-6 h-6 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    ref={payModalInputRef}
                    type="text"
                    required
                    value={payModalName}
                    onChange={(e) => setPayModalName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setPendingPayMode(null);
                      }
                    }}
                    placeholder={t.enterCustomerNameRequiredPlaceholder}
                    className="w-full h-15 pl-12 pr-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white text-[20px] font-bold text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[18px] font-bold text-slate-700 mb-1.5">
                  {t.customerMobileOptionalLabel}
                </label>
                <input
                  type="tel"
                  value={payModalMobile}
                  onChange={(e) => setPayModalMobile(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full h-13 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white text-[19px] font-semibold tabular-nums"
                />
              </div>

              {filteredPayModalCustomers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[18px] font-bold text-slate-600">
                    {t.matchingCustomersLabel}
                  </div>
                  <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
                    {filteredPayModalCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() =>
                          handleConfirmPayForExistingCustomer(customer.id)
                        }
                        className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 transition flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="text-[19px] font-extrabold text-slate-900 truncate">
                          {getDisplayName(customer, lang)}
                        </span>
                        <span className="text-[18px] text-slate-600 font-semibold tabular-nums shrink-0">
                          {customer.mobile || '—'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingPayMode(null)}
                  className="min-h-[56px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-[19px] font-bold cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={!payModalName.trim()}
                  className={`min-h-[56px] rounded-xl text-white text-[20px] font-extrabold transition cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    pendingPayMode === 'cash'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {t.saveBillWithCustomerBtn}
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmPayAsWalkIn}
                className="w-full min-h-[48px] rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-[18px] font-bold transition cursor-pointer"
              >
                {t.saveAsWalkInCashBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QUICK KHATA CUSTOMER SELECTOR MODAL (WHEN UDHAAR CLICKED WITH BLANK NAME) */}
      {showKhataModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={t.selectKhataCustomerTitle}
        >
          <div className="bg-white rounded-2xl border-2 border-slate-200 max-w-[560px] w-full shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 bg-orange-600 text-white flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[22px] font-extrabold leading-tight">
                  {t.selectKhataCustomerTitle}
                </h3>
                <p className="text-[20px] font-extrabold text-orange-100 tabular-nums mt-0.5">
                  {t.totalAmountLabel}: {formatRupees(billTotal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowKhataModal(false)}
                aria-label={t.closeBtn}
                className="w-12 h-12 rounded-xl bg-orange-700 hover:bg-orange-800 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!showInlineAddCustomer ? (
                <>
                  <div className="relative">
                    <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={customerModalQuery}
                      onChange={(e) => setCustomerModalQuery(e.target.value)}
                      placeholder={t.searchCustomerPlaceholder}
                      className="w-full h-14 pl-12 pr-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-orange-600 focus:bg-white text-[19px] font-semibold"
                    />
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2.5">
                    {filteredModalCustomers.length === 0 ? (
                      <p className="py-6 text-center text-[19px] text-slate-500 font-semibold">
                        {t.noCustomersFound}
                      </p>
                    ) : (
                      filteredModalCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleConfirmKhataForCustomer(customer.id)}
                          className="w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-500 transition flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div>
                            <div className="text-[20px] font-extrabold text-slate-900">
                              {getDisplayName(customer, lang)}
                            </div>
                            <div className="text-[18px] text-slate-600 font-medium tabular-nums">
                              {customer.mobile || '—'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[18px] font-extrabold text-red-700 tabular-nums">
                              {customer.balance > 0
                                ? `${t.pendingBalancePrefix} ${formatRupees(customer.balance)}`
                                : t.clearedBalanceText}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowInlineAddCustomer(true)}
                    className="w-full min-h-[54px] rounded-xl bg-orange-50 hover:bg-orange-100 border-2 border-orange-300 text-orange-900 text-[19px] font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>{t.orAddNewCustomer}</span>
                  </button>
                </>
              ) : (
                <form
                  onSubmit={handleInlineCustomerCreateAndBill}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[18px] font-bold text-slate-700 mb-1.5">
                      {lang === 'mr'
                        ? t.customerNameMrLabel
                        : t.customerNameEnLabel}
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-orange-600 text-[19px] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[18px] font-bold text-slate-700 mb-1.5">
                      {t.customerMobileLabel}
                    </label>
                    <input
                      type="tel"
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value)}
                      placeholder="98XXXXXXXX"
                      className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-orange-600 text-[19px] font-semibold tabular-nums"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInlineAddCustomer(false)}
                      className="min-h-[54px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[19px] font-bold cursor-pointer"
                    >
                      {t.backBtn}
                    </button>
                    <button
                      type="submit"
                      className="min-h-[54px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[19px] font-extrabold cursor-pointer"
                    >
                      {t.confirmUdhaarBillBtn}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
