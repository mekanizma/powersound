export const printBarkod = (barkodRef: React.RefObject<HTMLCanvasElement>, urunAdi?: string, urunModel?: string) => {
  const canvas = barkodRef.current;
  if (!canvas) return;

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Get the barcode image
  const barkodImage = canvas.toDataURL('image/png');

  // Create print document
  printWindow.document.write(`
    <html>
      <head>
        <title>Barkod Yazdır</title>
        <style>
          body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; }
          img { max-width: 100%; height: auto; }
          .urun-bilgi { font-size: 18px; font-weight: bold; margin-bottom: 8px; text-align: center; }
          .urun-model { font-size: 15px; color: #555; margin-bottom: 12px; text-align: center; }
          @media print {
            body { margin: 0; padding: 0; }
            img { width: 100%; max-width: 300px; }
          }
        </style>
      </head>
      <body>
        ${urunAdi ? `<div class='urun-bilgi'>${urunAdi}</div>` : ''}
        ${urunModel ? `<div class='urun-model'>${urunModel}</div>` : ''}
        <img src="${barkodImage}" onload="window.print(); window.close();" />
      </body>
    </html>
  `);
  printWindow.document.close();
};