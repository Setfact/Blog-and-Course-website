-- Migrasi Penambahan Kolom Demografi dan Kontak Profil Siswa
-- Jalankan skrip ini pada SQL Editor di Supabase Dashboard (https://supabase.com/dashboard/project/qccvokwdnxzcdxrimejp/sql)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Indonesia';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'ID';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dial_code TEXT DEFAULT '+62';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_source TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.phone_number IS 'Nomor kontak telepon atau WhatsApp siswa dengan format internasional';
COMMENT ON COLUMN public.profiles.country IS 'Negara domisili siswa (default Indonesia)';
COMMENT ON COLUMN public.profiles.province IS 'Provinsi atau State domisili siswa';
COMMENT ON COLUMN public.profiles.city IS 'Kota atau Kabupaten domisili siswa';
COMMENT ON COLUMN public.profiles.occupation IS 'Status profesi (pelajar SMK, mahasiswa, profesional, dll)';
COMMENT ON COLUMN public.profiles.institution_name IS 'Nama sekolah, kampus, atau perusahaan instansi siswa';
COMMENT ON COLUMN public.profiles.referral_source IS 'Sumber kanal referensi siswa mengetahui platform Phinisi Learn';
COMMENT ON COLUMN public.profiles.is_profile_complete IS 'Status kelengkapan profil resmi siswa untuk klaim sertifikasi';
