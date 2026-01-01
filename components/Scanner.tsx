
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
        scannerRef.current?.clear();
      },
      (error) => {
        // Just ignore failures
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white">
          <h3 className="font-bold">Scan Customer QR</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-indigo-500 rounded-full transition"
          >
            ✕
          </button>
        </div>
        <div id="reader" className="w-full"></div>
        <div className="p-4 bg-slate-50 text-center text-sm text-slate-500">
          Position the QR code within the frame
        </div>
      </div>
    </div>
  );
};
