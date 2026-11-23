import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MessageCircle,
  MinusCircle,
  Phone,
  PlusCircle,
  Printer,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import {
  formatDateShort,
  formatDateTime,
  formatPaymentMode,
  formatQuantity,
  formatRupees,
  getDisplayName,
  toLocalDateKey,
  translations,
} from '../i18n/translations';
import { Bill, Customer, KhataEntry, Language } from '../types/pos';
import { toMarathiReceiptName } from '../utils/transliterate';

interface KhataScreenProps {
  lang: Language;
  customers: Customer[];
  bills: Bill[];
  onAddCustomer: (
    nameMr: string,
    nameEn: string,
    mobile: string,
    openingBalance: number
  ) => Customer;
  onAddKhataEntry: (
    customerId: string,
    type: 'udhaar' | 'jama',
    amount: number,
    note: string,
    paymentMode?: 'cash' | 'upi'
  ) => void;
  onViewReceipt: (bill: Bill) => void;
}

type DateFilterMode = 'all' | 'today' | 'yesterday' | 'custom';

export function KhataScreen({
  lang,
  customers,
  bills,
  onAddCustomer,
  onAddKhataEntry,
  onViewReceipt,
}: KhataScreenProps) {
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<
    'all' | 'udhaar' | 'cash_upi'
  >('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );

  // Date filter inside Customer Passbook
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [customDateKey, setCustomDateKey] = useState(() =>
    toLocalDateKey(new Date())
  );

  // Selected entry IDs for Multi-Bill WhatsApp Share
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

  // Add Customer Modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [nameMr, setNameMr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [mobile, setMobile] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  // Passbook Action Modal ('udhaar' | 'jama' | null)
  const [entryModalType, setEntryModalType] = useState<'udhaar' | 'jama' | null>(
    null
  );
  const [entryAmount, setEntryAmount] = useState('');
  const [entryNote, setEntryNote] = useState('');
  const [jamaPaymentMode, setJamaPaymentMode] = useState<'cash' | 'upi'>('cash');

  const billsById = useMemo(
    () => new Map(bills.map((b) => [b.id, b])),
    [bills]
  );

  const billsByNumber = useMemo(
    () => new Map(bills.map((b) => [b.billNumber, b])),
    [bills]
  );

  const findLinkedBill = (entry: KhataEntry): Bill | undefined => {
    if (entry.billId && billsById.has(entry.billId)) {
      return billsById.get(entry.billId);
    }
    if (entry.billNumber && billsByNumber.has(entry.billNumber)) {
      return billsByNumber.get(entry.billNumber);
    }
    return undefined;
  };

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = customers.filter((c) => {
      if (customerFilter === 'udhaar' && c.balance <= 0) return false;
      if (customerFilter === 'cash_upi') {
        const hasCashOrUpi = c.entries.some(
          (e) =>
            e.type === 'paid_bill' ||
            e.paymentMode === 'cash' ||
            e.paymentMode === 'upi'
        );
        if (!hasCashOrUpi) return false;
      }
      if (!q) return true;
      return (
        c.nameMr.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.mobile.includes(q)
      );
    });
    return [...list].sort((a, b) => {
      const aLatest = a.entries[0] ? new Date(a.entries[0].createdAt).getTime() : 0;
      const bLatest = b.entries[0] ? new Date(b.entries[0].createdAt).getTime() : 0;
      if (customerFilter === 'cash_upi') {
        return bLatest - aLatest;
      }
      if (b.balance !== a.balance) return b.balance - a.balance;
      return bLatest - aLatest;
    });
  }, [customers, searchQuery, customerFilter]);

  const totalPendingAll = useMemo(
    () => customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0),
    [customers]
  );

  const activeDateKey = useMemo(() => {
    if (dateFilterMode === 'all') return null;
    const now = new Date();
    if (dateFilterMode === 'today') return toLocalDateKey(now);
    if (dateFilterMode === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return toLocalDateKey(y);
    }
    return customDateKey;
  }, [dateFilterMode, customDateKey]);

  const filteredEntries = useMemo(() => {
    if (!selectedCustomer) return [];
    const sorted = [...selectedCustomer.entries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (!activeDateKey) return sorted;
    return sorted.filter((e) => toLocalDateKey(e.createdAt) === activeDateKey);
  }, [selectedCustomer, activeDateKey]);

  // Date-wise Cash / UPI / Udhaar summary for this customer
  const customerDateSummary = useMemo(() => {
    let cashPaid = 0;
    let upiPaid = 0;
    let udhaarGiven = 0;

    filteredEntries.forEach((entry) => {
      if (entry.type === 'udhaar') {
        udhaarGiven += entry.amount;
      } else if (entry.type === 'paid_bill' || entry.type === 'jama') {
        if (entry.paymentMode === 'upi') {
          upiPaid += entry.amount;
        } else {
          cashPaid += entry.amount;
        }
      }
    });

    return { cashPaid, upiPaid, udhaarGiven };
  }, [filteredEntries]);

  const handleOpenCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDateFilterMode('all');
    setSelectedEntryIds([]);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const mrRaw = nameMr.trim();
    const enRaw = nameEn.trim();
    if (!mrRaw && !enRaw) return;
    const finalMr = mrRaw || toMarathiReceiptName(enRaw, enRaw);
    const finalEn = enRaw || mrRaw;
    const bal = Math.max(0, Number(openingBalance) || 0);
    const created = onAddCustomer(finalMr, finalEn, mobile.trim(), bal);
    setShowAddCustomer(false);
    setNameMr('');
    setNameEn('');
    setMobile('');
    setOpeningBalance('');
    handleOpenCustomer(created.id);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !entryModalType) return;
    const amount = Number(entryAmount);
    if (Number.isNaN(amount) || amount <= 0) return;

    onAddKhataEntry(
      selectedCustomer.id,
      entryModalType,
      Math.round(amount * 100) / 100,
      entryNote.trim(),
      entryModalType === 'jama' ? jamaPaymentMode : undefined
    );

    setEntryModalType(null);
    setEntryAmount('');
    setEntryNote('');
    setJamaPaymentMode('cash');
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
    );
  };

  const allVisibleSelected =
    filteredEntries.length > 0 &&
    filteredEntries.every((e) => selectedEntryIds.includes(e.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(filteredEntries.map((e) => e.id));
    }
  };

  const buildMultiBillWhatsAppUrl = (
    customer: Customer,
    entriesToInclude: KhataEntry[]
  ): string => {
    const cleanPhone = customer.mobile.replace(/\D/g, '');
    const phoneWithCountry =
      cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const customerName = getDisplayName(customer, lang);
    const lines: string[] = [];

    if (lang === 'mr') {
      lines.push(`नमस्कार ${customerName} जी,`);
      lines.push(`*${t.shopName}*`);
      lines.push(`${t.shopAddress} | मो. ${t.shopPhone}`);
      lines.push('');

      if (entriesToInclude.length > 0) {
        lines.push('*निवडलेल्या बिलांचा तपशील:*');
        let totalCashPaid = 0;
        let totalUpiPaid = 0;

        entriesToInclude.forEach((entry, index) => {
          const bill = findLinkedBill(entry);
          const dateStr = formatDateShort(entry.createdAt, 'mr');
          const modeLabel =
            entry.type === 'udhaar'
              ? 'उधार'
              : entry.paymentMode === 'upi'
                ? 'फोनपे / UPI जमा'
                : 'रोख जमा';

          if (entry.type !== 'udhaar') {
            if (entry.paymentMode === 'upi') totalUpiPaid += entry.amount;
            else totalCashPaid += entry.amount;
          }

          lines.push(
            `${index + 1}) ${entry.billNumber ? `बिल #${entry.billNumber}` : entry.noteMr} (${dateStr}) - ${modeLabel}: ${formatRupees(entry.amount)}`
          );

          if (bill && bill.items.length > 0) {
            bill.items.forEach((item) => {
              lines.push(
                `   • ${item.nameMr} (${formatQuantity(item.quantity, item.unit, 'mr', item.bagWeightKg)}) = ${formatRupees(item.amount)}`
              );
            });
          }
        });

        lines.push('');
        if (totalCashPaid > 0) {
          lines.push(`रोख जमा: ${formatRupees(totalCashPaid)}`);
        }
        if (totalUpiPaid > 0) {
          lines.push(`UPI जमा: ${formatRupees(totalUpiPaid)}`);
        }
      }

      lines.push(
        `*एकूण बाकी उधार रक्कम: ${formatRupees(customer.balance)}*`
      );
      lines.push('धन्यवाद! पुन्हा भेट द्या!');
    } else {
      lines.push(`Namaskar ${customerName},`);
      lines.push(`*${t.shopName}*`);
      lines.push(`${t.shopAddress} | Mob. ${t.shopPhone}`);
      lines.push('');

      if (entriesToInclude.length > 0) {
        lines.push('*Selected Bills Summary:*');
        let totalCashPaid = 0;
        let totalUpiPaid = 0;

        entriesToInclude.forEach((entry, index) => {
          const bill = findLinkedBill(entry);
          const dateStr = formatDateShort(entry.createdAt, 'en');
          const modeLabel =
            entry.type === 'udhaar'
              ? 'Udhaar'
              : entry.paymentMode === 'upi'
                ? 'UPI Paid'
                : 'Cash Paid';

          if (entry.type !== 'udhaar') {
            if (entry.paymentMode === 'upi') totalUpiPaid += entry.amount;
            else totalCashPaid += entry.amount;
          }

          lines.push(
            `${index + 1}) ${entry.billNumber ? `Bill #${entry.billNumber}` : entry.noteEn} (${dateStr}) - ${modeLabel}: ${formatRupees(entry.amount)}`
          );

          if (bill && bill.items.length > 0) {
            bill.items.forEach((item) => {
              lines.push(
                `   • ${item.nameEn} (${formatQuantity(item.quantity, item.unit, 'en', item.bagWeightKg)}) = ${formatRupees(item.amount)}`
              );
            });
          }
        });

        lines.push('');
        if (totalCashPaid > 0) {
          lines.push(`Cash Paid: ${formatRupees(totalCashPaid)}`);
        }
        if (totalUpiPaid > 0) {
          lines.push(`UPI Paid: ${formatRupees(totalUpiPaid)}`);
        }
      }

      lines.push(
        `*Remaining Pending Udhaar: ${formatRupees(customer.balance)}*`
      );
      lines.push('Thank you! Please visit again!');
    }

    const encoded = encodeURIComponent(lines.join('\n'));
    return phoneWithCountry
      ? `https://wa.me/${phoneWithCountry}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  };

  // PASSBOOK DETAIL VIEW
  if (selectedCustomer) {
    const selectedEntriesForShare = filteredEntries.filter((e) =>
      selectedEntryIds.includes(e.id)
    );
    const whatsAppEntries =
      selectedEntriesForShare.length > 0
        ? selectedEntriesForShare
        : filteredEntries.slice(0, 5);

    return (
      <main className="max-w-[1260px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Row: Back + Multi-Bill WhatsApp Share Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setSelectedCustomerId(null)}
            className="flex items-center gap-2 px-5 py-3 min-h-[54px] rounded-xl bg-white border-2 border-slate-300 hover:border-slate-500 text-slate-900 text-[19px] font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t.backBtn}</span>
          </button>

          <a
            href={buildMultiBillWhatsAppUrl(selectedCustomer, whatsAppEntries)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-6 py-3 min-h-[56px] rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-[19px] font-extrabold transition shadow-sm whitespace-nowrap"
          >
            <MessageCircle className="w-6 h-6 shrink-0" />
            <span>
              {selectedEntriesForShare.length > 0
                ? `${t.sendSelectedBillsWhatsAppBtn} (${selectedEntriesForShare.length})`
                : t.sendWhatsAppBtn}
            </span>
          </a>
        </div>

        {/* Customer Summary & Pending Balance Card */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 leading-tight">
                {getDisplayName(selectedCustomer, lang)}
              </h2>
              <div className="mt-1.5 flex items-center gap-2 text-[20px] text-slate-600 font-semibold tabular-nums">
                <Phone className="w-5 h-5 text-slate-500" />
                <span>{selectedCustomer.mobile || '—'}</span>
              </div>
            </div>

            <div
              className={`px-6 py-4 rounded-2xl border-2 text-left md:text-right ${
                selectedCustomer.balance > 0
                  ? 'bg-red-50 border-red-300'
                  : 'bg-emerald-50 border-emerald-300'
              }`}
            >
              {selectedCustomer.balance > 0 ? (
                <>
                  <div className="text-[18px] font-bold text-red-800">
                    {t.pendingBalancePrefix}
                  </div>
                  <div className="text-[36px] sm:text-[42px] font-extrabold text-red-700 tabular-nums leading-tight">
                    {formatRupees(selectedCustomer.balance)}
                  </div>
                </>
              ) : (
                <div className="text-[28px] font-extrabold text-emerald-800">
                  {t.clearedBalanceText}
                </div>
              )}
            </div>
          </div>

          {/* 2 Big Action Buttons: + Add Udhaar (Red) & - Receive Payment (Green) */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setEntryModalType('udhaar');
                setEntryAmount('');
                setEntryNote('');
              }}
              className="min-h-[70px] px-6 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white text-[22px] font-extrabold flex items-center justify-center gap-3 transition cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-7 h-7 shrink-0" />
              <span>{t.addCreditBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEntryModalType('jama');
                setEntryAmount('');
                setEntryNote('');
                setJamaPaymentMode('cash');
              }}
              className="min-h-[70px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-[22px] font-extrabold flex items-center justify-center gap-3 transition cursor-pointer shadow-sm"
            >
              <MinusCircle className="w-7 h-7 shrink-0" />
              <span>{t.receivePaymentBtn}</span>
            </button>
          </div>
        </section>

        {/* Date Filter + Date-Wise Customer Totals */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDateFilterMode('all');
                  setSelectedEntryIds([]);
                }}
                className={`px-4 py-2.5 min-h-[46px] rounded-xl text-[18px] font-bold border-2 transition cursor-pointer ${
                  dateFilterMode === 'all'
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {t.dateFilterAll}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateFilterMode('today');
                  setSelectedEntryIds([]);
                }}
                className={`px-4 py-2.5 min-h-[46px] rounded-xl text-[18px] font-bold border-2 transition cursor-pointer ${
                  dateFilterMode === 'today'
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {t.dateFilterToday}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateFilterMode('yesterday');
                  setSelectedEntryIds([]);
                }}
                className={`px-4 py-2.5 min-h-[46px] rounded-xl text-[18px] font-bold border-2 transition cursor-pointer ${
                  dateFilterMode === 'yesterday'
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {t.dateFilterYesterday}
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-slate-600 shrink-0" />
              <label className="text-[18px] font-bold text-slate-700 whitespace-nowrap">
                {t.dateFilterPickDate}
              </label>
              <input
                type="date"
                value={customDateKey}
                onChange={(e) => {
                  setCustomDateKey(e.target.value);
                  setDateFilterMode('custom');
                  setSelectedEntryIds([]);
                }}
                className="h-12 px-3 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-orange-600 text-[18px] font-bold text-slate-900 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-[19px]">
            <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="font-bold text-emerald-900">{t.modeCash}:</span>
              <span className="font-extrabold text-emerald-800 tabular-nums text-[21px]">
                {formatRupees(customerDateSummary.cashPaid)}
              </span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <span className="font-bold text-blue-900">{t.modeUpi}:</span>
              <span className="font-extrabold text-blue-800 tabular-nums text-[21px]">
                {formatRupees(customerDateSummary.upiPaid)}
              </span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between">
              <span className="font-bold text-orange-900">{t.modeKhata}:</span>
              <span className="font-extrabold text-red-700 tabular-nums text-[21px]">
                {formatRupees(customerDateSummary.udhaarGiven)}
              </span>
            </div>
          </div>
        </section>

        {/* Customer Khata Table: [Checkbox] | Sr. No. | Bill No. | Customer Name | Date | Amount | Print Invoice */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b-2 border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[22px] font-extrabold text-slate-900">
              {t.passbookHistoryTitle} ({filteredEntries.length})
            </h3>
            {filteredEntries.length > 0 && (
              <label className="inline-flex items-center gap-2.5 text-[18px] font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="w-6 h-6 accent-emerald-600 cursor-pointer"
                />
                <span>{t.selectAllBillsLabel}</span>
              </label>
            )}
          </div>

          {filteredEntries.length === 0 ? (
            <div className="p-10 text-center text-[20px] text-slate-500 font-semibold">
              {t.noTransactionsYet}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50/70 text-[18px] text-slate-700">
                    <th className="py-3.5 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        aria-label={t.selectAllBillsLabel}
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="w-5 h-5 accent-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4 font-extrabold whitespace-nowrap">
                      {t.colSrNo}
                    </th>
                    <th className="py-3.5 px-4 font-extrabold whitespace-nowrap">
                      {t.colBillNo}
                    </th>
                    <th className="py-3.5 px-4 font-extrabold">
                      {t.colCustomerName}
                    </th>
                    <th className="py-3.5 px-4 font-extrabold whitespace-nowrap">
                      {t.colDate}
                    </th>
                    <th className="py-3.5 px-4 font-extrabold text-right whitespace-nowrap">
                      {t.colAmount}
                    </th>
                    <th className="py-3.5 px-4 font-extrabold text-right whitespace-nowrap">
                      {t.colPrint}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[19px]">
                  {filteredEntries.map((entry, idx) => {
                    const linkedBill = findLinkedBill(entry);
                    const isChecked = selectedEntryIds.includes(entry.id);
                    const isUdhaar = entry.type === 'udhaar';
                    const isPaidBill = entry.type === 'paid_bill';

                    const badgeText = isUdhaar
                      ? t.entryTypeUdhaar
                      : isPaidBill
                        ? entry.paymentMode === 'upi'
                          ? t.entryTypePaidUpi
                          : t.entryTypePaidCash
                        : t.entryTypeJama;

                    return (
                      <tr
                        key={entry.id}
                        className={
                          isChecked
                            ? 'bg-emerald-50/70 hover:bg-emerald-50'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="py-4 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleEntrySelection(entry.id)}
                            className="w-6 h-6 accent-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-700 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-4 font-mono font-extrabold text-slate-900 whitespace-nowrap">
                          {entry.billNumber ? `#${entry.billNumber}` : '—'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-slate-900">
                            {getDisplayName(selectedCustomer, lang)}
                          </div>
                          <div className="text-[18px] text-slate-600 font-medium">
                            {lang === 'mr' ? entry.noteMr : entry.noteEn} ·{' '}
                            <span
                              className={
                                isUdhaar
                                  ? 'text-red-700 font-bold'
                                  : isPaidBill
                                    ? 'text-blue-700 font-bold'
                                    : 'text-emerald-700 font-bold'
                              }
                            >
                              {badgeText}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-700 font-medium whitespace-nowrap tabular-nums">
                          {formatDateTime(entry.createdAt, lang)}
                        </td>
                        <td
                          className={`py-4 px-4 text-right font-extrabold tabular-nums whitespace-nowrap text-[21px] ${
                            isUdhaar
                              ? 'text-red-700'
                              : isPaidBill
                                ? 'text-slate-900'
                                : 'text-emerald-700'
                          }`}
                        >
                          {isUdhaar ? '+' : entry.type === 'jama' ? '-' : ''}{' '}
                          {formatRupees(entry.amount || linkedBill?.total || 0)}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          {linkedBill ? (
                            <button
                              type="button"
                              onClick={() => onViewReceipt(linkedBill)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[46px] rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-300 text-slate-900 text-[18px] font-bold transition cursor-pointer"
                            >
                              <Printer className="w-5 h-5" />
                              <span>{t.printInvoiceBtn}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 font-semibold">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ADD UDHAAR / RECEIVE PAYMENT MODAL */}
        {entryModalType && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-2xl border-2 border-slate-200 max-w-[500px] w-full shadow-2xl overflow-hidden my-auto">
              <div
                className={`px-6 py-4 text-white flex items-center justify-between ${
                  entryModalType === 'udhaar' ? 'bg-red-600' : 'bg-emerald-600'
                }`}
              >
                <h3 className="text-[23px] font-extrabold">
                  {entryModalType === 'udhaar'
                    ? t.addCreditModalTitle
                    : t.receivePaymentModalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setEntryModalType(null)}
                  aria-label={t.closeBtn}
                  className="w-11 h-11 rounded-xl bg-black/15 hover:bg-black/25 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveEntry} className="p-6 space-y-5">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-[19px] font-bold text-slate-800">
                      {t.enterAmountLabel}
                    </label>
                    {entryModalType === 'jama' && selectedCustomer.balance > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setEntryAmount(String(selectedCustomer.balance))
                        }
                        className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[18px] font-bold cursor-pointer"
                      >
                        {t.fullPendingBtn} ({formatRupees(selectedCustomer.balance)})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    autoFocus
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    placeholder="0"
                    className="w-full h-16 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-slate-900 focus:bg-white text-[32px] font-extrabold text-slate-900 tabular-nums"
                  />
                </div>

                {entryModalType === 'jama' && (
                  <div>
                    <label className="block text-[18px] font-bold text-slate-800 mb-2">
                      {t.paymentMethodLabel}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setJamaPaymentMode('cash')}
                        className={`min-h-[54px] rounded-xl border-2 text-[19px] font-extrabold transition cursor-pointer ${
                          jamaPaymentMode === 'cash'
                            ? 'bg-emerald-600 border-emerald-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {formatPaymentMode('cash', lang)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setJamaPaymentMode('upi')}
                        className={`min-h-[54px] rounded-xl border-2 text-[19px] font-extrabold transition cursor-pointer ${
                          jamaPaymentMode === 'upi'
                            ? 'bg-blue-600 border-blue-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {formatPaymentMode('upi', lang)}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[18px] font-bold text-slate-800 mb-2">
                    {t.enterNoteLabel}
                  </label>
                  <input
                    type="text"
                    value={entryNote}
                    onChange={(e) => setEntryNote(e.target.value)}
                    placeholder={
                      entryModalType === 'udhaar'
                        ? t.creditNotePlaceholder
                        : t.paymentNotePlaceholder
                    }
                    className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-slate-900 focus:bg-white text-[19px] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEntryModalType(null)}
                    className="min-h-[56px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[19px] font-bold cursor-pointer"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className={`min-h-[56px] rounded-xl text-white text-[20px] font-extrabold cursor-pointer ${
                      entryModalType === 'udhaar'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {entryModalType === 'udhaar'
                      ? t.confirmCreditBtn
                      : t.confirmPaymentBtn}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  // CUSTOMER LIST VIEW
  return (
    <main className="max-w-[1160px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border-2 border-slate-200 p-5">
        <div>
          <h2 className="text-[26px] sm:text-[30px] font-extrabold text-slate-900">
            {t.khataTitle}
          </h2>
          <p className="text-[20px] font-bold text-red-700 tabular-nums mt-0.5">
            {t.totalPendingAllLabel}: {formatRupees(totalPendingAll)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCustomer(true)}
          className="px-6 py-3.5 min-h-[58px] rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-[20px] font-extrabold flex items-center gap-2.5 transition cursor-pointer whitespace-nowrap"
        >
          <UserPlus className="w-6 h-6 shrink-0" />
          <span>{t.addCustomerBtn}</span>
        </button>
      </div>

      {/* Search Customer Bar + Filter Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-6 h-6 text-slate-500 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchCustomerPlaceholder}
            className="w-full h-16 pl-14 pr-12 rounded-2xl bg-white border-2 border-slate-300 focus:border-orange-600 text-[20px] font-semibold text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={t.closeBtn}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-6 h-6 text-slate-700" />
            </button>
          )}
        </div>

        <div className="inline-flex items-center p-1.5 bg-white border-2 border-slate-300 rounded-2xl gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setCustomerFilter('all')}
            className={`px-4 py-2.5 min-h-[46px] rounded-xl text-[18px] font-bold transition cursor-pointer whitespace-nowrap ${
              customerFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {lang === 'mr' ? `सर्व (${customers.length})` : `All (${customers.length})`}
          </button>
          <button
            type="button"
            onClick={() => setCustomerFilter('udhaar')}
            className={`px-4 py-2.5 min-h-[46px] rounded-xl text-[18px] font-bold transition cursor-pointer whitespace-nowrap ${
              customerFilter === 'udhaar'
                ? 'bg-red-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {lang === 'mr' ? 'उधार बाकी' : 'Pending Udhaar'}
          </button>
          <button
            type="button"
            onClick={() => setCustomerFilter('cash_upi')}
            className={`px-4 py-2.5 min-h-[46px] rounded-xl text-[18px] font-bold transition cursor-pointer whitespace-nowrap ${
              customerFilter === 'cash_upi'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {lang === 'mr' ? 'रोख / UPI' : 'Cash / UPI'}
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center">
          <p className="text-[22px] font-bold text-slate-500">
            {t.noCustomersFound}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => {
            const hasPending = customer.balance > 0;
            const totalCashUpi = customer.entries
              .filter((e) => e.type === 'paid_bill' || e.type === 'jama')
              .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            const billCount = customer.entries.length;
            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleOpenCustomer(customer.id)}
                className="text-left bg-white rounded-2xl border-2 border-slate-200 hover:border-orange-500 hover:shadow-md active:scale-[0.99] p-6 transition flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[23px] font-extrabold text-slate-900 truncate">
                    {getDisplayName(customer, lang)}
                  </div>
                  <div className="text-[18px] text-slate-600 font-semibold tabular-nums mt-1 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{customer.mobile || '—'}</span>
                  </div>
                  <div className="text-[18px] text-slate-600 font-semibold tabular-nums mt-1">
                    {billCount} {t.billsCountSuffix}
                    {totalCashUpi > 0 && (
                      <span className="text-emerald-700 font-bold">
                        {' '}
                        · {lang === 'mr' ? 'रोख/UPI:' : 'Cash/UPI:'}{' '}
                        {formatRupees(totalCashUpi)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {customerFilter === 'cash_upi' && totalCashUpi > 0 ? (
                    <div className="text-[22px] sm:text-[24px] font-extrabold text-emerald-700 tabular-nums">
                      {lang === 'mr' ? 'रोख/UPI:' : 'Cash/UPI:'}{' '}
                      {formatRupees(totalCashUpi)}
                    </div>
                  ) : hasPending ? (
                    <div className="text-[22px] sm:text-[24px] font-extrabold text-red-700 tabular-nums">
                      {t.pendingBalancePrefix} {formatRupees(customer.balance)}
                    </div>
                  ) : (
                    <div className="text-[20px] font-bold text-emerald-700">
                      {t.clearedBalanceText}
                    </div>
                  )}
                  <div className="mt-1 text-[18px] font-bold text-orange-700">
                    {t.openPassbookBtn} →
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ADD NEW CUSTOMER MODAL */}
      {showAddCustomer && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={t.newCustomerModalTitle}
        >
          <div className="bg-white rounded-2xl border-2 border-slate-200 max-w-[520px] w-full shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 bg-orange-600 text-white flex items-center justify-between">
              <h3 className="text-[23px] font-extrabold">
                {t.newCustomerModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                aria-label={t.closeBtn}
                className="w-11 h-11 rounded-xl bg-orange-700 hover:bg-orange-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                  {t.customerNameMrLabel}
                </label>
                <input
                  type="text"
                  required={!nameEn.trim()}
                  autoFocus
                  value={nameMr}
                  onChange={(e) => setNameMr(e.target.value)}
                  placeholder="उदा. राजेश कुलकर्णी"
                  className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-orange-600 focus:bg-white text-[19px] font-semibold"
                />
              </div>

              <div>
                <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                  {t.customerNameEnLabel}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Rajesh Kulkarni"
                  className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-orange-600 focus:bg-white text-[19px] font-semibold"
                />
              </div>

              <div>
                <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                  {t.customerMobileLabel}
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9822012345"
                  className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-orange-600 focus:bg-white text-[19px] font-semibold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[18px] font-bold text-slate-800 mb-1.5">
                  {t.openingBalanceLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-orange-600 focus:bg-white text-[20px] font-bold tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="min-h-[56px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[19px] font-bold cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="min-h-[56px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[20px] font-extrabold cursor-pointer"
                >
                  {t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
