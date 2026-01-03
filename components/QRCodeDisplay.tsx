
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  screenshotHint?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, size = 220, screenshotHint = '📷 Skrinshot oling va saqlang' }) => {
  return (
    <div className="flex flex-col items-center bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-100 border border-slate-50 transition hover:shadow-indigo-100/50 w-full max-w-[320px] sm:max-w-none">
      <div className="p-3 sm:p-6 bg-white rounded-xl sm:rounded-[2rem] border-2 sm:border-4 border-slate-100" style={{ backgroundColor: '#ffffff' }}>
        <QRCodeSVG 
          value={value} 
          size={size}
          level="M"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <div className="mt-3 sm:mt-5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
        <p className="text-slate-400 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em]">
            Secure Identity Link
        </p>
      </div>
      <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
        <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-amber-700 font-semibold text-xs sm:text-sm">{screenshotHint}</span>
      </div>
    </div>
  );
};
