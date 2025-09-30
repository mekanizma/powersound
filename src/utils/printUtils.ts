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
          @page { size: auto; margin: 0; }
          html, body { height: auto; }
          body { margin: 0; padding: 0; }

          /* Sayfa düzeni: 50mm x 30mm iki etiket yan yana */
          .sheet {
            display: grid;
            grid-template-columns: 50mm 50mm; /* iki bitişik etiket */
            grid-template-rows: 30mm;       /* tek satır 30mm */
            gap: 0;                          /* bitişik */
            justify-content: start;
            align-content: start;
            padding: 0;
            width: 100mm;                    /* 2 x 50mm */
            height: 30mm;                    /* 30mm */
            box-sizing: border-box;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .label {
            width: 50mm;
            height: 30mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            padding: 0;                       /* bitişik ve sıfır boşluk */
            margin: 0;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .urun-bilgi { font-size: 10px; font-weight: 700; margin: 1.5mm 0 1mm; text-align: center; line-height: 1.1; }
          .urun-model { font-size: 9px; color: #000; margin: 0 0 1.5mm; text-align: center; line-height: 1.1; }
          .barcode-img { width: 48mm; height: auto; max-height: 18mm; }

          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="label">
            ${urunAdi ? `<div class='urun-bilgi'>${urunAdi}</div>` : ''}
            ${urunModel ? `<div class='urun-model'>${urunModel}</div>` : ''}
            <img class="barcode-img" src="${barkodImage}" />
          </div>
          <div class="label">
            ${urunAdi ? `<div class='urun-bilgi'>${urunAdi}</div>` : ''}
            ${urunModel ? `<div class='urun-model'>${urunModel}</div>` : ''}
            <img class="barcode-img" src="${barkodImage}" />
          </div>
        </div>
        <script>
          // Otomatik yazdır ve pencereyi kapat
          window.addEventListener('load', () => {
            window.print();
            setTimeout(() => window.close(), 100);
          });
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};