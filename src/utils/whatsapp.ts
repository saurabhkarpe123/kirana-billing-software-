import {
  formatDateTime,
  formatQuantity,
  formatRupees,
  translations,
} from '../i18n/translations';
import { Bill, Language } from '../types/pos';
import { toMarathiReceiptName } from './transliterate';

export interface SingleBillWhatsAppOptions {
  bill: Bill;
  lang: Language;
  mobile?: string;
  pendingBalance?: number;
}

export function normalizeIndianPhone(rawPhone?: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsAppChatUrl(rawPhone?: string): string {
  const phoneWithCountry = normalizeIndianPhone(rawPhone);
  return phoneWithCountry
    ? `https://wa.me/${phoneWithCountry}`
    : 'https://web.whatsapp.com/';
}

/**
 * Generates a pre-filled WhatsApp (wa.me) share URL for any bill type:
 * Cash (रोख), UPI (फोनपे / UPI), or Udhaar (उधार).
 */
export function buildSingleBillWhatsAppUrl({
  bill,
  lang,
  mobile,
  pendingBalance,
}: SingleBillWhatsAppOptions): string {
  const t = translations[lang];
  const phoneWithCountry = normalizeIndianPhone(mobile);
  const lines: string[] = [];

  if (lang === 'mr') {
    const customerName = toMarathiReceiptName(
      bill.customerNameMr,
      bill.customerNameEn
    );
    const modeLabel =
      bill.paymentMode === 'cash'
        ? 'रोख (Cash) — पैसे मिळाले'
        : bill.paymentMode === 'upi'
          ? 'फोनपे / UPI — पैसे मिळाले'
          : 'उधार (Udhaar)';

    lines.push(`*${t.shopName}*`);
    lines.push(`${t.shopAddress}`);
    lines.push(`मो. ${t.shopPhone}`);
    lines.push('------------------------');
    lines.push(`बिल क्र.: *#${bill.billNumber}*`);
    lines.push(`तारीख: ${formatDateTime(bill.createdAt, 'mr')}`);
    lines.push(`ग्राहक: *${customerName}*`);
    lines.push(`प्रकार: *${modeLabel}*`);
    lines.push('------------------------');
    lines.push('*सामानाचा तपशील:*');

    bill.items.forEach((item, idx) => {
      const qtyStr = formatQuantity(
        item.quantity,
        item.unit,
        'mr',
        item.bagWeightKg
      );
      lines.push(
        `${idx + 1}) ${item.nameMr || item.nameEn} (${qtyStr}) = ${formatRupees(item.amount)}`
      );
    });

    lines.push('------------------------');
    lines.push(`*एकूण रक्कम: ${formatRupees(bill.total)}*`);

    if (
      bill.paymentMode === 'khata' &&
      typeof pendingBalance === 'number' &&
      pendingBalance > 0
    ) {
      lines.push(`*एकूण उधार बाकी: ${formatRupees(pendingBalance)}*`);
    }

    lines.push('');
    lines.push('धन्यवाद! पुन्हा भेट द्या!');
  } else {
    const customerName = bill.customerNameEn || bill.customerNameMr || 'Cash Customer';
    const modeLabel =
      bill.paymentMode === 'cash'
        ? 'Cash (Paid)'
        : bill.paymentMode === 'upi'
          ? 'PhonePe / UPI (Paid)'
          : 'Udhaar (Credit)';

    lines.push(`*${t.shopName}*`);
    lines.push(`${t.shopAddress}`);
    lines.push(`Mob. ${t.shopPhone}`);
    lines.push('------------------------');
    lines.push(`Bill No.: *#${bill.billNumber}*`);
    lines.push(`Date: ${formatDateTime(bill.createdAt, 'en')}`);
    lines.push(`Customer: *${customerName}*`);
    lines.push(`Payment: *${modeLabel}*`);
    lines.push('------------------------');
    lines.push('*Bill Items:*');

    bill.items.forEach((item, idx) => {
      const qtyStr = formatQuantity(
        item.quantity,
        item.unit,
        'en',
        item.bagWeightKg
      );
      lines.push(
        `${idx + 1}) ${item.nameEn || item.nameMr} (${qtyStr}) = ${formatRupees(item.amount)}`
      );
    });

    lines.push('------------------------');
    lines.push(`*Grand Total: ${formatRupees(bill.total)}*`);

    if (
      bill.paymentMode === 'khata' &&
      typeof pendingBalance === 'number' &&
      pendingBalance > 0
    ) {
      lines.push(`*Total Pending Udhaar: ${formatRupees(pendingBalance)}*`);
    }

    lines.push('');
    lines.push('Thank you! Please visit again!');
  }

  const encoded = encodeURIComponent(lines.join('\n'));
  return phoneWithCountry
    ? `https://wa.me/${phoneWithCountry}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
