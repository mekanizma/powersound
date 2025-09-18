/*
  # Envanter Yönetim Sistemi Veritabanı Şeması

  1. Yeni Tablolar
    - `users` (Kullanıcılar)
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `full_name` (text)
      - `role` (text)
      - `created_at` (timestamp)
    
    - `categories` (Kategoriler)
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    
    - `locations` (Lokasyonlar)
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    
    - `products` (Ürünler)
      - `id` (uuid, primary key)
      - `barcode` (text, unique)
      - `name` (text)
      - `brand` (text)
      - `model` (text)
      - `category_id` (uuid, foreign key)
      - `serial_number` (text)
      - `description` (text)
      - `status` (text)
      - `location_id` (uuid, foreign key)
      - `photo_url` (text)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `movements` (Hareketler)
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `type` (text)
      - `quantity` (integer)
      - `description` (text)
      - `location_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Güvenlik
    - Tüm tablolar için RLS aktif
    - Kullanıcı rollerine göre erişim politikaları
*/

-- Users tablosu
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Only admins can insert users" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Categories tablosu
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are readable by all authenticated users" ON public.categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify categories" ON public.categories
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Locations tablosu
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are readable by all authenticated users" ON public.locations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify locations" ON public.locations
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Products tablosu
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE NOT NULL,
  name text NOT NULL,
  brand text,
  model text,
  category_id uuid REFERENCES public.categories(id),
  serial_number text,
  description text,
  status text NOT NULL DEFAULT 'Depoda',
  location_id uuid REFERENCES public.locations(id),
  photo_url text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are readable by all authenticated users" ON public.products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify products" ON public.products
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Movements tablosu
CREATE TABLE public.movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  user_id uuid REFERENCES public.users(id),
  type text NOT NULL,
  quantity integer NOT NULL,
  description text,
  location_id uuid REFERENCES public.locations(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movements are readable by all authenticated users" ON public.movements
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create movements" ON public.movements
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Default admin kullanıcısı
INSERT INTO public.users (username, password_hash, full_name, role)
VALUES ('admin', '$2a$10$X7U.Ry5wHKVTxUVz2yU3A.R5XG7EFNNvlI0Fy.RtT9/hGV0Kx1tG', 'Admin User', 'admin');