declare module "react-qr-scanner";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QrScanner from 'react-qr-scanner';

// @ts-ignore
// eslint-disable-next-line
// typescript için modül bildirimi
// Eğer @types/react-qr-scanner yoksa aşağıdaki satırı ekle
// declare module 'react-qr-scanner';

interface BarcodeScannerProps {
  onClose?: () => void;
  onScan?: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onClose, onScan }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const navigate = useNavigate();
  const [cameraActive, setCameraActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Kamera izinlerini kontrol et
    const checkCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setError(null);
      } catch (err) {
        setError('Kamera erişimi reddedildi. Lütfen kamera izinlerini kontrol edin.');
        setCameraActive(false);
      }
    };

    checkCameraPermission();
  }, []);

  const handleScan = async (data: string | null) => {
    if (data) {
      setCameraActive(false);
      setBarcodeInput(data);
      
      if (onScan) {
        onScan(data);
      } else {
        try {
          const { data: product, error } = await supabase
            .from('products')
            .select('id')
            .eq('barcode', data)
            .single();

          if (error) {
            setError('Ürün bulunamadı');
            setCameraActive(true);
            return;
          }

          if (product) {
            navigate(`/urunler/${product.id}`);
            if (onClose) onClose();
          }
        } catch (err) {
          setError('Bir hata oluştu');
          setCameraActive(true);
        }
      }
    }
  };

  const handleError = (err: any) => {
    console.error('Scanner error:', err);
    setError('Kamera başlatılamadı. Lütfen kamera erişimini kontrol edin.');
    setCameraActive(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Barkod Tarama</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {cameraActive && (
          <div className="relative">
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%' }}
              constraints={{
                video: { facingMode: 'environment' }
              }}
            />
            <div className="absolute inset-0 border-2 border-indigo-500 rounded-lg pointer-events-none"></div>
          </div>
        )}

        <input
          id="barcode-input"
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Barkodu okutun veya girin..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          autoComplete="off"
        />

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;