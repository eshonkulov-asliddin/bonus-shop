import React from 'react';
import { useI18n, Lang } from '../services/i18n';

type Props = {
  className?: string;
  size?: 'sm' | 'md';
};

const LANGS: Array<{ code: Lang; label: string; flag: string }> = [
  { code: 'uz', label: 'Uzbek', flag: '🇺🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export const LanguageSelector: React.FC<Props> = ({ className = '', size = 'md' }) => {
  const { lang, setLang } = useI18n();

  const pad = size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs';
  const gap = size === 'sm' ? 'gap-1' : 'gap-2';

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`inline-flex ${gap} p-1 rounded-full bg-slate-100 border border-slate-200 shadow-sm`}
        role="group" aria-label="Language selector">
        {LANGS.map(l => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className={`inline-flex items-center ${pad} rounded-full font-semibold transition-all active:scale-95 select-none ` +
              (lang === l.code
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/70')}
            aria-pressed={lang === l.code}
          >
            <span className="mr-1.5 leading-none" aria-hidden>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
