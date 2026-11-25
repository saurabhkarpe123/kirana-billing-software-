import {
  formatDateTime,
  formatQuantity,
  formatRupees,
} from '../i18n/translations';
import { Bill, Language } from '../types/pos';
import { toMarathiReceiptName } from './transliterate';
import { buildWhatsAppChatUrl } from './whatsapp';

export interface PaperShareResult {
  status: 'shared' | 'cancelled' | 'ready_for_whatsapp';
  copied: boolean;
  downloaded: boolean;
  filename: string;
  chatUrl: string;
}

function getMarathiPaymentMode(mode: Bill['paymentMode']): string {
  if (mode === 'cash') return 'रोख (पैसे मिळाले)';
  if (mode === 'upi') return 'फोनपे / UPI (पैसे मिळाले)';
  return 'उधार';
}

/**
 * Wraps text into lines that fit inside maxWidth using the active canvas font.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const clean = (text || '').trim();
  if (!clean) return [''];

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      // If a single word is wider than maxWidth, break by character
      if (ctx.measureText(word).width > maxWidth) {
        let chunk = '';
        for (const ch of Array.from(word)) {
          if (ctx.measureText(chunk + ch).width <= maxWidth) {
            chunk += ch;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

/**
 * Renders the exact 80mm Marathi printed paper receipt onto a crisp 2x high-DPI
 * PNG image with dynamic height (never clips items regardless of bill length).
 */
