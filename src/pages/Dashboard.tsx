import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Users, Settings, BarChart2, ArrowRight, Warehouse, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEnvanter } from '../contexts/EnvanterContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { urunler } = useEnvanter();
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const desiredLocationsOrder = [
    'Depo',
    'Kaya Artemis',
    'Kaya Palazzo',
    'Les Ambassadeurs',
    'Lords Palace',
    'Dış Kiralama'
  ];

  useEffect(() => {
    const fetchLocations = async () => {
      const { data: locationsData, error } = await supabase
        .from('locations')
        .select('id, name');
      if (error) return;
      setLocations(locationsData || []);
    };
    fetchLocations();
  }, []);

  // Toplam ürün miktarı
  const toplamUrun = urunler.reduce((sum, u) => sum + (u.miktar || 0), 0);
  const getCountForLocation = (locName: string, locId: string) => {
    if ((locName || '').toLowerCase() === 'depo') {
      // Depo için ürün adedi (Depo sayfasıyla tutarlı)
      return urunler.filter(u => {
        const status = String(u.durum || '').trim().toLowerCase();
        return status === 'depoda' || status.includes('depo');
      }).length;
    }
    return urunler
      .filter(u => u.location_id === locId)
      .reduce((sum, u) => sum + (u.miktar || 0), 0);
  };
  const orderedLocations = desiredLocationsOrder
    .map(name => locations.find(l => (l.name || '').toLowerCase() === name.toLowerCase()) || { id: '', name })
    .filter(l => l.name);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gösterge Paneli</h1>
        <button
          onClick={() => navigate('/urun-ekle')}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni Ürün Ekle
        </button>
      </div>

      <div className="max-w-5xl mx-auto py-8 px-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <Package className="h-8 w-8 text-indigo-500 mb-2" />
            <div className="text-lg font-semibold text-gray-700">Toplam Ürün</div>
            <div className="text-3xl font-bold text-indigo-700 mt-1">{toplamUrun}</div>
          </div>
          {orderedLocations.map((loc) => (
            <div key={loc.name} className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
              <Warehouse className="h-8 w-8 text-green-500 mb-2" />
              <div className="text-lg font-semibold text-gray-700">{loc.name}</div>
              <div className="text-3xl font-bold text-green-700 mt-1">{getCountForLocation(loc.name, loc.id)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Hızlı Erişim</h2>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/depo')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-600 mr-3" />
                <span className="text-gray-700">Depo Yönetimi</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={() => navigate('/hareketler')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 text-gray-600 mr-3" />
                <span className="text-gray-700">Hareketler</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Son Hareketler</h2>
          <div className="space-y-4">
            {/* Son hareketler buraya eklenecek */}
            <p className="text-gray-500 text-sm">Henüz hareket bulunmuyor.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 