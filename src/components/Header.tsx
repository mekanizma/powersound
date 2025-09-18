import React, { useState } from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError(null);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      setError('Çıkış yapılırken bir hata oluştu');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-600 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 focus:outline-none"
              disabled={isLoggingOut}
            >
              <div className="flex items-center">
                <div className="text-sm text-gray-700 mr-2">
                  {user?.username || 'Kullanıcı'}
                </div>
                <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-medium">
                  {user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <div className="font-medium">{user?.username}</div>
                  <div className="text-xs text-gray-500">{user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`w-full px-4 py-2 text-sm text-left flex items-center ${
                    isLoggingOut 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOut ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;