export async function renderPaperReceiptToBlob(
  bill: Bill,
  pendingBalance?: number
): Promise<{ blob: Blob; file: File; filename: string }> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue with fallback fonts
    }
  }

  const SCALE = 2;
  const PAPER_WIDTH = 420;
  const MARGIN = 22;
  const CONTENT_W = PAPER_WIDTH - MARGIN * 2;

  // 3 aligned columns: वस्तू (48%) | नग/वजन (26%) | रक्कम (26%)
  const colItemW = Math.floor(CONTENT_W * 0.48);
  const colQtyW = Math.floor(CONTENT_W * 0.26);
  const colAmtRight = MARGIN + CONTENT_W;
  const colQtyRight = MARGIN + colItemW + colQtyW;

  const FONT_FAMILY =
    '"Noto Sans Devanagari", "Plus Jakarta Sans", system-ui, sans-serif';
  const MONO_FONT =
    '"JetBrains Mono", "Noto Sans Devanagari", ui-monospace, monospace';

  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const marathiCustomerName = toMarathiReceiptName(
    bill.customerNameMr,
    bill.customerNameEn
  );
  const dateStr = formatDateTime(bill.createdAt, 'mr');
  const modeStr = getMarathiPaymentMode(bill.paymentMode);

  // Measure customer name wrapped lines
  mctx.font = `700 17px ${FONT_FAMILY}`;
  const customerLines = wrapText(mctx, marathiCustomerName, CONTENT_W - 88);

  // Measure each item row dynamically
  interface MeasuredRow {
    itemLines: string[];
    qtyLines: string[];
    amountText: string;
    rowHeight: number;
  }

  const LINE_H = 22;
  const measuredRows: MeasuredRow[] = bill.items.map((item) => {
    mctx.font = `600 16px ${FONT_FAMILY}`;
    const itemLines = wrapText(mctx, item.nameMr || item.nameEn, colItemW - 8);

    mctx.font = `600 15px ${FONT_FAMILY}`;
    const qtyText = formatQuantity(
      item.quantity,
      item.unit,
      'mr',
      item.bagWeightKg
    );
    const qtyLines = wrapText(mctx, qtyText, colQtyW - 8);

    const maxLines = Math.max(itemLines.length, qtyLines.length);
    const rowHeight = maxLines * LINE_H + 16;

    return {
      itemLines,
      qtyLines,
      amountText: formatRupees(item.amount),
      rowHeight,
    };
  });

  const showPendingBalance =
    bill.paymentMode === 'khata' &&
    typeof pendingBalance === 'number' &&
    pendingBalance > 0;

  // Compute exact dynamic height
  const headerBlockH = 104;
  const metaBlockH = 82 + customerLines.length * 24 + 28;
  const tableHeaderH = 38;
  const rowsTotalH = measuredRows.reduce((sum, r) => sum + r.rowHeight, 0);
  const totalsBlockH = showPendingBalance ? 96 : 62;
  const footerBlockH = 62;

  const TOTAL_HEIGHT =
    MARGIN +
    headerBlockH +
    metaBlockH +
    tableHeaderH +
    rowsTotalH +
    totalsBlockH +
    footerBlockH +
    MARGIN;

  const canvas = document.createElement('canvas');
  canvas.width = PAPER_WIDTH * SCALE;
  canvas.height = TOTAL_HEIGHT * SCALE;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'top';

  // Crisp thermal paper background with subtle paper edge
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, PAPER_WIDTH, TOTAL_HEIGHT);

  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, PAPER_WIDTH - 2, TOTAL_HEIGHT - 2);

  const drawDashedDivider = (yPos: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.6;
    ctx.moveTo(MARGIN, yPos);
    ctx.lineTo(PAPER_WIDTH - MARGIN, yPos);
    ctx.stroke();
    ctx.restore();
  };

  const drawDottedDivider = (yPos: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.moveTo(MARGIN, yPos);
    ctx.lineTo(PAPER_WIDTH - MARGIN, yPos);
    ctx.stroke();
    ctx.restore();
  };

  let y = MARGIN + 4;

  // === SHOP HEADER (MARATHI) ===
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = `800 24px ${FONT_FAMILY}`;
  ctx.fillText('जनशांती किराणा स्टोअर', PAPER_WIDTH / 2, y);
  y += 34;

  ctx.font = `600 15px ${FONT_FAMILY}`;
  ctx.fillText('हिरापूर, चांदवड, नाशिक, महाराष्ट्र', PAPER_WIDTH / 2, y);
  y += 24;

  ctx.font = `700 16px ${MONO_FONT}`;
  ctx.fillText('मो. 9766518265', PAPER_WIDTH / 2, y);
  y += 30;

  drawDashedDivider(y);
  y += 14;

  // === BILL METADATA ===
  ctx.font = `600 15px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('बिल क्र.:', MARGIN, y);
  ctx.textAlign = 'right';
  ctx.font = `700 16px ${MONO_FONT}`;
  ctx.fillText(`#${bill.billNumber}`, colAmtRight, y);
  y += 26;

  ctx.font = `600 15px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('तारीख:', MARGIN, y);
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, colAmtRight, y);
  y += 28;

  drawDottedDivider(y - 4);
  y += 6;

  ctx.font = `700 17px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('ग्राहक:', MARGIN, y);
  ctx.textAlign = 'right';
  ctx.font = `800 17px ${FONT_FAMILY}`;
  customerLines.forEach((line, idx) => {
    ctx.fillText(line, colAmtRight, y + idx * 24);
  });
  y += customerLines.length * 24 + 6;

  ctx.font = `600 15px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('प्रकार:', MARGIN, y);
  ctx.textAlign = 'right';
  ctx.font = `700 16px ${FONT_FAMILY}`;
  ctx.fillText(modeStr, colAmtRight, y);
  y += 28;

  drawDashedDivider(y);
  y += 12;

  // === 3-COLUMN TABLE HEADER: वस्तू | नग/वजन | रक्कम ===
  ctx.font = `800 16px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('वस्तू', MARGIN, y);
  ctx.textAlign = 'right';
  ctx.fillText('नग/वजन', colQtyRight - 4, y);
  ctx.fillText('रक्कम', colAmtRight, y);
  y += 26;

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(PAPER_WIDTH - MARGIN, y);
  ctx.stroke();
  ctx.restore();
  y += 10;

  // === ITEM ROWS ===
  measuredRows.forEach((row, idx) => {
    ctx.fillStyle = '#000000';

    // Col 1: Item Name (wrapped)
    ctx.textAlign = 'left';
    ctx.font = `600 16px ${FONT_FAMILY}`;
    row.itemLines.forEach((line, lineIdx) => {
      ctx.fillText(line, MARGIN, y + lineIdx * LINE_H);
    });

    // Col 2: Qty / Weight (wrapped right-aligned)
    ctx.textAlign = 'right';
    ctx.font = `600 15px ${FONT_FAMILY}`;
    row.qtyLines.forEach((line, lineIdx) => {
      ctx.fillText(line, colQtyRight - 4, y + lineIdx * LINE_H);
    });

    // Col 3: Amount (right-aligned bold)
    ctx.font = `700 16px ${MONO_FONT}`;
    ctx.fillText(row.amountText, colAmtRight, y);

    y += row.rowHeight;
    if (idx < measuredRows.length - 1) {
      drawDottedDivider(y - 7);
    }
  });

  // === GRAND TOTAL ===
  drawDashedDivider(y + 2);
  y += 16;

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.font = `800 20px ${FONT_FAMILY}`;
  ctx.fillText('एकूण रक्कम', MARGIN, y + 4);

  ctx.textAlign = 'right';
  ctx.font = `800 28px ${MONO_FONT}`;
  ctx.fillText(formatRupees(bill.total), colAmtRight, y);
  y += 42;

  if (showPendingBalance) {
    ctx.textAlign = 'left';
    ctx.font = `700 16px ${FONT_FAMILY}`;
    ctx.fillText('एकूण उधार बाकी:', MARGIN, y + 2);

    ctx.textAlign = 'right';
    ctx.font = `800 18px ${MONO_FONT}`;
    ctx.fillText(formatRupees(pendingBalance!), colAmtRight, y);
    y += 32;
  }

  // === FOOTER GREETING ===
  drawDashedDivider(y + 4);
  y += 18;

  ctx.textAlign = 'center';
  ctx.font = `800 17px ${FONT_FAMILY}`;
  ctx.fillText('धन्यवाद! पुन्हा भेट द्या!', PAPER_WIDTH / 2, y);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Failed to generate paper receipt PNG'));
    }, 'image/png');
  });

  const filename = `janshanti-bill-${bill.billNumber}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  return { blob, file, filename };
}

export function downloadBlobAsPng(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyImageBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.write === 'function' &&
      typeof ClipboardItem !== 'undefined'
    ) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    }
  } catch {
    // Clipboard image write may be unavailable in restricted contexts
  }
  return false;
}

/**
 * Sends the rendered 80mm paper copy PNG to WhatsApp:
 * - On mobile / Web Share Level 2 devices: opens native share sheet with the PNG file attached.
 * - On desktop / iframe browsers: copies the paper PNG to clipboard AND downloads the PNG file,
 *   returning the direct customer WhatsApp chat URL so the user can paste (Ctrl+V) or attach the photo.
 */
export async function sharePaperReceipt({
  bill,
  mobile,
  pendingBalance,
  lang,
}: {
  bill: Bill;
  mobile?: string;
  pendingBalance?: number;
  lang: Language;
}): Promise<PaperShareResult> {
  const { blob, file, filename } = await renderPaperReceiptToBlob(
    bill,
    pendingBalance
  );
  const chatUrl = buildWhatsAppChatUrl(mobile);

  // 1. Try native file sharing (works directly to WhatsApp on Android / iOS / supported browsers)
  try {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title:
          lang === 'mr'
            ? `जनशांती किराणा — बिल #${bill.billNumber}`
            : `Janshanti Kirana — Bill #${bill.billNumber}`,
      });
      return {
        status: 'shared',
        copied: false,
        downloaded: false,
        filename,
        chatUrl,
      };
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        status: 'cancelled',
        copied: false,
        downloaded: false,
        filename,
        chatUrl,
      };
    }
    // Fall through to clipboard + download fallback if Web Share is blocked (e.g. iframe / desktop)
  }

  // 2. Desktop / iframe fallback: copy paper PNG to clipboard AND download PNG image
  const copied = await copyImageBlobToClipboard(blob);
  downloadBlobAsPng(blob, filename);

  return {
    status: 'ready_for_whatsapp',
    copied,
    downloaded: true,
    filename,
    chatUrl,
  };
}
