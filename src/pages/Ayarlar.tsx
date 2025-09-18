import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, User, PlusCircle, UserCircle, Shield, Trash2, AlertTriangle } from 'lucide-react';

const Ayarlar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Kullanıcı ekleme için state
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user', // Varsayılan rol
  });
  const [userAddLoading, setUserAddLoading] = useState(false);
  const [userAddError, setUserAddError] = useState<string | null>(null);
  const [userAddSuccess, setUserAddSuccess] = useState<string | null>(null);

  // Admin kullanıcı listesi için state
  const [userList, setUserList] = useState<{id: string, username: string, role: string}[]>([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [userListError, setUserListError] = useState<string | null>(null);

  // Kullanıcı silme için state
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, username: string} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('auth_users')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setUserProfile(prev => ({
          ...prev,
          username: data.username || '',
          email: '',
        }));
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Profil bilgileri yüklenirken bir hata oluştu');
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      const fetchUsers = async () => {
        setUserListLoading(true);
        setUserListError(null);
        try {
          const { data, error } = await supabase
            .from('auth_users')
            .select('id, username, role')
            .order('username');
          if (error) {
            setUserListError('Kullanıcılar yüklenemedi');
          } else if (data) {
            setUserList(data);
          }
        } catch (err) {
          setUserListError('Kullanıcılar yüklenemedi');
        } finally {
          setUserListLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccessMessage(null);
  };

  // Kullanıcı ekleme input değişimi
  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
    setUserAddError(null);
    setUserAddSuccess(null);
  };

  // Kullanıcı ekleme fonksiyonu
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserAddLoading(true);
    setUserAddError(null);
    setUserAddSuccess(null);

    try {
      // Validasyonlar
      if (!newUser.username || !newUser.password) {
        throw new Error('Kullanıcı adı ve şifre zorunludur');
      }
      if (newUser.password !== newUser.confirmPassword) {
        throw new Error('Şifreler eşleşmiyor');
      }
      if (newUser.password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      // Şifreyi hash'le
      const { data: hashData, error: hashError } = await supabase.rpc('hash_password', {
        password: newUser.password
      });

      if (hashError) throw hashError;

      // Kullanıcıyı doğrudan ekle
      const { data, error } = await supabase
        .from('auth_users')
        .insert({
          username: newUser.username,
          password_hash: hashData,
          role: newUser.role
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Bu kullanıcı adı zaten kullanılıyor');
        }
        throw error;
      }

      setUserAddSuccess('Kullanıcı başarıyla eklendi');
      setNewUser({ username: '', password: '', confirmPassword: '', role: 'user' });
      
      // Kullanıcı listesini yenile
      const fetchUsers = async () => {
        try {
          const { data, error } = await supabase
            .from('auth_users')
            .select('id, username, role')
            .order('username');
          if (!error && data) {
            setUserList(data);
          }
        } catch (err) {
          console.error('Kullanıcı listesi yenilenirken hata:', err);
        }
      };
      fetchUsers();
    } catch (error) {
      console.error('Kullanıcı ekleme hatası:', error);
      setUserAddError(error instanceof Error ? error.message : 'Kullanıcı eklenirken hata oluştu');
    } finally {
      setUserAddLoading(false);
    }
  };

  // Kullanıcı silme fonksiyonu
  const handleDeleteUser = async (userId: string) => {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      // Kendi hesabını silme koruması
      if (userId === user?.id) {
        throw new Error('Kendi hesabınızı silemezsiniz');
      }

      // Önce kullanıcının admin olup olmadığını kontrol et
      const { data: currentUser, error: userError } = await supabase
        .from('auth_users')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (userError || !currentUser || currentUser.role !== 'admin') {
        throw new Error('Bu işlemi yapmak için yetkiniz yok');
      }

      // Kullanıcıyı doğrudan sil
      const { error } = await supabase
        .from('auth_users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Silme hatası:', error);
        throw new Error('Kullanıcı silinirken bir hata oluştu: ' + error.message);
      }

      // Kullanıcı listesinden kaldır
      setUserList(prev => prev.filter(u => u.id !== userId));
      setDeleteConfirm(null);
      
      // Başarı mesajı göster
      setUserAddSuccess('Kullanıcı başarıyla silindi');
      setTimeout(() => setUserAddSuccess(null), 3000);
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      setDeleteError(error instanceof Error ? error.message : 'Kullanıcı silinirken hata oluştu');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Update profile information
      const updates = {
        username: userProfile.username,
        updated_at: new Date()
      };

      const { error: updateError } = await supabase
        .from('auth_users')
        .update(updates)
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Update password if provided
      if (userProfile.newPassword) {
        if (userProfile.newPassword !== userProfile.confirmPassword) {
          throw new Error('Yeni şifreler eşleşmiyor');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: userProfile.newPassword
        });

        if (passwordError) throw passwordError;

        // Clear password fields
        setUserProfile(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }

      setSuccessMessage('Profil başarıyla güncellendi');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-2">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-800 mb-4 tracking-wide">
            AYARLAR
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profil ve Şifre Bölümü */}
          <section className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <UserCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Hesap Bilgileri</h2>
                  <p className="text-indigo-100 text-sm">Profil ve şifre ayarlarınız</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 group-focus-within:text-indigo-600 transition-colors duration-300">
                    Kullanıcı Adı
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={userProfile.username}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-gray-50 transition-all duration-300 transform focus:scale-105 focus:shadow-lg"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Shield className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-lg font-bold text-gray-800">Şifre Değiştir</span>
                  </div>
                  <div className="space-y-4">
                    <div className="group">
                      <div className="relative">
                        <input
                          type="password"
                          name="newPassword"
                          value={userProfile.newPassword}
                          onChange={handleChange}
                          placeholder="Yeni Şifre"
                          autoComplete="new-password"
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-gray-50 transition-all duration-300 transform focus:scale-105 focus:shadow-lg"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                    <div className="group">
                      <div className="relative">
                        <input
                          type="password"
                          name="confirmPassword"
                          value={userProfile.confirmPassword}
                          onChange={handleChange}
                          placeholder="Yeni Şifre (Tekrar)"
                          autoComplete="new-password"
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-gray-50 transition-all duration-300 transform focus:scale-105 focus:shadow-lg"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm font-medium animate-pulse">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-xl text-sm font-medium animate-pulse">
                    {successMessage}
                  </div>
                )}
                
                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={logout}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-400 text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    Çıkış Yap
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:transform-none text-sm font-semibold"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Kaydediliyor...
                      </div>
                    ) : (
                      'Kaydet'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Admin ise Kullanıcılar ve Kullanıcı Ekle Bölümü */}
          {isAdmin && (
            <section className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <UserCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Kullanıcı Yönetimi</h2>
                    <p className="text-green-100 text-sm">Kullanıcı ekleme ve listeleme</p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Mevcut Kullanıcılar</h3>
                  </div>
                  {userListLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      <span className="ml-3 text-gray-500">Yükleniyor...</span>
                    </div>
                  ) : userListError ? (
                    <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm font-medium">
                      {userListError}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userList.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300 group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                              <UserCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800">{u.username}</span>
                              {u.id === user?.id && (
                                <span className="text-xs text-indigo-600 font-medium">(Siz)</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700'}`}>
                              {u.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                            </span>
                            {u.id !== user?.id && (
                              <button
                                onClick={() => setDeleteConfirm({ id: u.id, username: u.username })}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300 transform hover:scale-110"
                                title="Kullanıcıyı Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-8 mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <PlusCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Yeni Kullanıcı Ekle</h3>
                  </div>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="group">
                      <div className="relative">
                        <input
                          type="text"
                          name="username"
                          value={newUser.username}
                          onChange={handleNewUserChange}
                          placeholder="Kullanıcı Adı"
                          autoComplete="username"
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-gray-50 transition-all duration-300 transform focus:scale-105 focus:shadow-lg"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <div className="relative">
                        <input
                          type="password"
                          name="password"
                          value={newUser.password}
                          onChange={handleNewUserChange}
                          placeholder="Şifre"
                          autoComplete="new-password"
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-gray-50 transition-all duration-300 transform focus:scale-105 focus:shadow-lg"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <div className="relative">
                        <input
                          type="password"
                          name="confirmPassword"
                          value={newUser.confirmPassword}
                          onChange={handleNewUserChange}
                          placeholder="Şifre (Tekrar)"
                          autoComplete="new-password"
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-gray-50 transition-all duration-300 transform focus:scale-105 focus:shadow-lg"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <div className="relative">
                        <select
                          name="role"
                          value={newUser.role}
                          onChange={handleNewUserChange}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-gray-50 transition-all duration-300 transform focus:scale-105 focus:shadow-lg"
                        >
                          <option value="user">Kullanıcı</option>
                          <option value="admin">Yönetici</option>
                        </select>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                    
                    {userAddError && (
                      <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm font-medium animate-pulse">
                        {userAddError}
                      </div>
                    )}
                    {userAddSuccess && (
                      <div className="bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-xl text-sm font-medium animate-pulse">
                        {userAddSuccess}
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        disabled={userAddLoading}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:transform-none text-sm font-semibold"
                      >
                        {userAddLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Ekleniyor...
                          </div>
                        ) : (
                          'Kullanıcı Ekle'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Silme Onayı Modalı */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Kullanıcıyı Sil</h3>
                  <p className="text-gray-600 text-sm">Bu işlem geri alınamaz</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  <strong>{deleteConfirm.username}</strong> kullanıcısını silmek istediğinizden emin misiniz?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Bu kullanıcının tüm verileri kalıcı olarak silinecektir.
                </p>
              </div>

              {deleteError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-4">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-400 text-sm font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm.id)}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none text-sm font-semibold"
                >
                  {deleteLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Siliniyor...
                    </div>
                  ) : (
                    'Sil'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ayarlar;
