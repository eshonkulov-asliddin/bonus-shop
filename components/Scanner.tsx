
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

// Track if camera permission was already granted this session
let cameraPermissionGranted = false;

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const onScanRef = useRef(onScan);
  const hasScannedRef = useRef(false);
  const [scannerId] = useState(() => `qr-reader-${Date.now()}`);
  const [error, setError] = useState<string>('');

  // Keep onScan callback updated
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    hasScannedRef.current = false;
    setError('');
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(async () => {
      try {
        // Only check permission if not already granted this session
        if (!cameraPermissionGranted) {
          try {
            // Check permission status without prompting if possible
            if (navigator.permissions && navigator.permissions.query) {
              const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
              if (result.state === 'denied') {
                setError('Camera access denied. Please allow camera permissions in your browser settings.');
                return;
              }
              if (result.state === 'granted') {
                cameraPermissionGranted = true;
              }
            }
            
            // If not already granted, do a quick permission request
            if (!cameraPermissionGranted) {
              const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
              });
              stream.getTracks().forEach(track => track.stop());
              cameraPermissionGranted = true;
            }
          } catch (permError) {
            console.error('Camera permission error:', permError);
            setError('Camera access denied. Please allow camera permissions in your browser settings.');
            return;
          }
        }

        const scanner = new Html5QrcodeScanner(
          scannerId,
          { 
            fps: 10,
            qrbox: 250,
            aspectRatio: 1.0,
            disableFlip: false,
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            videoConstraints: {
              facingMode: "environment"
            },
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          false
        );

        scanner.render(
          (decodedText) => {
            // Prevent multiple scans
            if (hasScannedRef.current) return;
            
            // Ignore empty scans silently
            const trimmedData = decodedText?.trim();
            if (!trimmedData) return;
            
            hasScannedRef.current = true;
            
            // Pause scanner immediately to freeze frame
            try {
              scanner.pause(true);
            } catch (e) {
              // ignore if pause fails
            }
            
            // Clean up scanner
            scanner.clear().catch(() => {});
            scannerRef.current = null;
            
            // Call parent callback
            onScanRef.current(trimmedData);
          },
          (errorMessage) => {
            // Silently ignore scan failures
          }
        );

        scannerRef.current = scanner;
      } catch (err) {
        console.error('Scanner init error:', err);
        setError('Failed to initialize camera. Please check permissions.');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(() => {});
        } catch (e) {
          // ignore
        }
        scannerRef.current = null;
      }
    };
  }, [scannerId]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-3 border-b flex justify-between items-center bg-indigo-600 text-white">
          <h3 className="font-bold text-sm">Scan Customer QR</h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-indigo-500 rounded-full transition"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>
        
        <div id={scannerId} className="w-full" style={{ maxHeight: '300px', overflow: 'hidden' }}></div>
        
        {error && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-100">
            <p className="text-red-600 text-xs font-semibold text-center">{error}</p>
          </div>
        )}
        
        <div className="p-3 bg-slate-50 text-center text-xs text-slate-500">
          Position the QR code within the frame
        </div>
      </div>
      
      <style>{`
        #${scannerId} {
          border: none !important;
        }
        #${scannerId} video {
          width: 100% !important;
          height: 250px !important;
          object-fit: cover !important;
          border-radius: 0 !important;
        }
        #${scannerId}__scan_region {
          width: 100% !important;
          min-height: 250px !important;
        }
        #${scannerId} img {
          display: none;
        }
        #${scannerId}__dashboard_section_swaplink {
          display: none !important;
        }
        #${scannerId}__header_message {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
