import React, { useMemo, useRef, useState } from 'react';
import {
  Banknote,
  BookOpen,
  Calendar,
  Download,
  IndianRupee,
  MessageCircle,
  Printer,
  ShieldCheck,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';
import { isValidStoreData, normalizeStoreData } from '../db/storage';
import {
  formatDateTime,
  formatPaymentMode,
  formatRupees,
  toLocalDateKey,
  translations,
} from '../i18n/translations';
import { Bill, Customer, Language, StoreData } from '../types/pos';

interface HisabScreenProps {
  lang: Language;
  bills: Bill[];
  customers: Customer[];
  lastBackupAt: string | null;
  onViewReceipt: (bill: Bill) => void;
  onSendBillWhatsApp: (bill: Bill) => void;
  onDownloadBackup: () => void;
  onRestoreBackup: (data: StoreData) => void;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

type DateFilterMode = 'today' | 'yesterday' | 'all' | 'custom';

export function HisabScreen({
  lang,
  bills,
  customers,
  lastBackupAt,
  onViewReceipt,
  onSendBillWhatsApp,
  onDownloadBackup,
  onRestoreBackup,
  onNotify,
}: HisabScreenProps) {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('today');
  const [customDateKey, setCustomDateKey] = useState(() =>
    toLocalDateKey(new Date())
  );

  const [pendingRestoreData, setPendingRestoreData] =
    useState<StoreData | null>(null);

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

  const summary = useMemo(() => {
    const filteredBills = bills
      .filter((b) =>
        activeDateKey ? toLocalDateKey(b.createdAt) === activeDateKey : true
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    const totalSales = filteredBills.reduce((sum, b) => sum + b.total, 0);
    const cashFromBills = filteredBills
      .filter((b) => b.paymentMode === 'cash')
      .reduce((sum, b) => sum + b.total, 0);
    const upiFromBills = filteredBills
      .filter((b) => b.paymentMode === 'upi')
      .reduce((sum, b) => sum + b.total, 0);
    const udhaarFromBills = filteredBills
      .filter((b) => b.paymentMode === 'khata')
      .reduce((sum, b) => sum + b.total, 0);

    let cashFromKhata = 0;
    let upiFromKhata = 0;
    let manualUdhaar = 0;

    customers.forEach((c) => {
      c.entries.forEach((entry) => {
        if (activeDateKey && toLocalDateKey(entry.createdAt) !== activeDateKey) {
          return;
        }
        if (entry.type === 'jama') {
          if (entry.paymentMode === 'upi') {
            upiFromKhata += entry.amount;
          } else {
            cashFromKhata += entry.amount;
          }
        } else if (
          entry.type === 'udhaar' &&
          !entry.billNumber &&
          entry.noteEn !== 'Opening pending balance'
        ) {
          manualUdhaar += entry.amount;
        }
      });
    });

    return {
      filteredBills,
      totalSales,
      cashInDrawer: cashFromBills + cashFromKhata,
      cashFromBills,
      cashFromKhata,
      upiReceived: upiFromBills + upiFromKhata,
      upiFromBills,
      upiFromKhata,
      newUdhaarGiven: udhaarFromBills + manualUdhaar,
    };
  }, [bills, customers, activeDateKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isValidStoreData(parsed)) {
          onNotify(t.restoreErrorToast, 'error');
          return;
        }
        setPendingRestoreData(normalizeStoreData(parsed));
      } catch {
        onNotify(t.restoreErrorToast, 'error');
      }
    };
    reader.onerror = () => {
      onNotify(t.restoreErrorToast, 'error');
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!pendingRestoreData) return;
    onRestoreBackup(pendingRestoreData);
    setPendingRestoreData(null);
  };

  return (
    <main className="max-w-[1260px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header + Date Filter Bar */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[26px] sm:text-[30px] font-extrabold text-slate-900">
            {t.hisabTitle}
          </h2>

          {/* Date Picker */}
          <div className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-purple-700 shrink-0" />
            <label className="text-[18px] font-bold text-slate-700 whitespace-nowrap">
              {t.dateFilterPickDate}
            </label>
            <input
              type="date"
              value={customDateKey}
              onChange={(e) => {
                setCustomDateKey(e.target.value);
                setDateFilterMode('custom');
              }}
              className="h-12 px-3 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-purple-600 text-[18px] font-bold text-slate-900 tabular-nums"
            />
          </div>
        </div>

        {/* Quick Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setDateFilterMode('today')}
            className={`px-5 py-2.5 min-h-[48px] rounded-xl text-[18px] font-extrabold border-2 transition cursor-pointer ${
              dateFilterMode === 'today'
                ? 'bg-purple-700 border-purple-700 text-white'
                : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            {t.dateFilterToday}
          </button>
          <button
            type="button"
            onClick={() => setDateFilterMode('yesterday')}
            className={`px-5 py-2.5 min-h-[48px] rounded-xl text-[18px] font-extrabold border-2 transition cursor-pointer ${
              dateFilterMode === 'yesterday'
                ? 'bg-purple-700 border-purple-700 text-white'
                : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            {t.dateFilterYesterday}
          </button>
          <button
            type="button"
            onClick={() => setDateFilterMode('all')}
            className={`px-5 py-2.5 min-h-[48px] rounded-xl text-[18px] font-extrabold border-2 transition cursor-pointer ${
              dateFilterMode === 'all'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            {t.dateFilterAll}
          </button>
        </div>
      </div>

      {/* 4 Big Summary Boxes for Selected Date */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[19px] font-extrabold text-purple-900">
              {t.todayTotalSales}
            </span>
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[36px] font-extrabold text-slate-900 tabular-nums leading-none">
              {formatRupees(summary.totalSales)}
            </div>
            <div className="mt-2 text-[18px] font-semibold text-slate-600 tabular-nums">
              {summary.filteredBills.length} {t.billsCountSuffix}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[19px] font-extrabold text-emerald-900">
              {t.cashInDrawer}
            </span>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[36px] font-extrabold text-emerald-800 tabular-nums leading-none">
              {formatRupees(summary.cashInDrawer)}
            </div>
            <div className="mt-2 text-[18px] font-semibold text-slate-600 tabular-nums">
              {t.fromBillsLabel}: {formatRupees(summary.cashFromBills)}
              {summary.cashFromKhata > 0
                ? ` · ${t.fromKhataJamaLabel}: ${formatRupees(summary.cashFromKhata)}`
                : ''}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[19px] font-extrabold text-blue-900">
              {t.upiReceived}
            </span>
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[36px] font-extrabold text-blue-800 tabular-nums leading-none">
              {formatRupees(summary.upiReceived)}
            </div>
            <div className="mt-2 text-[18px] font-semibold text-slate-600 tabular-nums">
              {t.fromBillsLabel}: {formatRupees(summary.upiFromBills)}
              {summary.upiFromKhata > 0
                ? ` · ${t.fromKhataJamaLabel}: ${formatRupees(summary.upiFromKhata)}`
                : ''}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-orange-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[19px] font-extrabold text-orange-900">
              {t.newUdhaarGiven}
            </span>
            <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[36px] font-extrabold text-orange-700 tabular-nums leading-none">
              {formatRupees(summary.newUdhaarGiven)}
            </div>
          </div>
        </div>
      </section>

      {/* Bills Table: Sr. No. | Bill No. | Customer Name | Cash/UPI/Udhaar | Amount */}
      <section className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b-2 border-slate-200">
          <h3 className="text-[22px] font-extrabold text-slate-900">
            {t.todaysBillsTitle} ({summary.filteredBills.length})
          </h3>
        </div>

        {summary.filteredBills.length === 0 ? (
          <div className="p-10 text-center text-[20px] font-semibold text-slate-500">
            {t.noBillsForDate}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50/60 text-[18px] text-slate-700">
                  <th className="py-3.5 px-5 font-extrabold whitespace-nowrap">
                    {t.colSrNo}
                  </th>
                  <th className="py-3.5 px-5 font-extrabold whitespace-nowrap">
                    {t.colBillNo}
                  </th>
                  <th className="py-3.5 px-5 font-extrabold">
                    {t.colCustomerName}
                  </th>
                  <th className="py-3.5 px-5 font-extrabold whitespace-nowrap">
                    {t.colType}
                  </th>
                  <th className="py-3.5 px-5 font-extrabold text-right whitespace-nowrap">
                    {t.colAmount}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[19px]">
                {summary.filteredBills.map((bill, idx) => (
                  <tr
                    key={bill.id}
                    onClick={() => onViewReceipt(bill)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5 font-bold text-slate-700 tabular-nums whitespace-nowrap">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-5 font-mono font-extrabold text-slate-900 whitespace-nowrap">
                      #{bill.billNumber}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-slate-900">
                        {lang === 'mr'
                          ? bill.customerNameMr
                          : bill.customerNameEn}
                      </div>
                      <div className="text-[18px] text-slate-500 font-medium tabular-nums">
                        {formatDateTime(bill.createdAt, lang)}
                      </div>
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span
                        className={`font-extrabold ${
                          bill.paymentMode === 'cash'
                            ? 'text-emerald-700'
                            : bill.paymentMode === 'upi'
                              ? 'text-blue-700'
                              : 'text-orange-700'
                        }`}
                      >
                        {formatPaymentMode(bill.paymentMode, lang)}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <span className="font-extrabold text-slate-900 tabular-nums text-[21px] mr-1">
                          {formatRupees(bill.total)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendBillWhatsApp(bill);
                          }}
                          aria-label={t.sendBillWhatsAppBtn}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-[18px] font-bold transition whitespace-nowrap cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          <span>{t.whatsappShortBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewReceipt(bill);
                          }}
                          aria-label={t.viewReceiptBtn}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white border border-slate-300 text-slate-900 text-[18px] font-bold transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>{t.viewReceiptBtn}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 1-CLICK BACKUP & RESTORE SECTION */}
      <section className="bg-white rounded-2xl border-2 border-emerald-200 p-6 sm:p-7">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-[24px] font-extrabold text-slate-900">
              {t.backupSectionTitle}
            </h3>
            <p className="mt-1 text-[19px] text-slate-600 font-medium leading-relaxed">
              {t.backupSectionDesc}
            </p>
            <p className="mt-2 text-[18px] font-bold text-emerald-800">
              {t.lastBackupLabel}{' '}
              {lastBackupAt
                ? formatDateTime(lastBackupAt, lang)
                : t.neverBackedUp}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onDownloadBackup}
            className="min-h-[68px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-[21px] font-extrabold flex items-center justify-center gap-3 transition cursor-pointer shadow-sm"
          >
            <Download className="w-7 h-7 shrink-0" />
            <span>{t.downloadBackupBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[68px] px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-[21px] font-extrabold flex items-center justify-center gap-3 transition cursor-pointer shadow-sm"
          >
            <Upload className="w-7 h-7 shrink-0" />
            <span>{t.restoreBackupBtn}</span>
          </button>
        </div>
      </section>

      {/* RESTORE CONFIRMATION MODAL */}
      {pendingRestoreData && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border-2 border-slate-200 max-w-[520px] w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-[22px] font-extrabold">
                {t.restoreConfirmTitle}
              </h3>
              <button
                type="button"
                onClick={() => setPendingRestoreData(null)}
                aria-label={t.closeBtn}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-[19px] text-slate-700 font-medium leading-relaxed">
                {t.restoreConfirmMessage}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingRestoreData(null)}
                  className="min-h-[56px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-[19px] font-bold cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="min-h-[56px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[19px] font-extrabold cursor-pointer"
                >
                  {t.restoreConfirmBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
