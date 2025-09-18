-- Kullanıcı tablosunu güncelle
ALTER TABLE public.users
ADD COLUMN email text UNIQUE;

-- Admin kullanıcısı için email ekle
UPDATE public.users
SET email = 'admin@example.com'
WHERE username = 'admin';

-- RLS politikalarını güncelle
CREATE POLICY "Users can read their own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Only admins can manage users"
ON public.users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');