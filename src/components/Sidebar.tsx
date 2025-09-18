import { NavLink } from 'react-router-dom';
import { Home, RefreshCw, BarChart3, Settings, SpeakerIcon, Lightbulb, Monitor, Warehouse } from 'lucide-react';

const Sidebar = () => {
  // Kişiselleştirme gerektiğinde Auth bağlanabilir

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white">
      <div className="px-6 py-8 border-b border-indigo-800/30 flex justify-center">
        <div className="w-[120px] h-[120px] rounded-full overflow-hidden shadow-lg border-2 border-white/20">
          <img 
            src="https://scontent.fecn1-1.fna.fbcdn.net/v/t39.30808-6/274330725_100270049277023_6144125149422236442_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=m0RrKWNEHzgQ7kNvwEkK4A7&_nc_oc=Adl709lykMze0Ehe8Esm9Pv7d6y9MgK9ZUjBqOvrJ1n6jI8yiMsmFG9of_GXCinHZYs&_nc_zt=23&_nc_ht=scontent.fecn1-1.fna&_nc_gid=kUZyhL-GiRPsb4j8-GBd6g&oh=00_AfZoqRpE9lumh3C0QWJ8cQbIzaCarRv2K3WD7GKDFogMhA&oe=68D21E6A" 
            alt="Cyprus Power Sound Logo"
            className="w-full h-full object-cover"
            style={{
              filter: 'brightness(1.3) contrast(1.4) saturate(1.2)',
              imageRendering: 'crisp-edges'
            } as React.CSSProperties}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NavLink
          to="/app"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <Home className="h-5 w-5 mr-3" />
          <span>Anasayfa</span>
        </NavLink>

        <NavLink
          to="/app/depo"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <Warehouse className="h-5 w-5 mr-3" />
          <span>Depo</span>
        </NavLink>

        <NavLink
          to="/app/hareketler"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <RefreshCw className="h-5 w-5 mr-3" />
          <span>Hareketler</span>
        </NavLink>

        <NavLink
          to="/app/raporlar"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <BarChart3 className="h-5 w-5 mr-3" />
          <span>Raporlar</span>
        </NavLink>

        <NavLink
          to="/app/ayarlar"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <Settings className="h-5 w-5 mr-3" />
          <span>Ayarlar</span>
        </NavLink>
      </nav>

      <div className="px-6 py-6 border-t border-indigo-800/30 bg-gradient-to-t from-indigo-900/50">
        <div className="flex items-center justify-around text-sm">
          <div className="flex items-center text-indigo-200 hover:text-white transition-colors duration-200 cursor-pointer group">
            <SpeakerIcon className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
            <span>Ses</span>
          </div>
          <div className="flex items-center text-indigo-200 hover:text-white transition-colors duration-200 cursor-pointer group">
            <Lightbulb className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
            <span>Işık</span>
          </div>
          <div className="flex items-center text-indigo-200 hover:text-white transition-colors duration-200 cursor-pointer group">
            <Monitor className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
            <span>Görüntü</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;