import { Printer, X, CheckCircle2 } from 'lucide-react';
import {
  formatDateTime,
  formatQuantity,
  formatRupees,
  translations,
} from '../i18n/translations';
import { Bill, Language } from '../types/pos';
import { toMarathiReceiptName } from '../utils/transliterate';

interface ReceiptModalProps {
  bill: Bill;
  lang: Language;
  isFromNewBill?: boolean;
  onClose: () => void;
}

function getMarathiPaymentMode(mode: Bill['paymentMode']): string {
  if (mode === 'cash') return 'रोख';
  if (mode === 'upi') return 'फोनपे / UPI';
  return 'उधार';
}

export function ReceiptModal({
  bill,
  lang,
  isFromNewBill = true,
  onClose,
}: ReceiptModalProps) {
  const t = translations[lang];

  const marathiCustomerName = toMarathiReceiptName(
    bill.customerNameMr,
    bill.customerNameEn
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="print-modal-root fixed inset-0 z-50 bg-slate-900/60 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t.receiptTitle}
    >
      <div className="print-modal-shell bg-white rounded-2xl border-2 border-slate-200 max-w-[460px] w-full shadow-2xl my-auto">
        {/* Top Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-[20px]">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span>{t.receiptTitle}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeBtn}
            className="w-11 h-11 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Auto-Expanding 80mm Marathi Thermal Receipt Container (No Fixed Height / No Clipping) */}
        <div className="print-receipt-wrap p-5 bg-slate-100 flex justify-center h-auto">
          <div
            id="thermal-receipt-print-area"
            className="w-[304px] max-w-full h-auto bg-white text-black p-4 border border-slate-300 shadow-sm font-mono text-[14px] leading-snug"
          >
            {/* Marathi Shop Header */}
            <div className="text-center border-b-2 border-dashed border-black pb-2.5 mb-2.5">
              <div className="text-[19px] font-extrabold leading-tight">
                जनशांती किराणा स्टोअर
              </div>
              <div className="text-[13px] font-semibold mt-1 leading-snug">
                हिरापूर, चांदवड, नाशिक, महाराष्ट्र
              </div>
              <div className="text-[13px] font-bold mt-0.5 tabular-nums">
                मो. 9766518265
              </div>
            </div>

            {/* Bill Metadata in Marathi */}
            <div className="space-y-1 text-[13px] border-b-2 border-dashed border-black pb-2.5 mb-2.5">
              <div className="flex justify-between gap-2">
                <span>बिल क्र.:</span>
                <span className="font-bold tabular-nums">#{bill.billNumber}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>तारीख:</span>
                <span className="tabular-nums text-right">
                  {formatDateTime(bill.createdAt, 'mr')}
                </span>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-dotted border-slate-400 text-[15px]">
                <span className="font-bold">ग्राहक:</span>
                <span className="font-extrabold text-right break-words whitespace-normal max-w-[195px]">
                  {marathiCustomerName}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>प्रकार:</span>
                <span className="font-bold">
                  {getMarathiPaymentMode(bill.paymentMode)}
                </span>
              </div>
            </div>

            {/* Strictly 3 Fixed-Width Aligned Columns: वस्तू | नग/वजन | रक्कम */}
            <table className="w-full table-fixed text-[13px] mb-2.5 border-collapse">
              <colgroup>
                <col className="w-[46%]" />
                <col className="w-[28%]" />
                <col className="w-[26%]" />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-1 pr-1 font-extrabold">वस्तू</th>
                  <th className="py-1 px-1 font-extrabold text-right">नग/वजन</th>
                  <th className="py-1 pl-1 font-extrabold text-right">रक्कम</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, idx) => (
                  <tr
                    key={`${item.productId}-${idx}`}
                    className="border-b border-dotted border-slate-400 align-top"
                  >
                    <td className="py-1.5 pr-1 font-semibold break-words whitespace-normal leading-tight">
                      {item.nameMr || item.nameEn}
                    </td>
                    <td className="py-1.5 px-1 text-right break-words whitespace-normal leading-tight tabular-nums">
                      {formatQuantity(
                        item.quantity,
                        item.unit,
                        'mr',
                        item.bagWeightKg
                      )}
                    </td>
                    <td className="py-1.5 pl-1 text-right whitespace-nowrap font-bold tabular-nums">
                      {formatRupees(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bold Grand Total */}
            <div className="border-t-2 border-dashed border-black pt-2.5 mt-2 flex items-center justify-between gap-2">
              <span className="text-[16px] font-extrabold">एकूण रक्कम</span>
              <span className="text-[24px] font-extrabold tabular-nums">
                {formatRupees(bill.total)}
              </span>
            </div>

            {/* Footer Greeting */}
            <div className="text-center border-t-2 border-dashed border-black mt-3.5 pt-2.5 text-[14px] font-extrabold">
              धन्यवाद! पुन्हा भेट द्या!
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden on print) */}
        <div className="no-print p-5 bg-white border-t border-slate-200 flex flex-col gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full min-h-[60px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-[21px] font-extrabold flex items-center justify-center gap-3 transition cursor-pointer"
          >
            <Printer className="w-6 h-6" />
            <span>{t.printReceiptBtn}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[54px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-[19px] font-bold transition cursor-pointer"
          >
            {isFromNewBill ? t.newBillAfterPrintBtn : t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
