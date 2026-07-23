-- Migration: Add secure encryption helper RPC
-- Date: 2026-07-24

DROP FUNCTION IF EXISTS encrypt_val(TEXT);

CREATE OR REPLACE FUNCTION encrypt_val(p_val TEXT)
RETURNS BYTEA LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  RETURN pgp_sym_encrypt(p_val, get_encrypt_key());
END;
$$;

-- Grant execution to anyone (needed for anon PPDB registration and authenticated admin CRUD)
GRANT EXECUTE ON FUNCTION encrypt_val(TEXT) TO anon, authenticated;
