
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, size = 280 }) => {
  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-100 border border-slate-50 transition hover:shadow-indigo-100/50">
      <div className="p-6 bg-white rounded-[2rem] border-4 border-slate-100" style={{ backgroundColor: '#ffffff' }}>
        <QRCodeSVG 
          value={value} 
          size={size}
          level="M"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
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
