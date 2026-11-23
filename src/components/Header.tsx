import { ArrowLeft, ShieldCheck, Store } from 'lucide-react';
import { formatTodayDate, translations } from '../i18n/translations';
import { Language, Screen } from '../types/pos';

interface HeaderProps {
  lang: Language;
  screen: Screen;
  onToggleLang: (lang: Language) => void;
  onGoHome: () => void;
  onGoHisab: () => void;
}

export function Header({
  lang,
  screen,
  onToggleLang,
  onGoHome,
  onGoHisab,
}: HeaderProps) {
  const t = translations[lang];
  const todayFormatted = formatTodayDate(lang);

  return (
    <header className="no-print sticky top-0 z-30 bg-white border-b-2 border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back Button (on sub-screens) + Shop Name */}
        <div className="flex items-center gap-3 min-w-0">
          {screen !== 'home' ? (
            <button
              type="button"
              onClick={onGoHome}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[50px] rounded-xl bg-slate-900 text-white text-[18px] font-bold hover:bg-slate-800 active:scale-[0.98] transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              <span>{t.homeBtn}</span>
            </button>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Store className="w-7 h-7" />
            </div>
          )}

          <button
            type="button"
            onClick={onGoHome}
            className="text-left cursor-pointer group min-w-0"
          >
            <h1 className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight truncate group-hover:text-emerald-700 transition-colors">
              {t.shopName}
            </h1>
          </button>
        </div>

        {/* Center: Date & Backup Safe status */}
        <div className="hidden lg:flex items-center gap-4 text-[18px] text-slate-700 font-medium">
          <span className="whitespace-nowrap">{todayFormatted}</span>
          <span className="text-slate-300" aria-hidden="true">
            |
          </span>
          <button
            type="button"
            onClick={onGoHisab}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[18px] hover:bg-emerald-100 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{t.backupSafe}</span>
          </button>
        </div>

        {/* Right: 1-Click Marathi / English Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            role="group"
            aria-label="Language switcher"
            className="inline-flex items-center p-1 bg-slate-100 border-2 border-slate-300 rounded-xl"
          >
            <button
              type="button"
              onClick={() => onToggleLang('mr')}
              aria-pressed={lang === 'mr'}
              className={`px-4 py-2 min-h-[44px] rounded-lg text-[18px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                lang === 'mr'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => onToggleLang('en')}
              aria-pressed={lang === 'en'}
              className={`px-4 py-2 min-h-[44px] rounded-lg text-[18px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                lang === 'en'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Compact Date & Backup bar for smaller screens */}
      <div className="lg:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-between gap-3 bg-slate-50 text-[18px]">
        <span className="text-slate-700 font-medium truncate">{todayFormatted}</span>
        <button
          type="button"
          onClick={onGoHisab}
          className="flex items-center gap-1.5 text-emerald-800 font-bold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <span>{t.backupSafe}</span>
        </button>
      </div>
    </header>
  );
}
