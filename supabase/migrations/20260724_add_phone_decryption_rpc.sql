-- Migration: Add RPC to decrypt guardian phone by student ID
-- Date: 2026-07-24

DROP FUNCTION IF EXISTS get_decrypted_phone_by_student_id(UUID);

CREATE OR REPLACE FUNCTION get_decrypted_phone_by_student_id(p_student_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_phone BYTEA;
BEGIN
  -- Pastikan hanya admin terautentikasi yang bisa memanggil fungsi ini
  IF NOT is_admin() THEN
    RETURN 'UNAUTHORIZED';
  END IF;

  -- Ambil nomor hp terenkripsi
  SELECT guardian_phone INTO v_phone FROM public.students WHERE id = p_student_id;
  
  IF v_phone IS NULL THEN
    RETURN 'NOT_FOUND';
  END IF;

  -- Kembalikan string nomor hp terdekripsi
  RETURN pgp_sym_decrypt(v_phone, get_encrypt_key());
END;
$$;

-- Berikan izin eksekusi kepada pengguna terautentikasi
GRANT EXECUTE ON FUNCTION get_decrypted_phone_by_student_id(UUID) TO authenticated;
