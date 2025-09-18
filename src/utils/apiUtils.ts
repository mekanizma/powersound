import { supabase } from '../lib/supabase';
import { AppError, handleError } from './errorUtils';
import { ApiResponse } from '../types';

export class ApiService {
  static async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const query = supabase.from(endpoint).select('*');
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null as T, error: handleError(error).message };
    }
  }

  static async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .insert([body])
        .select()
        .single();

      if (error) throw error;
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null as T, error: handleError(error).message };
    }
  }

  static async put<T>(endpoint: string, id: number, body: any): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null as T, error: handleError(error).message };
    }
  }

  static async delete(endpoint: string, id: number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(endpoint)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: undefined, error: null };
    } catch (error) {
      return { data: undefined, error: handleError(error).message };
    }
  }

  static async uploadFile(file: File, bucket: string): Promise<ApiResponse<string>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return { data: publicUrl, error: null };
    } catch (error) {
      return { data: null, error: handleError(error).message };
    }
  }

  static async downloadFile(path: string, bucket: string): Promise<ApiResponse<Blob>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleError(error).message };
    }
  }

  static async deleteFile(path: string, bucket: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return { data: undefined, error: null };
    } catch (error) {
      return { data: undefined, error: handleError(error).message };
    }
  }
} 