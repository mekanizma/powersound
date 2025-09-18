import { supabase } from '../lib/supabase';

// Benzersiz barkod oluşturma fonksiyonu
export const generateBarkod = (): string => {
  const prefix = 'PS'; // PowerSound prefix
  const timestamp = Date.now().toString().slice(-10); // Son 10 haneyi al
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4 haneli rastgele sayı
  
  return `${prefix}${timestamp}${random}`;
};

// Barkod kontrolü
export const checkExistingBarkod = async (barkod: string): Promise<boolean> => {
  try {
    if (!barkod) {
      throw new Error('Barkod boş olamaz');
    }

    const { data, error } = await supabase
      .from('products')
      .select('barcode')
      .eq('barcode', barkod)
      .maybeSingle();

    if (error) {
      console.error('Barkod kontrol hatası:', error);
      throw new Error('Barkod kontrolü sırasında bir hata oluştu');
    }

    return !!data;
  } catch (error) {
    console.error('Barkod kontrol hatası:', error);
    throw error;
  }
};

// Benzersiz barkod oluştur
export const generateUniqueBarkod = async (): Promise<string> => {
  let barkod: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!isUnique && attempts < maxAttempts) {
    try {
      barkod = generateBarkod();
      const exists = await checkExistingBarkod(barkod);
      if (!exists) {
        isUnique = true;
        return barkod;
      }
      attempts++;
    } catch (error) {
      console.error('Benzersiz barkod oluşturma hatası:', error);
      throw new Error('Benzersiz barkod oluşturulamadı');
    }
  }

  throw new Error('Benzersiz barkod oluşturulamadı, lütfen tekrar deneyin');
};

// Tarih formatlama fonksiyonu (YYYY-MM-DD -> DD.MM.YYYY)
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) {
      throw new Error('Geçersiz tarih formatı');
    }
    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error('Tarih formatlama hatası:', error);
    return dateString;
  }
};

// Tarih formatlama fonksiyonu (DD.MM.YYYY -> YYYY-MM-DD)
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const [day, month, year] = dateString.split('.');
    if (!year || !month || !day) {
      throw new Error('Geçersiz tarih formatı');
    }
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Tarih formatlama hatası:', error);
    return dateString;
  }
};