/*
  # Admin Kullanıcı Oluşturma
  
  Varsayılan admin kullanıcısı:
  - Username: admin
  - Password: admin123
  - Role: admin
*/

-- Admin kullanıcısını oluştur (eğer yoksa)
INSERT INTO auth_users (
  id,
  username,
  password_hash,
  role
) VALUES (
  '211c7676-7e10-4ac2-9261-5e2d597a224c',
  'admin',
  crypt('admin123', gen_salt('bf')),
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  password_hash = crypt('admin123', gen_salt('bf')),
  role = 'admin';
