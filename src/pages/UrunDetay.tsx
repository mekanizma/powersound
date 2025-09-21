import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, Package, RefreshCw, Printer } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import BarkodGenerator from '../components/BarkodGenerator';

const UrunDetay = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { urunler, updateUrun, kategoriler, hareketler, loading } = useEnvanter();

  // Ürün verilerini bul
  const urun = urunler.find((u) => u.id === id);

  // Bu ürüne ait hareketler
  const urunHareketleri = hareketler.filter((h) => h.urunId === id);

  const [formData, setFormData] = useState({
    ad: '',
    marka: '',
    model: '',
    kategori: '',
    durum: 'Depoda',
    seriNo: '',
    aciklama: '',
    barkod: '',
  });

  // Sayfa yüklendiğinde ürün bilgilerini forma doldur
  useEffect(() => {
    if (urun) {
      setFormData({ ...urun });
    }
  }, [urun]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (id) {
      // Ürünü güncelle
      updateUrun(id, formData);

      // Ürün listesine dön
      navigate('/urunler');
    }
  };

  // Durum seçenekleri
  const durumlar = ['Depoda', 'Organizasyonda', 'Serviste', 'Kiralandı'];

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!urun) {
    return (
      <div className="p-4">
        <div className="mb-4 text-red-600 font-medium">Ürün bulunamadı.</div>
        <button onClick={() => navigate('/depo')} className="text-indigo-600 hover:text-indigo-800 underline">
          Depo'ya dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Ürün Detayı</h1>
        <button
          onClick={() => navigate('/urunler')}
          className="text-gray-600 hover:text-gray-900"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Panel: Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sol Sütun */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="ad"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="marka"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="model"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="kategori"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
              </div>

              {/* Sağ Sütun */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="durum"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Durum
                  </label>
                  <select
                    id="durum"
                    name="durum"
                    value={formData.durum}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {durumlar.map((durum) => (
                      <option key={durum} value={durum}>
                        {durum}
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <label
                    htmlFor="seriNo"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="aciklama"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Açıklama
                  </label>
                  <textarea
                    id="aciklama"
                    name="aciklama"
                    rows={3}
                    value={formData.aciklama}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="mt-6 border-t border-gray-200 pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/urunler')}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Save className="h-5 w-5 mr-2" />
                Kaydet
              </button>
            </div>
          </form>
        </div>

        {/* Sağ Panel: Barkod ve Geçmiş */}
        <div className="space-y-6">
          {/* Barkod Kartı */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Barkod Bilgisi
            </h2>
            <div className="mb-4">
              <BarkodGenerator 
                barkod={formData.barkod} 
                urunAdi={formData.ad}
                model={formData.model}
                onPrint={() => {
                  // Barkod yazdırma işlemi BarkodGenerator bileşeni tarafından yönetiliyor
                }}
              />
            </div>
          </div>

          {/* Ürün Hareketleri */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Ürün Hareketleri
            </h2>

            {urunHareketleri.length > 0 ? (
              <div className="space-y-3">
                {urunHareketleri.map((hareket) => (
                  <div
                    key={hareket.id}
                    className="flex items-center p-3 border-b border-gray-100"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        hareket.tip === 'Giriş'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      <RefreshCw className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {hareket.tip === 'Giriş'
                          ? 'Giriş Yapıldı'
                          : 'Çıkış Yapıldı'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {hareket.tarih} - {hareket.kullanici}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      {hareket.miktar} adet
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Hareket kaydı bulunmamaktadır.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrunDetay;
