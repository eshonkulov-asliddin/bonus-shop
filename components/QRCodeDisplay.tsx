
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, size = 200 }) => {
  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-100 border border-slate-50 transition hover:shadow-indigo-100/50">
      <div className="p-4 bg-white rounded-[2rem] border-2 border-slate-50">
        <QRCodeSVG 
          value={value} 
          size={size}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='indigo'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' /%3E%3C/svg%3E",
            x: undefined,
            y: undefined,
            height: 24,
            width: 24,
            excavate: true,
          }}
        />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
            Secure Identity Link
        </p>
      </div>
    </div>
  );
};
