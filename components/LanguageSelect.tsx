import React from 'react';
import { useI18n, Lang } from '../services/i18n';

const languages: { code: Lang; label: string; short: string }[] = [
  { code: 'uz', label: "O'z", short: 'UZ' },
  { code: 'en', label: 'En', short: 'EN' },
  { code: 'ru', label: 'Ру', short: 'RU' },
];

export const LanguageSelect: React.FC<{ className?: string }>
  = ({ className = '' }) => {
  const { lang, setLang } = useI18n();

  return (
    <div className={`flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl ${className}`}>
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => setLang(language.code)}
          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
            language.code === lang 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelect;
