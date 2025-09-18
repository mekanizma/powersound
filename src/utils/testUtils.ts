import { Urun, Hareket, Kategori, Lokasyon } from '../types';

export const mockProduct: Urun = {
  id: 1,
  barkod: '123456789',
  ad: 'Test Ürün',
  aciklama: 'Test açıklama',
  miktar: 10,
  birim: 'adet',
  kategori_id: 1,
  lokasyon_id: 1,
  created_at: new Date().toISOString(),
};

export const mockMovement: Hareket = {
  id: 1,
  urun_id: 1,
  hareket_tipi: 'giris',
  miktar: 5,
  aciklama: 'Test hareket',
  created_at: new Date().toISOString(),
};

export const mockCategory: Kategori = {
  id: 1,
  ad: 'Test Kategori',
  aciklama: 'Test kategori açıklaması',
};

export const mockLocation: Lokasyon = {
  id: 1,
  ad: 'Test Lokasyon',
  aciklama: 'Test lokasyon açıklaması',
};

export const createMockProducts = (count: number): Urun[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockProduct,
    id: index + 1,
    barkod: `123456789${index}`,
    ad: `Test Ürün ${index + 1}`,
  }));
};

export const createMockMovements = (count: number): Hareket[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockMovement,
    id: index + 1,
    urun_id: index + 1,
  }));
};

export const createMockCategories = (count: number): Kategori[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockCategory,
    id: index + 1,
    ad: `Test Kategori ${index + 1}`,
  }));
};

export const createMockLocations = (count: number): Lokasyon[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockLocation,
    id: index + 1,
    ad: `Test Lokasyon ${index + 1}`,
  }));
};

export const waitFor = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const mockFetch = (data: any, delay = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: () => Promise.resolve(data),
      });
    }, delay);
  });
}; 