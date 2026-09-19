-- ============================================================
-- CineFlix Supabase Admin Password Management & Security Rate Limiting Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. Enable pgcrypto extension for secure bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 2. SECURITY RATE LIMITING TABLE & ENGINE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  last_attempt TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (managed strictly by security definer functions)
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;

-- Helper function to enforce rate limits
CREATE OR REPLACE FUNCTION public.check_and_enforce_rate_limit(
  p_key TEXT,
  p_max_attempts INTEGER,
  p_window_seconds INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_record public.security_rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_elapsed_seconds INTEGER;
BEGIN
  SELECT * INTO v_record FROM public.security_rate_limits WHERE key = p_key FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.security_rate_limits (key, attempts, window_start, last_attempt)
    VALUES (p_key, 1, v_now, v_now);
    RETURN;
  END IF;

  v_elapsed_seconds := EXTRACT(EPOCH FROM (v_now - v_record.window_start))::INTEGER;

  IF v_elapsed_seconds > p_window_seconds THEN
    -- Window has expired: reset window
    UPDATE public.security_rate_limits
    SET attempts = 1,
        window_start = v_now,
        last_attempt = v_now
    WHERE key = p_key;
  ELSE
    -- Inside active window: check limit
    IF v_record.attempts >= p_max_attempts THEN
      RAISE EXCEPTION 'SECURITY RATE LIMIT: Exceeded maximum allowed attempts (% in %s). Please wait %s seconds before retrying.',
        p_max_attempts,
        p_window_seconds,
        (p_window_seconds - v_elapsed_seconds);
    END IF;

    -- Increment attempt count
    UPDATE public.security_rate_limits
    SET attempts = attempts + 1,
        last_attempt = v_now
    WHERE key = p_key;
  END IF;
END;
$$;

-- ============================================================
-- 3. SECURE ADMIN PASSWORD CHANGE FUNCTION (WITH RATE LIMITING)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_change_user_password(
  target_user_id UUID, 
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
  target_email TEXT;
BEGIN
  -- 1. Verify caller is authenticated and has 'admin' role in public.profiles
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Only platform administrators can change user passwords.';
  END IF;

  -- 2. Enforce Security Rate Limits:
  -- Admin caller: max 5 password changes per 60 seconds
  PERFORM public.check_and_enforce_rate_limit(
    'admin_pwd_change:' || auth.uid()::TEXT,
    5,
    60
  );

  -- Target user: max 3 password resets per 60 seconds
  PERFORM public.check_and_enforce_rate_limit(
    'target_pwd_reset:' || target_user_id::TEXT,
    3,
    60
  );

  -- 3. Validate target user exists in auth.users
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  -- 4. Validate password complexity (minimum 6 characters)
  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long.';
  END IF;

  -- 5. Update the encrypted password directly in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  -- 6. Track in user_passwords audit table
  INSERT INTO public.user_passwords (user_id, email, last_changed_by, updated_at)
  VALUES (target_user_id, target_email, auth.uid(), now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_changed_by = auth.uid(),
    updated_at = now();

  RETURN json_build_object(
    'success', true, 
    'message', format('Password for %s has been updated successfully.', target_email)
  );
END;
$$;

-- ============================================================
-- 4. USER PASSWORDS AUDIT TABLE & RLS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  last_changed_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_passwords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view password logs" ON public.user_passwords;
CREATE POLICY "Admins can view password logs"
ON public.user_passwords
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

GRANT EXECUTE ON FUNCTION admin_change_user_password(UUID, TEXT) TO authenticated;
