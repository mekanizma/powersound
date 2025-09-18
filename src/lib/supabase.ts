import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase bağlantı bilgileri eksik! Lütfen .env dosyasını kontrol edin.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': supabaseAnonKey
    }
  }
});

// Bağlantı durumunu kontrol et
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) {
      console.error('Veritabanı bağlantı hatası:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    return false;
  }
};

// Bağlantı durumunu periyodik olarak kontrol et
setInterval(async () => {
  const isConnected = await checkConnection();
  if (!isConnected) {
    console.error('Veritabanı bağlantısı kesildi!');
    // Burada kullanıcıya bildirim gösterilebilir
  }
}, 30000); // Her 30 saniyede bir kontrol et