import { createContext, useContext, useState, useEffect, FC, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (username: string, password: string) => {
    try {
      if (!username.trim() || !password.trim()) {
        throw new Error('Kullanıcı adı ve şifre boş olamaz');
      }

      console.log('Giriş denemesi:', { username });

      // Kullanıcıyı bul
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('id, username, role, password_hash')
        .eq('username', username)
        .maybeSingle();

      if (userError) {
        console.error('Kullanıcı arama hatası:', userError);
        throw new Error('Kullanıcı bilgileri alınırken bir hata oluştu');
      }

      if (!userData) {
        console.log('Kullanıcı bulunamadı:', username);
        throw new Error('Kullanıcı bulunamadı');
      }

      console.log('Kullanıcı bulundu:', { 
        id: userData.id, 
        username: userData.username, 
        role: userData.role 
      });

      // Şifreyi doğrula (bcrypt ile)
      const isValid = await bcrypt.compare(password, userData.password_hash);
      
      console.log('Şifre doğrulama sonucu:', { isValid });

      if (!isValid) {
        throw new Error('Kullanıcı adı veya şifre hatalı');
      }

      // Kullanıcı bilgilerini kaydet
      const user = {
        id: userData.id,
        username: userData.username,
        role: userData.role as 'admin' | 'user'
      };

      console.log('Giriş başarılı:', user);

      setUser(user);
      localStorage.setItem('auth_user', JSON.stringify(user));
    } catch (error) {
      console.error('Login hatası:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Giriş yapılırken bir hata oluştu');
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('auth_user');
      setUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      throw new Error('Çıkış yapılırken bir hata oluştu');
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          const { data, error } = await supabase
            .from('auth_users')
            .select('id, username, role')
            .eq('id', parsedUser.id)
            .single();

          if (error || !data) {
            localStorage.removeItem('auth_user');
            setUser(null);
          } else {
            setUser(data);
          }
        }
      } catch (error) {
        localStorage.removeItem('auth_user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};