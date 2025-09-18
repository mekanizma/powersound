import { supabase } from '../lib/supabase';
import { AppError, handleError } from './errorUtils';

export const checkAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) throw new AppError('Oturum bulunamadı');
    return session;
  } catch (error) {
    throw handleError(error, 'Yetkilendirme hatası');
  }
};

export const checkRole = async (requiredRole: 'admin' | 'user') => {
  try {
    const session = await checkAuth();
    const { data: user, error } = await supabase
      .from('auth_users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;
    if (!user) throw new AppError('Kullanıcı bulunamadı');
    if (user.role !== requiredRole && user.role !== 'admin') {
      throw new AppError('Bu işlem için yetkiniz yok');
    }
    return true;
  } catch (error) {
    throw handleError(error, 'Yetki kontrolü hatası');
  }
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // HTML etiketlerini kaldır
    .replace(/javascript:/gi, '') // JavaScript protokolünü kaldır
    .trim();
};

export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

export const generateToken = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const encryptData = async (data: string, key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const keyBuffer = encoder.encode(key);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    dataBuffer
  );

  const encryptedArray = new Uint8Array(encryptedData);
  const result = new Uint8Array(iv.length + encryptedArray.length);
  result.set(iv);
  result.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode(...result));
};

export const decryptData = async (
  encryptedData: string,
  key: string
): Promise<string> => {
  const decoder = new TextDecoder();
  const keyBuffer = new TextEncoder().encode(key);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const data = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );

  return decoder.decode(decrypted);
}; 