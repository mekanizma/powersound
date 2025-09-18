import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import { supabase } from '../lib/supabase';
import { generateBarkod, checkExistingBarkod } from '../utils/barkodUtils';

const UrunEkle = () => {
  const navigate = useNavigate();
  const { kategoriler, loadProducts } = useEnvanter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    ad: '',
    marka: '',
    model: '',
    kategori: '',
    durum: 'Depoda',
    seriNo: '',
    aciklama: '',
    miktar: 1,
    fotograf_url: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'miktar' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Zorunlu alanları kontrol et
      if (!formData.ad) {
        throw new Error('Ürün adı zorunludur');
      }
      if (!formData.kategori) {
        throw new Error('Kategori seçimi zorunludur');
      }

      for (let i = 0; i < formData.miktar; i++) {
        const barcode = generateBarkod();
        
        // Barkodun benzersiz olduğunu kontrol et
        const isBarcodeExists = await checkExistingBarkod(barcode);
        if (isBarcodeExists) {
          throw new Error('Barkod zaten kullanımda. Lütfen tekrar deneyin.');
        }

        const { error: insertError } = await supabase.from('products').insert([{
          name: formData.ad,
          brand: formData.marka || null,
          model: formData.model || null,
          category_id: formData.kategori,
          serial_number: formData.seriNo ? `${formData.seriNo}-${i + 1}` : null,
          description: formData.aciklama || null,
          status: 'Depoda',
          location_id: null,
          quantity: 1,
          barcode: barcode
        }]);

        if (insertError) {
          console.error('Ürün ekleme hatası:', insertError);
          throw new Error(`Ürün eklenirken bir hata oluştu: ${insertError.message}`);
        }
      }

      await loadProducts();
      navigate('/app/depo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ürün eklenirken bir hata oluştu.');
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Yeni Ürün Ekle</h1>
        <button
          onClick={() => navigate('/app/depo')}
          className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          <X className="h-5 w-5 mr-2" />
          İptal
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="ad" className="block text-sm font-medium text-gray-700 mb-1">
              Ürün Adı*
            </label>
            <input
              type="text"
              id="ad"
              name="ad"
              required
              value={formData.ad}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="marka" className="block text-sm font-medium text-gray-700 mb-1">
              Marka
            </label>
            <input
              type="text"
              id="marka"
              name="marka"
              value={formData.marka}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-1">
              Kategori*
            </label>
            <select
              id="kategori"
              name="kategori"
              required
              value={formData.kategori}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Kategori Seçin</option>
              {kategoriler.map((kategori) => (
                <option key={kategori.id} value={kategori.id}>
                  {kategori.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="seriNo" className="block text-sm font-medium text-gray-700 mb-1">
              Seri No
            </label>
            <input
              type="text"
              id="seriNo"
              name="seriNo"
              value={formData.seriNo}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
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

        <div className="mt-6">
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

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UrunEkle;