// Kullanıcı tipleri
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
}

// Ürün tipleri
export interface Urun {
  id: string;
  ad: string;
  marka: string;
  model: string;
  kategori: string;
  durum: string;
  lokasyon: string;
  seriNo: string;
  barkod: string;
  miktar: number;
  eklemeTarihi: string;
  photo_url?: string;
}

// Hareket tipleri
export interface Hareket {
  id: number;
  urun_id: number;
  hareket_tipi: 'giris' | 'cikis';
  miktar: number;
  aciklama: string;
  created_at: string;
}

// Kategori tipleri
export interface Kategori {
  id: number;
  ad: string;
  aciklama: string;
}

// Lokasyon tipleri
export interface Lokasyon {
  id: number;
  ad: string;
  aciklama: string;
}

// API yanıt tipleri
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Form tipleri
export interface FormError {
  field: string;
  message: string;
}

// Pagination tipleri
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
} 