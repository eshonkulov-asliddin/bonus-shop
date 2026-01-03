
import React, { useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  userName?: string;
  downloadLabel?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, size = 220, userName = 'cashback', downloadLabel = 'Download QR' }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    // Create canvas - always use high res for download
    const downloadSize = 280;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with padding
    const padding = 40;
    canvas.width = downloadSize + padding * 2;
    canvas.height = downloadSize + padding * 2;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, downloadSize, downloadSize);
      URL.revokeObjectURL(url);

      // Download as PNG
      const link = document.createElement('a');
      link.download = `${userName.replace(/\s+/g, '_')}_cashback_qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }, [userName]);

  return (
    <div className="flex flex-col items-center bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-100 border border-slate-50 transition hover:shadow-indigo-100/50 w-full max-w-[320px] sm:max-w-none">
      <div ref={qrRef} className="p-3 sm:p-6 bg-white rounded-xl sm:rounded-[2rem] border-2 sm:border-4 border-slate-100" style={{ backgroundColor: '#ffffff' }}>
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
      <button
        onClick={handleDownload}
        className="mt-3 sm:mt-4 flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm sm:text-xs rounded-xl transition-colors shadow-lg shadow-indigo-200"
      >
        <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {downloadLabel}
      </button>
    </div>
  );
};
