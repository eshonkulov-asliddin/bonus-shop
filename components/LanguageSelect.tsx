import React from 'react';
import { useI18n, Lang } from '../services/i18n';

export const LanguageSelect: React.FC<{ className?: string; size?: 'sm' | 'md' }>
  = ({ className = '', size = 'md' }) => {
  const { lang, setLang } = useI18n();
  const pad = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3 py-2.5 text-sm';

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className={`${pad} bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-colors ${className}`}
    >
      <option value="uz">🇺🇿 Uzbek</option>
      <option value="en">🇬🇧 English</option>
      <option value="ru">🇷🇺 Русский</option>
    </select>
  );
};

export default LanguageSelect;
