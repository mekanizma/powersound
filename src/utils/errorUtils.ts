import { toast } from 'react-hot-toast';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown, fallbackMessage = 'Bir hata oluştu') => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    toast.error(error.message);
    return error;
  }

  if (error instanceof Error) {
    toast.error(error.message);
    return new AppError(error.message);
  }

  toast.error(fallbackMessage);
  return new AppError(fallbackMessage);
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} alanı zorunludur`;
  }
  return null;
};

export const validateNumber = (value: any, fieldName: string): string | null => {
  if (isNaN(Number(value)) || Number(value) < 0) {
    return `${fieldName} geçerli bir sayı olmalıdır`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Geçerli bir e-posta adresi giriniz';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'Şifre en az 6 karakter olmalıdır';
  }
  return null;
}; 