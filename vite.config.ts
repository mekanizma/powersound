import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
  },
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'vendor_react';
            }
            if (id.includes('recharts')) {
              return 'vendor_recharts';
            }
            if (id.includes('xlsx')) {
              return 'vendor_xlsx';
            }
            // İstersen diğer büyük paketleri burada ayırabilirsin
            return 'vendor_other';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500, // İstersen bu limit ile uyarı sınırını büyütebilirsin
  },
});
