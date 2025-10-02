import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/app');
    } catch (err: any) {
      setError('Kullanıcı adı veya şifre hatalı');
    } finally {
      setIsLoading(false);
    }
  };

  // Buton aktiflik kontrolü
  const isButtonDisabled = !username.trim() || !password.trim() || isLoading;

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto mb-6">
            <img 
              src="/logo.png" 
              alt="Cyprus Power Sound Logo"
              className="h-56 mx-auto rounded-lg shadow-2xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h2 className="mt-2 text-3xl font-bold text-white">
            POWERSOUND DEPO TAKİP
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Ses, Işık ve Görüntü Sistemleri
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-900 py-8 px-4 shadow-2xl rounded-lg sm:px-10 border border-gray-800 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="group">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-2 transition-colors duration-300 group-focus-within:text-white"
                >
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all duration-300 transform focus:scale-105 focus:shadow-lg"
                    placeholder="Kullanıcı adınızı girin"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2 transition-colors duration-300 group-focus-within:text-white"
                >
                  Şifre
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all duration-300 transform focus:scale-105 focus:shadow-lg"
                    placeholder="Şifrenizi girin"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg transform transition-all duration-300 animate-pulse">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isButtonDisabled}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium transition-all duration-300 transform ${
                    isButtonDisabled 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed scale-95' 
                      : 'bg-white text-black hover:bg-gray-200 hover:scale-105 hover:shadow-lg active:scale-95'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      <span className="animate-pulse text-black">Giriş yapılıyor...</span>
                    </div>
                  ) : (
                    <span className="transition-all duration-300">Giriş Yap</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;