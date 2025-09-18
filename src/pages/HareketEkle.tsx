import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const HareketEkle = () => {
  const navigate = useNavigate();
  const { urunler, addHareket } = useEnvanter();
  const { user } = useAuth();
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  
  const [formData, setFormData] = useState({
    urunId: '',
    tip: 'Giriş',
    miktar: 1,
    aciklama: '',
    lokasyon: '',
  });

  // Lokasyonları yükle
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Lokasyon yükleme hatası:', error);
      } else {
        setLocations(data || []);
      }
    };

    fetchLocations();
  }, []);
  
  // Seçili ürün bilgisi
  const selectedUrun = urunler.find(u => u.id === formData.urunId);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'miktar' ? parseInt(value) || 0 : value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı!');
      }

      // Yeni hareket oluştur
      const yeniHareket = {
        ...formData,
        id: Date.now().toString(),
        tarih: new Date().toLocaleDateString('tr-TR'),
        urunAdi: selectedUrun?.ad || '',
        kullanici: user.id,
      };
      
      // Hareketi ekle
      await addHareket(yeniHareket);
      
      // Hareket listesine dön
      navigate('/app/hareketler');
    } catch (error) {
      console.error('Hareket ekleme hatası:', error);
      alert(error instanceof Error ? error.message : 'Hareket eklenirken bir hata oluştu.');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Yeni Hareket Ekle</h1>
        <button
          onClick={() => navigate('/app/hareketler')}
          className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          <X className="h-5 w-5 mr-2" />
          İptal
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="urunId" className="block text-sm font-medium text-gray-700 mb-1">
              Ürün*
            </label>
            <select
              id="urunId"
              name="urunId"
              required
              value={formData.urunId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Ürün Seçin</option>
              {urunler.map((urun) => (
                <option key={urun.id} value={urun.id}>
                  {urun.ad}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tip" className="block text-sm font-medium text-gray-700 mb-1">
                Hareket Tipi*
              </label>
              <select
                id="tip"
                name="tip"
                required
                value={formData.tip}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Giriş">Giriş</option>
                <option value="Çıkış">Çıkış</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="miktar" className="block text-sm font-medium text-gray-700 mb-1">
                Miktar*
              </label>
              <input
                type="number"
                id="miktar"
                name="miktar"
                required
                min="1"
                value={formData.miktar}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="lokasyon" className="block text-sm font-medium text-gray-700 mb-1">
              Lokasyon*
            </label>
            <select
              id="lokasyon"
              name="lokasyon"
              required
              value={formData.lokasyon}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Lokasyon Seçin</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="aciklama" className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              id="aciklama"
              name="aciklama"
              value={formData.aciklama}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <Save className="h-5 w-5 mr-2" />
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};

export default HareketEkle;