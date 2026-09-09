-- Skrip Keamanan Database Phinisi Learn
-- 1. Proteksi Kolom Sensitif pada tabel profiles
-- 2. Fungsi Transaksional RPC untuk Administrasi Pengguna

-- 1. Trigger proteksi kolom role, status, xp, streak dari perubahan oleh pengguna biasa
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Dapatkan role dari pengguna yang sedang memanggil request (auth.uid())
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  caller_role := COALESCE(caller_role, 'student');

  -- Jika bukan admin, tolak perubahan pada kolom-kolom berwenang tinggi
  IF caller_role <> 'admin' THEN
    IF NEW.role <> OLD.role THEN
      RAISE EXCEPTION 'Akses ditolak: role tidak dapat dimodifikasi secara langsung.';
    END IF;
    IF NEW.status <> OLD.status THEN
      RAISE EXCEPTION 'Akses ditolak: status akun tidak dapat dimodifikasi secara langsung.';
    END IF;
    IF NEW.xp <> OLD.xp THEN
      RAISE EXCEPTION 'Akses ditolak: akumulasi XP hanya dapat diperbarui melalui engine XP resmi.';
    END IF;
    IF NEW.streak <> OLD.streak THEN
      RAISE EXCEPTION 'Akses ditolak: streak hanya dapat diperbarui melalui sistem belajar resmi.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_columns();


-- 2. Fungsi RPC: Update Role Pengguna oleh Administrator
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_target_user_id UUID,
  p_new_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan';
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;
  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: hanya administrator yang berwenang mengubah role';
  END IF;

  IF p_new_role NOT IN ('student', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Role baru tidak valid';
  END IF;

  UPDATE public.profiles
  SET role = p_new_role, updated_at = NOW()
  WHERE id = p_target_user_id;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (caller_id, 'UPDATE_ROLE', 'user', p_target_user_id::text, jsonb_build_object('new_role', p_new_role));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Fungsi RPC: Update Status Pengguna (Active/Suspended) oleh Administrator
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  p_target_user_id UUID,
  p_new_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan';
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;
  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: hanya administrator yang berwenang mengubah status';
  END IF;

  IF p_new_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Status baru tidak valid';
  END IF;

  UPDATE public.profiles
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_target_user_id;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (caller_id, 'UPDATE_STATUS', 'user', p_target_user_id::text, jsonb_build_object('new_status', p_new_status));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Fungsi RPC: Reset Progres Belajar Pengguna oleh Administrator
CREATE OR REPLACE FUNCTION public.admin_reset_user_progress(
  p_target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan';
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;
  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: hanya administrator yang berwenang mereset progres';
  END IF;

  DELETE FROM public.user_lesson_progress WHERE user_id = p_target_user_id;

  UPDATE public.profiles
  SET xp = 0, streak = 0, last_study_date = NULL, updated_at = NOW()
  WHERE id = p_target_user_id;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (caller_id, 'RESET_PROGRESS', 'user', p_target_user_id::text, jsonb_build_object('reset_at', NOW()));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
