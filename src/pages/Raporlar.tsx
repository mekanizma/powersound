import React, { useEffect, useState } from 'react';
import { BarChart3, Package, Warehouse, RefreshCw, Download, Filter, Calendar, Clock } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel } from '../utils/excelUtils';

const Raporlar = () => {
  const { urunler, hareketler } = useEnvanter();
  const { user } = useAuth();
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [users, setUsers] = useState<{id: string, username: string}[]>([]);
  const desiredLocationsOrder = [
    'Depo',
    'Limak Deluxe',
    'Kaya Artemis',
    'Kaya Palazzo',
    'Les Ambassadeurs',
    'Lords Palace',
    'Dış Kiralama'
  ];
  
  // Filtreleme state'leri
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMovementType, setSelectedMovementType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data: locationsData, error } = await supabase
        .from('locations')
        .select('id, name');
      if (error) return;
      setLocations(locationsData || []);
    };
    const fetchUsers = async () => {
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('id, username');
      if (!usersError && usersData) setUsers(usersData);
    };
    fetchLocations();
    fetchUsers();
  }, [urunler, hareketler]);

  // Lokasyon id'den isim bul
  const getLocationName = (id: string) => {
    const loc = locations.find(l => l.id === id);
    return loc ? loc.name : id;
  };

  // Ürün id'den isim bul
  const getProductName = (id: string) => {
    const urun = urunler.find(u => String(u.id) === String(id));
    return urun ? urun.ad : id;
  };

  const getUserName = (userId: string) => {
    const u = users.find(u => String(u.id) === String(userId));
    return u ? u.username : 'Unknown';
  };

  // Tarih formatını dönüştürme fonksiyonu
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    
    // ISO formatı (2025-06-18T13:35:31.51+00:00 veya 2025-06-18T13:35:31.51Z)
    if (dateStr.includes('T')) {
      return new Date(dateStr);
    }
    
    // Türkçe tarih formatı (DD.MM.YYYY)
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    
    // YYYY-MM-DD formatı
    if (dateStr.includes('-') && !dateStr.includes('T')) {
      return new Date(dateStr);
    }
    
    // Diğer durumlar için Date constructor'ı kullan
    return new Date(dateStr);
  };

  // Tarihi Türkçe formatına çevirme fonksiyonu (DD.MM.YYYY HH:MM)
  const formatDate = (dateStr: string) => {
    try {
      const date = parseDate(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hour}:${minute}`;
    } catch (error) {
      console.error('Tarih formatı hatası:', error, 'Orijinal:', dateStr);
      return dateStr; // Hata durumunda orijinal string'i döndür
    }
  };

  // Filtrelenmiş hareketleri hesapla
  const getFilteredMovements = () => {
    let filtered = [...hareketler];

    // Tarih filtresi
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(h => {
        const movementDate = parseDate(h.tarih);
        return movementDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Günün sonuna kadar
      filtered = filtered.filter(h => {
        const movementDate = parseDate(h.tarih);
        return movementDate <= end;
      });
    }

    // Hareket tipi filtresi
    if (selectedMovementType) {
      filtered = filtered.filter(h => h.tip === selectedMovementType);
    }

    // Lokasyon filtresi
    if (selectedLocation) {
      filtered = filtered.filter(h => h.lokasyon === selectedLocation);
    }

    return filtered;
  };

  // Excel'e aktarma fonksiyonları
  const exportMovementsToExcel = () => {
    const filteredMovements = getFilteredMovements();
    const excelData = filteredMovements.map(h => ({
      'Tarih': formatDate(h.tarih),
      'Ürün': getProductName(h.urunId),
      'Tip': h.tip,
      'Miktar': h.miktar,
      'Lokasyon': getLocationName(h.lokasyon),
      'Açıklama': h.aciklama,
      'İşlemi Yapan': getUserName(h.kullanici)
    }));
    
    const fileName = `Hareket_Raporu_${startDate || 'baslangic'}_${endDate || 'bitis'}`;
    exportToExcel(excelData, fileName);
  };

  const exportProductsToExcel = () => {
    const excelData = urunler.map(u => ({
      'Ürün Adı': u.ad,
      'Marka': u.marka || '',
      'Model': u.model || '',
      'Durum': u.durum,
      'Lokasyon': getLocationName(u.location_id || ''),
      'Miktar': u.miktar,
      'Seri No': u.seriNo || '',
      'Barkod': u.barkod,
      'Ekleme Tarihi': formatDate(u.eklemeTarihi)
    }));
    
    exportToExcel(excelData, 'Urun_Raporu');
  };

  const exportSummaryToExcel = () => {
    const summaryData = orderedLocations.map(loc => ({
      'Lokasyon': loc.name,
      'Ürün Sayısı': getCountForLocation(loc.name, loc.id)
    }));
    summaryData.push({ 'Lokasyon': 'TOPLAM', 'Ürün Sayısı': toplamUrun });
    exportToExcel(summaryData, 'Ozet_Raporu');
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMovementType('');
    setSelectedLocation('');
  };

  // Toplam ürün sayısı
  const toplamUrun = urunler.length;
  const getCountForLocation = (locName: string, locId: string) => {
    if ((locName || '').toLowerCase() === 'depo') {
      return urunler.filter(u => u.durum === 'Depoda').length;
    }
    return urunler.filter(u => u.location_id === locId).length;
  };
  const orderedLocations = desiredLocationsOrder
    .map(name => locations.find(l => (l.name || '').toLowerCase() === name.toLowerCase()) || { id: '', name })
    .filter(l => l.name);

  const filteredMovements = getFilteredMovements();

  return (
    <div className="max-w-5xl mx-auto py-8 px-2 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-indigo-500" /> Raporlar
        </h1>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filtrele
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={exportMovementsToExcel}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              <Download className="h-5 w-5 mr-2" />
              Hareketleri Excel'e Aktar
            </button>
            
            <button
              onClick={exportProductsToExcel}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Download className="h-5 w-5 mr-2" />
              Ürünleri Excel'e Aktar
            </button>
            
            <button
              onClick={exportSummaryToExcel}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              <Download className="h-5 w-5 mr-2" />
              Özet Raporu
            </button>
          </div>
        </div>
      </div>

      {/* Filtreleme Paneli */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Filtreleme Seçenekleri
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Filtreleri Temizle
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hareket Tipi
              </label>
              <select
                value={selectedMovementType}
                onChange={(e) => setSelectedMovementType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tüm Hareketler</option>
                <option value="Giriş">Giriş</option>
                <option value="Çıkış">Çıkış</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasyon
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tüm Lokasyonlar</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <Clock className="h-4 w-4 inline mr-1" />
              {filteredMovements.length} hareket filtrelendi
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {orderedLocations.map((loc) => (
          <div key={loc.name} className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <Warehouse className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-lg font-semibold text-gray-700">{loc.name}</div>
            <div className="text-3xl font-bold text-green-700 mt-1">{getCountForLocation(loc.name, loc.id)}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-indigo-400" /> 
            {showFilters ? 'Filtrelenmiş Hareketler' : 'Son 20 Hareket'}
          </h2>
          <div className="text-sm text-gray-600">
            {filteredMovements.length} hareket gösteriliyor
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ürün</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tip</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Miktar</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Lokasyon</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Açıklama</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">İşlemi Yapan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {(showFilters ? filteredMovements : hareketler.slice(-20)).reverse().map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{formatDate(h.tarih)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{getProductName(h.urunId)}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.tip === 'Giriş' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.tip}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{h.miktar}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{getLocationName(h.lokasyon)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">{h.aciklama}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{getUserName(h.kullanici)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Raporlar;