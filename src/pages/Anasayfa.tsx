import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, BarChart3, ArrowRight, Warehouse, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEnvanter } from '../contexts/EnvanterContext';
import { supabase } from '../lib/supabase';
import { countMovementsForLocation } from '../utils/movementLocationUtils';

const locationThemes: Record<string, { gradient: string; glow: string; icon: string; ring: string }> = {
  depo: { gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/25', icon: 'text-emerald-500', ring: 'group-hover:ring-emerald-400/40' },
  'kaya artemis': { gradient: 'from-blue-500 to-cyan-600', glow: 'shadow-blue-500/25', icon: 'text-blue-500', ring: 'group-hover:ring-blue-400/40' },
  'kaya palazzo': { gradient: 'from-indigo-500 to-violet-600', glow: 'shadow-indigo-500/25', icon: 'text-indigo-500', ring: 'group-hover:ring-indigo-400/40' },
  'les ambassadeurs': { gradient: 'from-purple-500 to-fuchsia-600', glow: 'shadow-purple-500/25', icon: 'text-purple-500', ring: 'group-hover:ring-purple-400/40' },
  'lords palace': { gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/25', icon: 'text-amber-500', ring: 'group-hover:ring-amber-400/40' },
  'dış kiralama': { gradient: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/25', icon: 'text-rose-500', ring: 'group-hover:ring-rose-400/40' },
  servis: { gradient: 'from-slate-500 to-sky-600', glow: 'shadow-sky-500/25', icon: 'text-sky-500', ring: 'group-hover:ring-sky-400/40' },
};

const getLocationTheme = (name: string) => {
  const key = (name || '').trim().toLowerCase();
  return locationThemes[key] ?? locationThemes.depo;
};

const Anasayfa = () => {
  const { urunler, hareketler } = useEnvanter();
  const [isLoaded, setIsLoaded] = useState(false);

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

  const sonHareketler = hareketler.slice(0, 5);

  const getProductName = (id: string) => {
    const urun = urunler.find(u => String(u.id) === String(id));
    return urun ? urun.ad : id;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => String(u.id) === String(userId));
    return user ? user.username : 'Bilinmeyen Kullanıcı';
  };

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
    <div className={`anasayfa-root relative min-h-full transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Arka plan dekorasyonu */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl anasayfa-orb-1" />
        <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl anasayfa-orb-2" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-blue-400/8 blur-3xl anasayfa-orb-3" />
      </div>

      <div className="space-y-8 pb-4">
        {/* Hero Banner */}
        <div className="anasayfa-hero relative overflow-hidden rounded-3xl p-8 md:p-10 shadow-2xl shadow-indigo-900/20">
          <div className="anasayfa-hero-mesh absolute inset-0" />
          <div className="anasayfa-hero-grid absolute inset-0 opacity-[0.07]" />

          <div className="absolute top-6 right-6 hidden md:block">
            <Sparkles className="h-6 w-6 text-white/40 anasayfa-sparkle" />
          </div>
          <div className="absolute bottom-8 left-8 h-20 w-20 rounded-full border border-white/10 anasayfa-ring" />
          <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/80 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Canlı Sistem
              </div>

              <h1 className="anasayfa-title text-4xl font-black tracking-wider text-white sm:text-5xl md:text-6xl">
                DEPO TAKİP SİSTEMİ
              </h1>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/60">Toplam Ürün</p>
                    <p className="text-2xl font-bold text-white">{toplamUrun}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <Warehouse className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/60">Lokasyon</p>
                    <p className="text-2xl font-bold text-white">{orderedLocations.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lokasyon kartları */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Lokasyon Özeti</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {orderedLocations.map((loc, index) => {
              const theme = getLocationTheme(loc.name);
              const displayName = (loc.name || '').trim().toLowerCase() === 'depo' ? 'Depo Hareketler' : loc.name;
              const count = getCountForLocation(loc.name, loc.id);
              const label = loc.id ? 'Hareket Sayısı' : 'Mevcut Stok';

              const cardInner = (
                <>
                  <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${theme.gradient} opacity-[0.08] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.15]`} />
                  <div className={`relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} shadow-lg ${theme.glow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Warehouse className="h-7 w-7 text-white" />
                  </div>
                  <div className="relative text-center">
                    <div className="text-base font-semibold text-gray-800 transition-colors group-hover:text-gray-900">{displayName}</div>
                    <div className={`mt-2 bg-gradient-to-r ${theme.gradient} bg-clip-text text-4xl font-black text-transparent`}>
                      {count}
                    </div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">{label}</div>
                  </div>
                  {loc.id && (
                    <div className="absolute bottom-4 right-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <ArrowRight className={`h-4 w-4 ${theme.icon}`} />
                    </div>
                  )}
                </>
              );

              const cardClass = `group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-gray-200/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-2 ${theme.ring} anasayfa-card-enter ${!loc.id ? 'opacity-70' : ''}`;

              return loc.id ? (
                <Link
                  key={loc.id}
                  to={`/app/hareketler?lokasyon=${loc.id}`}
                  className={cardClass}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {cardInner}
                </Link>
              ) : (
                <div
                  key={loc.name}
                  className={cardClass}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {cardInner}
                </div>
              );
            })}
          </div>
        </div>

        {/* Son Hareketler ve Hızlı Erişim */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Son Hareketler */}
          <div className="anasayfa-panel group rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-gray-200/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl anasayfa-card-enter" style={{ animationDelay: '200ms' }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30">
                  <RefreshCw className="h-4 w-4 text-white" />
                </span>
                Son Hareketler
              </h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                {sonHareketler.length} kayıt
              </span>
            </div>

            {sonHareketler.length > 0 ? (
              <div className="relative space-y-2">
                <div className="absolute bottom-2 left-[19px] top-2 w-px bg-gradient-to-b from-indigo-200 via-purple-200 to-transparent" />
                {sonHareketler.map((hareket, index) => (
                  <div
                    key={hareket.id}
                    className="group/item relative flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all duration-300 hover:border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-sm anasayfa-card-enter"
                    style={{ animationDelay: `${300 + index * 80}ms` }}
                  >
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover/item:scale-110 ${
                          hareket.tip === 'Giriş'
                            ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-emerald-500/30'
                            : 'bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-rose-500/30'
                        }`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {hareket.urunAdi || getProductName(hareket.urunId) || 'Bilinmeyen Ürün'}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        <span className={`inline-flex rounded-md px-1.5 py-0.5 font-semibold ${
                          hareket.tip === 'Giriş' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {hareket.tip}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span>{formatDateTime(hareket.tarih)}</span>
                        <span className="text-gray-300">·</span>
                        <span>{getUserName(hareket.kullanici)}</span>
                      </p>
                    </div>
                    <div className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                      hareket.tip === 'Giriş'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                    }`}>
                      {hareket.miktar} adet
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-10 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <RefreshCw className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Henüz hareket kaydı bulunmamaktadır.</p>
              </div>
            )}

            <div className="mt-5 border-t border-gray-100 pt-4 text-right">
              <Link
                to="/app/hareketler"
                className="group/link inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-sm font-semibold text-transparent transition-all hover:gap-2"
              >
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">Tüm hareketleri görüntüle</span>
                <ArrowRight className="h-4 w-4 text-indigo-600 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Hızlı Erişim */}
          <div className="anasayfa-panel rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-gray-200/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl anasayfa-card-enter" style={{ animationDelay: '280ms' }}>
            <div className="mb-5 flex items-center gap-2 text-xl font-bold text-gray-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md shadow-blue-500/30">
                <Package className="h-4 w-4 text-white" />
              </span>
              Hızlı Erişim
            </div>

            <div className="grid gap-3">
              {[
                {
                  title: 'Malzeme Listesi',
                  description: 'Tüm malzemeleri görüntüle ve yönet',
                  icon: <Package className="h-5 w-5 text-white" />,
                  link: '/app/depo',
                  gradient: 'from-blue-500 to-cyan-600',
                  hoverBg: 'hover:from-blue-50 hover:to-cyan-50',
                  shadow: 'shadow-blue-500/20',
                  arrowHover: 'group-hover/quick:bg-gradient-to-br group-hover/quick:from-blue-500 group-hover/quick:to-cyan-600',
                },
                {
                  title: 'Hareket Kayıtları',
                  description: 'Giriş ve çıkışları takip et',
                  icon: <RefreshCw className="h-5 w-5 text-white" />,
                  link: '/app/hareketler',
                  gradient: 'from-emerald-500 to-teal-600',
                  hoverBg: 'hover:from-emerald-50 hover:to-teal-50',
                  shadow: 'shadow-emerald-500/20',
                  arrowHover: 'group-hover/quick:bg-gradient-to-br group-hover/quick:from-emerald-500 group-hover/quick:to-teal-600',
                },
                {
                  title: 'Raporlar',
                  description: 'Detaylı analiz ve raporlar',
                  icon: <BarChart3 className="h-5 w-5 text-white" />,
                  link: '/app/raporlar',
                  gradient: 'from-purple-500 to-fuchsia-600',
                  hoverBg: 'hover:from-purple-50 hover:to-fuchsia-50',
                  shadow: 'shadow-purple-500/20',
                  arrowHover: 'group-hover/quick:bg-gradient-to-br group-hover/quick:from-purple-500 group-hover/quick:to-fuchsia-600',
                }
              ].map((item, index) => (
                <Link
                  key={item.title}
                  to={item.link}
                  className={`anasayfa-quick-link group/quick relative flex items-center overflow-hidden rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg ${item.hoverBg} anasayfa-card-enter`}
                  style={{ animationDelay: `${360 + index * 80}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 transition-opacity duration-300 group-hover/quick:opacity-[0.04]`} />
                  <div className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-md ${item.shadow} transition-transform duration-300 group-hover/quick:scale-110`}>
                    {item.icon}
                  </div>
                  <div className="relative ml-4 min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <div className={`relative ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 transition-all duration-300 group-hover/quick:shadow-md ${item.arrowHover}`}>
                    <ArrowRight className="h-4 w-4 text-gray-400 transition-all group-hover/quick:translate-x-0.5 group-hover/quick:text-white" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .anasayfa-hero {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #3730a3 50%, #4c1d95 75%, #1e3a8a 100%);
          background-size: 300% 300%;
          animation: anasayfa-gradient-shift 12s ease infinite;
        }

        .anasayfa-hero-mesh {
          background:
            radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(168, 85, 247, 0.35) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%);
          animation: anasayfa-mesh-pulse 8s ease-in-out infinite alternate;
        }

        .anasayfa-hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .anasayfa-title {
          text-shadow: 0 0 40px rgba(255,255,255,0.3), 0 2px 20px rgba(0,0,0,0.3);
          background: linear-gradient(to right, #ffffff, #e0e7ff, #ffffff, #c7d2fe, #ffffff);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: anasayfa-shimmer 4s linear infinite;
        }

        .anasayfa-orb-1 { animation: anasayfa-float 20s ease-in-out infinite; }
        .anasayfa-orb-2 { animation: anasayfa-float 25s ease-in-out infinite reverse; }
        .anasayfa-orb-3 { animation: anasayfa-float 18s ease-in-out infinite 2s; }

        .anasayfa-ring { animation: anasayfa-ring-pulse 4s ease-in-out infinite; }
        .anasayfa-sparkle { animation: anasayfa-sparkle-spin 6s linear infinite; }

        .anasayfa-card-enter {
          opacity: 0;
          animation: anasayfa-fade-up 0.6s ease-out forwards;
        }

        .anasayfa-quick-link::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          transition: left 0.5s ease;
        }

        .anasayfa-quick-link:hover::after {
          left: 150%;
        }

        @keyframes anasayfa-gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes anasayfa-mesh-pulse {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes anasayfa-shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        @keyframes anasayfa-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }

        @keyframes anasayfa-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }

        @keyframes anasayfa-sparkle-spin {
          0% { transform: rotate(0deg) scale(1); opacity: 0.4; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 0.8; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.4; }
        }

        @keyframes anasayfa-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Anasayfa;
