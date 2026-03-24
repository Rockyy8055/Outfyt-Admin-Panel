-- Outfyt Admin Panel - Admin Only Schema
-- Run this in Supabase SQL Editor
-- This ONLY creates the admins table

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ADMINS TABLE (Required for admin login)
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
-- RLS - Enable on admins table
-- ============================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Admin policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Admins can read all data' AND tablename = 'admins') THEN
    CREATE POLICY "Admins can read all data" ON admins FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Admins can update own profile' AND tablename = 'admins') THEN
    CREATE POLICY "Admins can update own profile" ON admins FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- TRIGGER for updated_at
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
-- CREATE ADMIN USER
-- ============================================
-- First, create a user in Supabase Auth (Authentication > Users)
-- Then run this query with the user's ID:
-- INSERT INTO admins (user_id, email, name, role) 
-- VALUES ('paste-user-id-here', 'admin@outfyt.com', 'Admin', 'super_admin');
