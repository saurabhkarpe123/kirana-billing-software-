import {
  BookOpen,
  IndianRupee,
  Package,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';
import { formatRupees, translations } from '../i18n/translations';
import { Language, Screen } from '../types/pos';

interface HomeScreenProps {
  lang: Language;
  totalPendingUdhaar: number;
  lowStockCount: number;
  todaySalesTotal: number;
  todayBillCount: number;
  onNavigate: (screen: Screen) => void;
}

export function HomeScreen({
  lang,
  totalPendingUdhaar,
  lowStockCount,
  todaySalesTotal,
  todayBillCount,
  onNavigate,
}: HomeScreenProps) {
  const t = translations[lang];

  return (
    <main className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <p className="text-[20px] sm:text-[22px] font-semibold text-slate-700">
          {t.homeSubtitle}
        </p>
        <p className="text-[18px] font-medium text-slate-500">
          {t.shortcutHint}
        </p>
      </div>

      {/* iLovePDF-Inspired 2x2 Massive Color-Coded Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {/* 1. GREEN CARD: New Bill (F1) */}
        <button
          type="button"
          onClick={() => onNavigate('billing')}
          className="group text-left bg-white rounded-2xl border-2 border-emerald-200 hover:border-emerald-600 hover:shadow-xl active:scale-[0.99] transition-all p-7 sm:p-8 flex flex-col justify-between min-h-[240px] cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors shrink-0">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <span className="px-4 py-1.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 font-mono text-[20px] font-extrabold">
              F1
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
              {t.cardNewBillTitle}
            </h2>
            <p className="mt-2 text-[19px] text-slate-600 font-medium leading-snug">
              {t.cardNewBillDesc}
            </p>
          </div>
        </button>

        {/* 2. ORANGE CARD: Customer Khata (F2) */}
        <button
          type="button"
          onClick={() => onNavigate('khata')}
          className="group text-left bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-600 hover:shadow-xl active:scale-[0.99] transition-all p-7 sm:p-8 flex flex-col justify-between min-h-[240px] cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-20 h-20 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-sm group-hover:bg-orange-700 transition-colors shrink-0">
              <BookOpen className="w-10 h-10" />
            </div>
            <span className="px-4 py-1.5 rounded-xl bg-orange-50 border-2 border-orange-300 text-orange-900 font-mono text-[20px] font-extrabold">
              F2
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 leading-tight group-hover:text-orange-700 transition-colors">
              {t.cardKhataTitle}
            </h2>
            <p className="mt-2 text-[19px] text-slate-600 font-medium leading-snug">
              {t.cardKhataDesc}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[19px]">
              <span className="text-slate-600 font-medium">{t.pendingTotalLabel}</span>
              <span className="font-extrabold text-red-700 tabular-nums text-[22px]">
                {formatRupees(totalPendingUdhaar)}
              </span>
            </div>
          </div>
        </button>

        {/* 3. BLUE CARD: Items & Rates (F3) */}
        <button
          type="button"
          onClick={() => onNavigate('stock')}
          className="group text-left bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-600 hover:shadow-xl active:scale-[0.99] transition-all p-7 sm:p-8 flex flex-col justify-between min-h-[240px] cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors shrink-0">
              <Package className="w-10 h-10" />
            </div>
            <span className="px-4 py-1.5 rounded-xl bg-blue-50 border-2 border-blue-300 text-blue-900 font-mono text-[20px] font-extrabold">
              F3
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
              {t.cardStockTitle}
            </h2>
            <p className="mt-2 text-[19px] text-slate-600 font-medium leading-snug">
              {t.cardStockDesc}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[19px]">
              {lowStockCount > 0 ? (
                <span className="inline-flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="tabular-nums">
                    {lowStockCount} {t.lowStockCountLabel}
                  </span>
                </span>
              ) : (
                <span className="font-bold text-emerald-700">{t.allStockOkLabel}</span>
              )}
            </div>
          </div>
        </button>

        {/* 4. PURPLE CARD: Today's Cash (F4) */}
        <button
          type="button"
          onClick={() => onNavigate('hisab')}
          className="group text-left bg-white rounded-2xl border-2 border-purple-200 hover:border-purple-600 hover:shadow-xl active:scale-[0.99] transition-all p-7 sm:p-8 flex flex-col justify-between min-h-[240px] cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-20 h-20 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-sm group-hover:bg-purple-800 transition-colors shrink-0">
              <IndianRupee className="w-10 h-10" />
            </div>
            <span className="px-4 py-1.5 rounded-xl bg-purple-50 border-2 border-purple-300 text-purple-900 font-mono text-[20px] font-extrabold">
              F4
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 leading-tight group-hover:text-purple-700 transition-colors">
              {t.cardHisabTitle}
            </h2>
            <p className="mt-2 text-[19px] text-slate-600 font-medium leading-snug">
              {t.cardHisabDesc}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[19px]">
              <span className="text-slate-600 font-medium">
                {t.todaySaleSmallLabel} ({todayBillCount})
              </span>
              <span className="font-extrabold text-purple-800 tabular-nums text-[22px]">
                {formatRupees(todaySalesTotal)}
              </span>
            </div>
          </div>
        </button>
      </div>
    </main>
  );
}
