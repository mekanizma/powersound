import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Urun {
  id: string;
  ad: string;
  marka: string;
  model: string;
  kategori: string;
  durum: string;
  lokasyon: string;
  location_id: string;
  seriNo: string;
  aciklama: string;
  barkod: string;
  miktar: number;
  eklemeTarihi: string;
}

interface Hareket {
  id: string;
  urunId: string;
  urunAdi: string;
  tip: string;
  miktar: number;
  tarih: string;
  aciklama: string;
  lokasyon: string;
  kullanici: string;
}

interface Kategori {
  id: string;
  name: string;
}

interface EnvanterContextType {
  urunler: Urun[];
  hareketler: Hareket[];
  kategoriler: Kategori[];
  loading: boolean;
  error: string | null;
  addUrun: (urun: Urun) => Promise<void>;
  updateUrun: (id: string, updatedUrun: Partial<Urun>) => Promise<void>;
  removeUrun: (id: string) => Promise<void>;
  addHareket: (hareket: Hareket) => Promise<void>;
  updateHareket: (id: string, updatedHareket: Partial<Hareket>) => Promise<void>;
  removeHareket: (id: string) => Promise<void>;
  removeHareketler: (ids: string[]) => Promise<void>;
  addKategori: (kategori: Kategori) => Promise<void>;
  removeKategori: (id: string) => Promise<void>;
  isAdmin: boolean;
  loadProducts: () => Promise<void>;
}

const EnvanterContext = createContext<EnvanterContextType | undefined>(undefined);

