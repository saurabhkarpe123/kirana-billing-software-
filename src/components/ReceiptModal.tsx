import { useEffect, useState } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  MessageCircle,
  Phone,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  formatDateTime,
  formatQuantity,
  formatRupees,
  translations,
} from '../i18n/translations';
import { Bill, Language } from '../types/pos';
import { toMarathiReceiptName } from '../utils/transliterate';
import {
  downloadBlobAsPng,
  PaperShareResult,
  renderPaperReceiptToBlob,
  sharePaperReceipt,
} from '../utils/receiptImage';
import { buildWhatsAppChatUrl } from '../utils/whatsapp';

interface ReceiptModalProps {
  bill: Bill;
  lang: Language;
  isFromNewBill?: boolean;
  customerMobile?: string;
  customerBalance?: number;
  initialShareResult?: PaperShareResult | null;
  onUpdateCustomerMobile?: (customerId: string, mobile: string) => void;
  onNotify?: (msg: string, tone?: 'success' | 'error') => void;
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
  customerMobile = '',
  customerBalance,
  initialShareResult = null,
  onUpdateCustomerMobile,
  onNotify,
  onClose,
}: ReceiptModalProps) {
  const t = translations[lang];
  const [whatsAppPhone, setWhatsAppPhone] = useState(customerMobile);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [paperShareState, setPaperShareState] =
    useState<PaperShareResult | null>(initialShareResult);

  useEffect(() => {
    setWhatsAppPhone(customerMobile);
    setPaperShareState(initialShareResult);
  }, [bill.id, customerMobile, initialShareResult]);

  const marathiCustomerName = toMarathiReceiptName(
    bill.customerNameMr,
    bill.customerNameEn
  );

  const handlePrint = () => {
    window.print();
  };

  const persistTypedMobile = () => {
    const trimmed = whatsAppPhone.trim();
    if (
      trimmed &&
      trimmed !== customerMobile.trim() &&
      bill.customerId &&
      bill.customerId !== 'cust-cash' &&
      onUpdateCustomerMobile
    ) {
      onUpdateCustomerMobile(bill.customerId, trimmed);
    }
  };

  const handleSendPaperOnWhatsApp = async () => {
    if (isGeneratingImage) return;
    persistTypedMobile();
    setIsGeneratingImage(true);
    try {
      const result = await sharePaperReceipt({
        bill,
        mobile: whatsAppPhone,
        pendingBalance: customerBalance,
        lang,
      });
      if (result.status === 'shared') {
        setPaperShareState(null);
        onNotify?.(t.paperBillSharedToast, 'success');
      } else if (result.status === 'ready_for_whatsapp') {
        setPaperShareState(result);
        onNotify?.(t.paperBillSavedToast, 'success');
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSavePaperPhoto = async () => {
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const { blob, filename } = await renderPaperReceiptToBlob(
        bill,
        customerBalance
      );
      downloadBlobAsPng(blob, filename);
      onNotify?.(t.paperBillSavedToast, 'success');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const liveWhatsAppChatUrl = buildWhatsAppChatUrl(whatsAppPhone);

  return (
    <div
      className="print-modal-root fixed inset-0 z-50 bg-slate-900/60 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t.receiptTitle}
    >
      <div className="print-modal-shell bg-white rounded-2xl border-2 border-slate-200 max-w-[480px] w-full shadow-2xl my-auto">
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
          {/* Optional WhatsApp Mobile Number Input */}
          <div>
            <label className="block text-[18px] font-bold text-slate-700 mb-1.5">
              {t.whatsappPhoneLabel}
            </label>
            <div className="relative flex items-center">
              <Phone className="w-5 h-5 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="tel"
                value={whatsAppPhone}
                onChange={(e) => setWhatsAppPhone(e.target.value)}
                placeholder={t.whatsappPhonePlaceholder}
                className="w-full h-13 pl-11 pr-4 rounded-xl bg-slate-50 border-2 border-slate-300 focus:border-[#16A34A] focus:bg-white text-[19px] font-bold text-slate-900 placeholder:text-slate-400 tabular-nums"
              />
            </div>
          </div>

          {/* Desktop / Browser Handoff Banner once Paper Photo PNG is copied & downloaded */}
          {paperShareState?.status === 'ready_for_whatsapp' && (
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500 space-y-3">
              <p className="text-[18px] font-bold text-emerald-950 leading-snug">
                {paperShareState.copied
                  ? t.paperBillReadyHintCopied
                  : t.paperBillReadyHintDownloaded}
              </p>
              <a
                href={liveWhatsAppChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={persistTypedMobile}
                className="w-full min-h-[54px] px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-[19px] font-extrabold flex items-center justify-center gap-2.5 transition"
              >
                <ExternalLink className="w-5 h-5 shrink-0" />
                <span>{t.openWhatsAppChatBtn}</span>
              </a>
            </div>
          )}

          {/* 1-Click Send Paper Bill Photo on WhatsApp (Works for Cash, UPI & Udhaar) */}
          <button
            type="button"
            disabled={isGeneratingImage}
            onClick={handleSendPaperOnWhatsApp}
            className="w-full min-h-[60px] px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] disabled:bg-emerald-400 active:scale-[0.99] text-white text-[20px] font-extrabold flex items-center justify-center gap-3 transition cursor-pointer"
          >
            <MessageCircle className="w-6 h-6 shrink-0" />
            <span>
              {isGeneratingImage
                ? t.preparingPaperBillLabel
                : t.sendBillWhatsAppBtn}
            </span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full min-h-[56px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-[19px] font-extrabold flex items-center justify-center gap-2.5 transition cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-5 h-5 shrink-0" />
              <span>{t.printReceiptBtn}</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingImage}
              onClick={handleSavePaperPhoto}
              className="w-full min-h-[56px] px-4 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 active:scale-[0.99] text-white text-[19px] font-extrabold flex items-center justify-center gap-2.5 transition cursor-pointer whitespace-nowrap"
            >
              <Download className="w-5 h-5 shrink-0" />
              <span>{t.saveBillImageBtn}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[52px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-[19px] font-bold transition cursor-pointer"
          >
            {isFromNewBill ? t.newBillAfterPrintBtn : t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
