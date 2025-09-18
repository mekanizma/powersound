import React, { useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { printBarkod } from '../utils/printUtils';

interface BarkodGeneratorProps {
  barkod: string;
  urunAdi: string;
  model?: string;
  onPrint?: () => void;
}

const BarkodGenerator: React.FC<BarkodGeneratorProps> = ({ barkod, urunAdi, model, onPrint }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  React.useEffect(() => {
    if (canvasRef.current && barkod) {
      JsBarcode(canvasRef.current, barkod, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        text: barkod,
        fontSize: 16,
        margin: 10,
      });
    }
  }, [barkod]);

  const handlePrint = () => {
    printBarkod(canvasRef, urunAdi, model);
    if (onPrint) onPrint();
  };

  return (
    <div className="barkod-container flex flex-col items-center p-4 border border-gray-200 rounded-lg bg-white">
      <div className="urun-bilgi">{urunAdi}</div>
      {model && <div className="urun-model">{model}</div>}
      <canvas ref={canvasRef}></canvas>
      <button
        onClick={handlePrint}
        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
      >
        Yazdır
      </button>
    </div>
  );
};

export default BarkodGenerator;