export const EnvanterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [hareketler, setHareketler] = useState<Hareket[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadProducts(),
        loadLocations(),
        loadCategories(),
        loadMovements()
      ]);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setError('Veriler yüklenirken bir hata oluştu');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Ürünler yüklenirken bir hata oluştu');
      }

      const mappedProducts: Urun[] = data.map((item: any) => ({
        id: item.id,
        ad: item.name,
        marka: item.brand,
        model: item.model,
        kategori: item.category_id,
        durum: item.status,
        lokasyon: item.location_id,
        location_id: item.location_id,
        seriNo: item.serial_number,
        barkod: item.barcode,
        miktar: item.quantity,
        aciklama: item.description || '',
        eklemeTarihi: item.created_at
      }));

      setUrunler(mappedProducts);
    } catch (error) {
      console.error('Ürün yükleme hatası:', error);
      throw error;
    }
  };

  const loadLocations = async () => {
    // Implementation needed
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) {
        throw new Error('Kategoriler yüklenirken bir hata oluştu');
      }

      let categories = data || [];
      const hasOther = categories.some(
        (c: any) => String(c.name || '').toLowerCase() === 'diğer' || String(c.name || '').toLowerCase() === 'diger'
      );

      if (!hasOther) {
        const { data: inserted, error: insertError } = await supabase
          .from('categories')
          .insert([{ name: 'Diğer' }])
          .select('id, name')
          .single();

        if (!insertError && inserted) {
          categories = [...categories, inserted];
        }
      }

      setKategoriler(categories);
    } catch (error) {
      console.error('Kategori yükleme hatası:', error);
      throw error;
    }
  };

  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ürün adını bulmak için mevcut ürünleri kullan
      const currentProducts = await supabase
        .from('products')
        .select('id, name');
      const productMap = new Map((currentProducts.data || []).map((p: any) => [String(p.id), p.name]));

      const mapped = (data || []).map(item => {
        const urunAdi = productMap.get(String(item.product_id)) || '';
        // Eğer ürün adı bulunamazsa sessizce geç (kullanıcı "Bilinmeyen Ürün" görecek)
        return {
          id: item.id,
          urunId: item.product_id,
          urunAdi: urunAdi,
          tip: item.type,
          miktar: item.quantity,
          aciklama: item.description,
          lokasyon: item.location_id,
          tarih: item.created_at,
          kullanici: item.user_id,
        };
      });

      setHareketler(mapped);
    } catch (error) {
      console.error('Hareketler yüklenirken hata:', error);
    }
  };

  const addUrun = useCallback(async (urun: Urun) => {
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          name: urun.ad,
          brand: urun.marka,
          model: urun.model,
          category_id: urun.kategori,
          status: urun.durum,
          location_id: urun.lokasyon,
          serial_number: urun.seriNo,
          description: urun.aciklama,
          barcode: urun.barkod,
          quantity: urun.miktar
        }])
        ;

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Product addition error:', error);
      throw error;
    }
  }, [loadProducts]);

  const updateUrun = async (id: string, updatedUrun: Partial<Urun>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: updatedUrun.ad,
          brand: updatedUrun.marka,
          model: updatedUrun.model,
          category_id: updatedUrun.kategori,
          status: updatedUrun.durum,
          location_id: updatedUrun.lokasyon,
          serial_number: updatedUrun.seriNo,
          description: updatedUrun.aciklama,
          quantity: updatedUrun.miktar
        })
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Product update error:', error);
      throw error;
    }
  };

  const removeUrun = async (id: string) => {
    try {
      // First, delete all related movements
      const { error: movementsError } = await supabase
        .from('movements')
        .delete()
        .eq('product_id', id);

      if (movementsError) throw movementsError;

      // Then delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (productError) throw productError;

      await loadProducts();
    } catch (error) {
      console.error('Product removal error:', error);
      throw error;
    }
  };

  const updateHareket = async (id: string, updatedHareket: Partial<Hareket>) => {
    try {
      const eskiHareket = hareketler.find(h => h.id === id);
      if (!eskiHareket) throw new Error('Hareket bulunamadı');

      // Supabase'de hareketi güncelle
      const { error } = await supabase
        .from('movements')
        .update({
          type: updatedHareket.tip,
          quantity: updatedHareket.miktar,
          location_id: updatedHareket.lokasyon,
          description: updatedHareket.aciklama
        })
        .eq('id', id);

      if (error) throw error;

      // Hareketler listesini güncelle
      setHareketler(prevHareketler => 
        prevHareketler.map(hareket => 
          hareket.id === id 
            ? { ...hareket, ...updatedHareket }
            : hareket
        )
      );

      // Ürün miktarını güncelle
      const urun = urunler.find(u => String(u.id) === String(eskiHareket.urunId));
      if (urun && updatedHareket.miktar !== undefined && updatedHareket.tip) {
        // Eski hareketin etkisini geri al
        const eskiEtki = eskiHareket.tip === 'Giriş' ? -eskiHareket.miktar : eskiHareket.miktar;
        // Yeni hareketin etkisini ekle
        const yeniEtki = updatedHareket.tip === 'Giriş' ? updatedHareket.miktar : -updatedHareket.miktar;
        // Toplam etkiyi hesapla
        const toplamEtki = eskiEtki + yeniEtki;
        // Ürün miktarını güncelle
        const yeniMiktar = urun.miktar + toplamEtki;
        // Lokasyon değişikliği varsa uygula
        const yeniLokasyon = updatedHareket.lokasyon || urun.location_id;
        // Lokasyona göre durum belirle
        let yeniDurum: string = 'Depoda';
        try {
          const { data: locData } = await supabase
            .from('locations')
            .select('name')
            .eq('id', yeniLokasyon)
            .single();
          const locName = String(locData?.name || '').trim();
          if (locName) {
            if (locName.toLowerCase() === 'depo') yeniDurum = 'Depoda';
            else if (locName.toLowerCase() === 'servis') yeniDurum = 'Serviste';
            else yeniDurum = locName;
          }
        } catch {}
        setUrunler(prevUrunler =>
          prevUrunler.map(u =>
            u.id === urun.id
              ? { ...u, miktar: yeniMiktar, location_id: yeniLokasyon, lokasyon: yeniLokasyon, durum: yeniDurum }
              : u
          )
        );
        // Supabase'de ürün miktarını ve lokasyonunu güncelle
        await supabase
          .from('products')
          .update({ 
            quantity: yeniMiktar,
            location_id: yeniLokasyon,
            status: yeniDurum
          })
          .eq('id', urun.id);
      }

      // Ürün ve hareket listelerini tazele (sayfalar anında doğru sayı göstersin)
      await Promise.all([loadProducts(), loadMovements()]);
    } catch (error) {
      console.error('Hareket güncelleme hatası:', error);
      throw error;
    }
  };

  const addHareket = async (hareket: Hareket) => {
    try {
      console.log('Hareket ekleniyor:', hareket);
      // İş kuralı: Aynı üründe ardışık Çıkış yapılamaz. En son hareket Çıkış ise, yeni Çıkış reddedilir.
      if (hareket.tip === 'Çıkış') {
        const { data: lastMovements, error: lastErr } = await supabase
          .from('movements')
          .select('type, created_at')
          .eq('product_id', hareket.urunId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!lastErr && lastMovements && lastMovements.length > 0) {
          const lastType = lastMovements[0].type;
          if (String(lastType) === 'Çıkış') {
            throw new Error('Bu ürün için en son işlem Çıkış. Tekrar çıkış yapamazsınız. Lütfen önce Giriş işlemi yapın.');
          }
        }
      }
      
      const { data, error } = await supabase
        .from('movements')
        .insert([{
          product_id: hareket.urunId,
          type: hareket.tip,
          quantity: hareket.miktar,
          description: hareket.aciklama,
          location_id: hareket.lokasyon,
          user_id: hareket.kullanici || null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase hareket ekleme hatası:', error);
        throw new Error(`Veritabanı hatası: ${error.message}`);
      }

      console.log('Hareket başarıyla eklendi:', data);

      // Yeni hareketi listeye ekle
      const newHareket = {
        ...hareket,
        id: data.id,
        tarih: data.created_at
      };
      setHareketler(prev => [newHareket, ...prev]);

      // Ürün miktarını ve lokasyonunu güncelle
      const urun = urunler.find(u => String(u.id) === String(hareket.urunId));
      if (urun) {
        const yeniMiktar = urun.miktar + (hareket.tip === 'Giriş' ? hareket.miktar : -hareket.miktar);
        
        console.log('Ürün miktarı güncelleniyor:', {
          urunId: urun.id,
          eskiMiktar: urun.miktar,
          yeniMiktar,
          hareketTipi: hareket.tip,
          hareketMiktari: hareket.miktar
        });
        
        // Miktar negatif olamaz, minimum 0 olmalı
        const finalMiktar = Math.max(0, yeniMiktar);
        // Lokasyona göre durum belirle
        let yeniDurum: string = 'Depoda';
        try {
          const { data: locData } = await supabase
            .from('locations')
            .select('name')
            .eq('id', hareket.lokasyon)
            .single();
          const locName = String(locData?.name || '').trim();
          if (locName) {
            if (locName.toLowerCase() === 'depo') yeniDurum = 'Depoda';
            else if (locName.toLowerCase() === 'servis') yeniDurum = 'Serviste';
            else yeniDurum = locName;
          }
        } catch {}
        
        // Ürünü güncelle (miktar ve lokasyon)
        setUrunler(prevUrunler =>
          prevUrunler.map(u =>
            u.id === urun.id
              ? { ...u, miktar: finalMiktar, location_id: hareket.lokasyon, lokasyon: hareket.lokasyon, durum: yeniDurum }
              : u
          )
        );

        // Supabase'de ürün miktarını ve lokasyonunu güncelle
        // Constraint hatası olmaması için minimum 1 yapıyoruz
        const dbMiktar = Math.max(1, finalMiktar);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            quantity: dbMiktar,
            status: yeniDurum,
            location_id: hareket.lokasyon
          })
          .eq('id', urun.id);

        if (updateError) {
          console.error('Ürün güncelleme hatası:', updateError);
          throw new Error(`Ürün güncelleme hatası: ${updateError.message}`);
        }
      }

      // Ürün ve hareket listelerini tazele
      await Promise.all([loadProducts(), loadMovements()]);
    } catch (error) {
      console.error('Hareket ekleme hatası:', error);
      throw error;
    }
  };

  const removeHareket = async (id: string) => {
    try {
      const hareket = hareketler.find(h => h.id === id);
      if (!hareket) throw new Error('Hareket bulunamadı');

      // Supabase'den hareketi sil
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Hareketler listesinden kaldır
      setHareketler(prev => prev.filter(h => h.id !== id));

      // Ürün miktarını güncelle
      const urun = urunler.find(u => String(u.id) === String(hareket.urunId));
      if (urun) {
        // Hareketin etkisini geri al
        const etki = hareket.tip === 'Giriş' ? -hareket.miktar : hareket.miktar;
        const yeniMiktar = urun.miktar + etki;

        // Ürünü güncelle
        setUrunler(prevUrunler =>
          prevUrunler.map(u =>
            u.id === urun.id
              ? { ...u, miktar: yeniMiktar }
              : u
          )
        );

        // Supabase'de ürün miktarını güncelle
        await supabase
          .from('products')
          .update({ 
            quantity: yeniMiktar,
            status: yeniMiktar > 0 ? 'Depoda' : 'Tükenmiş'
          })
          .eq('id', urun.id);
      }

      // Ürün ve hareket listelerini tazele
      await Promise.all([loadProducts(), loadMovements()]);
    } catch (error) {
      console.error('Hareket silme hatası:', error);
      throw error;
    }
  };

  // Toplu silme işlemi için yeni fonksiyon
  const removeHareketler = async (ids: string[]) => {
    try {
      // Tüm hareketleri bul
      const silinecekHareketler = hareketler.filter(h => ids.includes(h.id));
      
      // Supabase'den hareketleri sil
      const { error } = await supabase
        .from('movements')
        .delete()
        .in('id', ids);

      if (error) throw error;

      // Hareketler listesinden kaldır
      setHareketler(prev => prev.filter(h => !ids.includes(h.id)));

      // Her ürün için miktar güncellemesi yap
      const urunGuncellemeleri = new Map<string, number>();

      // Her hareketin etkisini hesapla
      silinecekHareketler.forEach(hareket => {
        const urun = urunler.find(u => String(u.id) === String(hareket.urunId));
        if (urun) {
          const etki = hareket.tip === 'Giriş' ? -hareket.miktar : hareket.miktar;
          const mevcutEtki = urunGuncellemeleri.get(urun.id) || 0;
          urunGuncellemeleri.set(urun.id, mevcutEtki + etki);
        }
      });

      // Ürünleri güncelle
      for (const [urunId, etki] of urunGuncellemeleri) {
        const urun = urunler.find(u => String(u.id) === urunId);
        if (urun) {
          const yeniMiktar = urun.miktar + etki;

          // Ürünü güncelle
          setUrunler(prevUrunler =>
            prevUrunler.map(u =>
              u.id === urunId
                ? { ...u, miktar: yeniMiktar }
                : u
            )
          );

          // Supabase'de ürün miktarını güncelle
          await supabase
            .from('products')
            .update({ 
              quantity: yeniMiktar,
              status: yeniMiktar > 0 ? 'Depoda' : 'Tükenmiş'
            })
            .eq('id', urunId);
        }
      }

      // Ürün ve hareket listelerini tazele
      await Promise.all([loadProducts(), loadMovements()]);
    } catch (error) {
      console.error('Toplu hareket silme hatası:', error);
      throw error;
    }
  };

  const addKategori = async (kategori: Kategori) => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: kategori.name
        }])
        ;

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Category addition error:', error);
      throw error;
    }
  };

  const removeKategori = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Category deletion error:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({
    urunler,
    hareketler,
    kategoriler,
    loading,
    error,
    addUrun,
    updateUrun,
    removeUrun,
    addHareket,
    updateHareket,
    removeHareket,
    removeHareketler,
    addKategori,
    removeKategori,
    isAdmin,
    loadProducts
  }), [urunler, hareketler, kategoriler, loading, error, addUrun, updateUrun, removeUrun, addHareket, updateHareket, removeHareket, removeHareketler, addKategori, removeKategori, isAdmin, loadProducts]);

  return (
    <EnvanterContext.Provider value={value}>
      {children}
    </EnvanterContext.Provider>
  );
};

export const useEnvanter = () => {
  const context = useContext(EnvanterContext);
  if (context === undefined) {
    throw new Error('useEnvanter hook must be used within an EnvanterProvider');
  }
  return context;
};