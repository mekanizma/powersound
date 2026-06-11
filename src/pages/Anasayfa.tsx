import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, BarChart3, ArrowRight, Clock, MapPin, PenTool as Tool, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEnvanter } from '../contexts/EnvanterContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { countMovementsForLocation } from '../utils/movementLocationUtils';

const Anasayfa = () => {
  const { urunler, hareketler } = useEnvanter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isLoaded, setIsLoaded] = useState(false);

  // Raporlar kartları için eklenen state'ler
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [users, setUsers] = useState<{id: string, username: string}[]>([]);
  const desiredLocationsOrder = [
    'Depo',
    'Kaya Artemis',
    'Kaya Palazzo',
    'Les Ambassadeurs',
    'Lords Palace',
    'Dış Kiralama',
    'Servis'
  ];

  useEffect(() => {
    setIsLoaded(true);
    const fetchLocations = async () => {
      const { data: locationsData, error } = await supabase
        .from('locations')
        .select('id, name');
      if (error) return;
      setLocations(locationsData || []);
    };

    const fetchUsers = async () => {
      const { data: usersData, error } = await supabase
        .from('auth_users')
        .select('id, username');
      if (error) return;
      setUsers(usersData || []);
    };

    fetchLocations();
    fetchUsers();
  }, [urunler, hareketler]);

  const toplamUrun = urunler.length;
  const getCountForLocation = (locName: string, locId: string) => {
    const resolvedId =
      locId ||
      (locations.find(
        (loc) => (loc.name || '').toLowerCase() === (locName || '').toLowerCase()
      )?.id ?? '');
    if (!resolvedId) return 0;
    const location = locations.find(loc => String(loc.id) === String(resolvedId)) || {
      id: resolvedId,
      name: locName
    };
    return countMovementsForLocation(hareketler, urunler, location);
  };
  const orderedLocations = desiredLocationsOrder
    .map(name => locations.find(l => (l.name || '').toLowerCase() === name.toLowerCase()) || { id: '', name })
    .filter(l => l.name);

  // Son hareketler
  const sonHareketler = hareketler.slice(0, 5);

  // Hareketten ürün adı bulucu
  const getProductName = (id: string) => {
    const urun = urunler.find(u => String(u.id) === String(id));
    return urun ? urun.ad : id;
  };

  // Kullanıcı adı bulucu
  const getUserName = (userId: string) => {
    const user = users.find(u => String(u.id) === String(userId));
    return user ? user.username : 'Bilinmeyen Kullanıcı';
  };

  // Tarih formatlayıcı
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hour}:${minute}`;
  };

  return (
    <div className={`space-y-8 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hoş Geldiniz Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-2xl text-white p-8 shadow-lg">
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-black mb-4 tracking-wider animate-pulse">
            DEPO TAKİP SİSTEMİ
          </h1>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
          <div className="absolute inset-0 bg-gradient-to-l from-white via-white to-transparent transform rotate-12 translate-x-1/2"></div>
        </div>
      </div>

      {/* Raporlar kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {orderedLocations.map((loc) => (
          loc.id ? (
            <Link key={loc.id} to={`/app/hareketler?lokasyon=${loc.id}`} className="bg-white rounded-2xl shadow p-6 flex flex-col items-center hover:shadow-md transition-all">
              <Warehouse className="h-8 w-8 text-green-500 mb-2" />
              <div className="text-lg font-semibold text-gray-700">
                {(loc.name || '').trim().toLowerCase() === 'depo' ? 'Depo Hareketler' : loc.name}
              </div>
              <div className="text-3xl font-bold text-green-700 mt-1">{getCountForLocation(loc.name, loc.id)}</div>
              <div className="text-xs text-gray-500 mt-1">Hareket Sayısı</div>
            </Link>
          ) : (
            <div key={loc.name} className="bg-white rounded-2xl shadow p-6 flex flex-col items-center opacity-70">
              <Warehouse className="h-8 w-8 text-green-500 mb-2" />
              <div className="text-lg font-semibold text-gray-700">{loc.name}</div>
              <div className="text-3xl font-bold text-green-700 mt-1">{getCountForLocation(loc.name, loc.id)}</div>
              <div className="text-xs text-gray-500 mt-1">Mevcut Stok</div>
            </div>
          )
        ))}
      </div>

      {/* İstatistik Kartları */}
      {/* İstatistik kartları kaldırıldı */}

      {/* Son Hareketler ve Hızlı Erişim */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Hareketler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-indigo-600" />
            Son Hareketler
          </h2>
          {sonHareketler.length > 0 ? (
            <div className="space-y-3">
              {sonHareketler.map((hareket, index) => (
                <div
                  key={hareket.id}
                  className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors transform hover:scale-[1.01] duration-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      hareket.tip === 'Giriş'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {hareket.urunAdi || getProductName(hareket.urunId) || 'Bilinmeyen Ürün'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hareket.tip} - {formatDateTime(hareket.tarih)} - {getUserName(hareket.kullanici)}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200">
                    {hareket.miktar} adet
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Henüz hareket kaydı bulunmamaktadır.</p>
            </div>
          )}
          <div className="mt-6 text-right">
            <Link
              to="/app/hareketler"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium group"
            >
              Tüm hareketleri görüntüle
              <ArrowRight className="h-4 w-4 ml-1 transform transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-indigo-600" />
            Hızlı Erişim
          </h2>
          <div className="grid gap-3">
            {[
              {
                title: 'Malzeme Listesi',
                description: 'Tüm malzemeleri görüntüle ve yönet',
                icon: <Package className="h-5 w-5 text-blue-600" />,
                link: '/app/depo',
                bgColor: 'bg-blue-100'
              },
              {
                title: 'Hareket Kayıtları',
                description: 'Giriş ve çıkışları takip et',
                icon: <RefreshCw className="h-5 w-5 text-green-600" />,
                link: '/app/hareketler',
                bgColor: 'bg-green-100'
              },
              {
                title: 'Raporlar',
                description: 'Detaylı analiz ve raporlar',
                icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
                link: '/app/raporlar',
                bgColor: 'bg-purple-100'
              }
            ].map((item, index) => (
              <Link
                key={item.title}
                to={item.link}
                className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02] group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-10 h-10 ${item.bgColor} rounded-full flex items-center justify-center mr-4`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transform transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.5s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Anasayfa;