-- Outfyt Admin Panel - Authentication Setup
-- Run this in Supabase SQL Editor
-- This configures Supabase Auth for the admin panel

-- ============================================
-- 1. ADMINS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE UUID EXTENSION
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read admins (for login check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Admins can read all data' AND tablename = 'admins') THEN
    CREATE POLICY "Admins can read all data" ON admins FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Admins can update own profile' AND tablename = 'admins') THEN
    CREATE POLICY "Admins can update own profile" ON admins FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Admins can insert' AND tablename = 'admins') THEN
    CREATE POLICY "Admins can insert" ON admins FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- 4. TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. AUTO-CREATE ADMIN RECORD ON SIGNUP
-- ============================================
-- This trigger automatically creates an admin record when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admins (user_id, email, name, role, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'moderator',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 6. SUPABASE AUTH SETTINGS
-- ============================================
-- Configure these in Supabase Dashboard > Authentication > Settings:
-- 
-- Site URL: http://localhost:3002 (or your production URL)
-- Redirect URLs: 
--   - http://localhost:3002/reset-password
--   - http://localhost:3002/login
--   - http://localhost:3002/admin
--
-- Email Settings:
--   - Enable email confirmations (recommended)
--   - Custom email templates for:
--     - Confirm signup
--     - Reset password
--     - Magic link (optional)

-- ============================================
-- 7. EMAIL TEMPLATES (Configure in Dashboard)
-- ============================================
-- Go to Authentication > Email Templates and customize:

-- CONFIRM SIGNUP TEMPLATE:
-- Subject: Confirm your signup to Outfyt Admin
-- Body:
-- <h2>Confirm your email</h2>
-- <p>Follow this link to confirm your account:</p>
-- <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a></p>

-- RESET PASSWORD TEMPLATE:
-- Subject: Reset your Outfyt Admin password
-- Body:
-- <h2>Reset your password</h2>
-- <p>Follow this link to reset your password:</p>
-- <p><a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset password</a></p>
-- <p>This link will expire in 24 hours.</p>

-- ============================================
-- 8. CREATE FIRST SUPER ADMIN
-- ============================================
-- After running this SQL, create a user in Supabase Auth
-- Then run this to make them super_admin:
-- 
-- UPDATE admins SET role = 'super_admin' WHERE email = 'your-email@example.com';

-- ============================================
-- 9. VERIFY SETUP
-- ============================================
-- Run this to verify everything is set up:
-- SELECT * FROM admins;
-- SELECT * FROM auth.users;
