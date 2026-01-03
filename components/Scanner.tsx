
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const hasScannedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scannerId] = useState(() => `qr-reader-${Date.now()}`);
  const [error, setError] = useState<string>('');
  const [isStarting, setIsStarting] = useState(true);
  const [showManualStart, setShowManualStart] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const startScanner = async () => {
    if (scannerRef.current) return;
    
    setIsStarting(true);
    setError('');
    setShowManualStart(false);
    
    try {
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        setError('Kamera topilmadi / No camera found');
        setIsStarting(false);
        return;
      }

      // Prefer back camera
      let cameraId = devices[0].id;
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      if (backCamera) {
        cameraId = backCamera.id;
      }

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          if (hasScannedRef.current) return;
          
          const trimmedData = decodedText?.trim();
          if (!trimmedData) return;
          
          hasScannedRef.current = true;
          
          // Stop scanner
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          
          onScanRef.current(trimmedData);
        },
        () => {
          // Silently ignore scan errors
        }
      );
      
      setIsStarting(false);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setIsStarting(false);
      
      // Check if it's a permission error
      if (err?.message?.includes('Permission') || err?.name === 'NotAllowedError') {
        setError('Kameraga ruxsat bering / Allow camera access');
        setShowManualStart(true);
      } else if (err?.message?.includes('NotFoundError') || err?.message?.includes('no camera')) {
        setError('Kamera topilmadi / No camera found');
      } else {
        setError('Kamerani ishga tushirib bo\'lmadi / Camera failed');
        setShowManualStart(true);
      }
    }
  };

  useEffect(() => {
    hasScannedRef.current = false;
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scannerId]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-3 border-b flex justify-between items-center bg-indigo-600 text-white">
          <h3 className="font-bold text-sm">QR Skanerlash</h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-indigo-500 rounded-full transition"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>
        
        <div className="relative bg-black" style={{ minHeight: '280px' }}>
          <div id={scannerId} ref={containerRef} className="w-full"></div>
          
          {isStarting && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-white text-sm font-medium">Kamera yuklanmoqda...</p>
                <p className="text-slate-400 text-xs mt-1">Loading camera...</p>
              </div>
            </div>
          )}
          
          {showManualStart && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center px-4">
                <button
                  onClick={startScanner}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors mb-3"
                >
                  📷 Kamerani yoqish
                </button>
                <p className="text-slate-400 text-xs">Tap to start camera</p>
              </div>
            </div>
          )}
        </div>
        
        {error && !showManualStart && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-100">
            <p className="text-red-600 text-xs font-semibold text-center">{error}</p>
            <button 
              onClick={startScanner}
              className="mt-2 w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition"
            >
              Qayta urinish / Try again
            </button>
          </div>
        )}
        
        <div className="p-3 bg-slate-50 border-t">
          <p className="text-slate-500 text-[11px] text-center">QR kodni kamera old tomoniga joylashtiring</p>
        </div>
      </div>
      
      <style>{`
        #${scannerId} {
          width: 100% !important;
          border: none !important;
        }
        #${scannerId} video {
          width: 100% !important;
          height: 280px !important;
          object-fit: cover !important;
        }
      `}</style>
    </div>
  );
};
