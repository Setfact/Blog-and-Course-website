-- Skema Database Phinisi Learn (Supabase PostgreSQL)
-- Jalankan skrip ini pada SQL Editor di Supabase Dashboard

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabel Profil Pengguna
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_study_date DATE,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Saluran Komunitas
CREATE TABLE IF NOT EXISTS public.community_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Data Default Channel
INSERT INTO public.community_channels (id, name, description, icon_name, sort_order)
VALUES
  ('networking', 'Networking & CCNA', 'Diskusi seputar routing, switching, subnetting, dan topologi Cisco', 'router', 1),
  ('linux-sysadmin', 'Linux & Sysadmin', 'Server Linux, konfigurasi service, bash scripting, dan troubleshooting', 'terminal', 2),
  ('automation', 'Automation & NetDevOps', 'Python scripting, REST API jaringan, Ansible, dan workflow automasi', 'code', 3),
  ('showcase', 'Project Showcase', 'Pamerkan hasil lab, topologi, proyek script, atau pencapaian belajar Anda', 'workspace_premium', 4),
  ('tanya-jawab', 'Tanya Jawab & Troubleshooting', 'Pusat tanya-jawab seputar kendala konfigurasi lab dan materi teknis', 'help_outline', 5)
ON CONFLICT (id) DO NOTHING;

-- 4. Tabel Postingan Komunitas
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES public.community_channels(id) ON DELETE RESTRICT,
  post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'showcase', 'milestone')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabel Komentar
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabel Upvotes
CREATE TABLE IF NOT EXISTS public.community_upvotes (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 7. Tabel Progres Materi Belajar
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_slug, lesson_id)
);

-- 8. Tabel Log Audit Admin
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger untuk sinkronisasi otomatis counter komentar & upvote
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET comments_count = comments_count + 1, updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET comments_count = GREATEST(comments_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_count ON public.community_comments;
CREATE TRIGGER trg_comment_count
AFTER INSERT OR DELETE ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();

CREATE OR REPLACE FUNCTION public.update_post_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET upvotes_count = upvotes_count + 1, updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET upvotes_count = GREATEST(upvotes_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_upvote_count ON public.community_upvotes;
CREATE TRIGGER trg_upvote_count
AFTER INSERT OR DELETE ON public.community_upvotes
FOR EACH ROW EXECUTE FUNCTION public.update_post_upvote_count();

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy Profiles: Semua user terautentikasi bisa membaca, hanya user bersangkutan atau admin yang bisa update
CREATE POLICY "Profiles readable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Trigger otomatis pembuatan baris profiles saat akun dibuat di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  is_admin := (NEW.email = 'calvinum26@gmail.com');

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status, xp, streak)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    CASE WHEN is_admin THEN 'admin' ELSE 'student' END,
    'active',
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    role = CASE WHEN is_admin THEN 'admin' ELSE public.profiles.role END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sinkronisasi akun yang sudah terdaftar di auth.users ke profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status, xp, streak)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', ''),
  CASE WHEN email = 'calvinum26@gmail.com' THEN 'admin' ELSE 'student' END,
  'active',
  0,
  0
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Policy Channels: Terbuka dibaca oleh authenticated
CREATE POLICY "Channels readable by authenticated users"
ON public.community_channels FOR SELECT
TO authenticated
USING (true);

-- Policy Posts: Dibaca oleh authenticated
CREATE POLICY "Posts readable by authenticated users"
ON public.community_posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create posts"
ON public.community_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors or admins can update posts"
ON public.community_posts FOR UPDATE
TO authenticated
USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Authors or admins can delete posts"
ON public.community_posts FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy Comments:
CREATE POLICY "Comments readable by authenticated users"
ON public.community_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.community_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors or admins can delete comments"
ON public.community_comments FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy Upvotes:
CREATE POLICY "Upvotes readable by authenticated users"
ON public.community_upvotes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert upvote"
ON public.community_upvotes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own upvote"
ON public.community_upvotes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy User Lesson Progress:
CREATE POLICY "Users can read own progress"
ON public.user_lesson_progress FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can insert own progress"
ON public.user_lesson_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy Admin Audit Logs:
CREATE POLICY "Admin audit logs only accessible by admins"
ON public.admin_audit_logs FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
