-- Outfyt Admin Panel Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE admins (
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
-- USERS TABLE (Platform Users)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  addresses JSONB DEFAULT '[]'::jsonb,
  fcm_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STORES TABLE (Vendors)
-- ============================================
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT,
  description TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  location GEOMETRY(POINT, 4326),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
  rejection_reason TEXT,
  total_products INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  images TEXT[] DEFAULT '{}',
  category TEXT,
  subcategory TEXT,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

-- ============================================
-- RIDERS TABLE (Delivery Partners)
-- ============================================
CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'scooter', 'car')),
  vehicle_number TEXT NOT NULL,
  vehicle_model TEXT,
  driving_license TEXT,
  aadhaar TEXT,
  pan TEXT,
  bank_account JSONB,
  location GEOMETRY(POINT, 4326),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  suspension_reason TEXT,
  is_available BOOLEAN DEFAULT false,
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  fcm_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL DEFAULT ('ORD' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(nextval('order_seq')::text, 6, '0')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
  
  -- Customer info (snapshot at order time)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  
  -- Delivery address
  delivery_address JSONB NOT NULL,
  
  -- Order items
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  cancellation_reason TEXT,
  cancelled_by TEXT,
  cancelled_at TIMESTAMPTZ,
  
  -- Payment
  payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'cod', 'wallet')),
  payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Timing
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Store name snapshot
  store_name TEXT NOT NULL,
  
  -- Rider name snapshot
  rider_name TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_seq;

-- ============================================
-- ORDER TIMELINE TABLE
-- ============================================
CREATE TABLE order_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  actor TEXT,
  actor_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TICKETS TABLE (Support)
-- ============================================
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL DEFAULT ('TKT' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(nextval('ticket_seq')::text, 6, '0')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- User info snapshot
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  
  -- Order info snapshot
  order_number TEXT,
  
  subject TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('delivery', 'payment', 'product', 'store', 'rider', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  
  -- Assignment
  assigned_to UUID REFERENCES admins(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES admins(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_seq;

-- ============================================
-- TICKET MESSAGES TABLE
-- ============================================
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin', 'system')),
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id TEXT UNIQUE NOT NULL DEFAULT ('TXN' || to_char(NOW(), 'YYYYMMDDHH24MISS') || '-' || lpad(floor(random() * 10000)::text, 4, '0')),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  
  -- User/Store info snapshot
  user_name TEXT NOT NULL,
  store_name TEXT,
  order_number TEXT NOT NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Payment gateway info
  gateway TEXT CHECK (gateway IN ('razorpay', 'stripe')),
  gateway_payment_id TEXT,
  gateway_refund_id TEXT,
  
  refund_reason TEXT,
  refunded_amount DECIMAL(10,2),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Daily orders count view
CREATE VIEW analytics_daily_orders AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as count
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Daily revenue view
CREATE VIEW analytics_daily_revenue AS
SELECT
  DATE(created_at) as date,
  SUM(total) as amount
FROM orders
WHERE status = 'delivered' AND payment_status = 'paid'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Daily active users view
CREATE VIEW analytics_daily_active_users AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as count
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_rider_id ON orders(rider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_riders_status ON riders(status);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_payments_order_id ON payments(order_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Admin policies (service role bypasses RLS, so these are for anon key access)
CREATE POLICY "Admins can read all data" ON admins FOR SELECT USING (true);
CREATE POLICY "Admins can update own profile" ON admins FOR UPDATE USING (auth.uid() = user_id);

-- For admin panel, we'll use service role key which bypasses RLS
-- So we don't need complex RLS policies for the admin operations

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to all tables
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SAMPLE ADMIN USER
-- ============================================
-- After creating a user through Supabase Auth, run:
-- INSERT INTO admins (user_id, email, name, role) VALUES ('auth-user-id', 'admin@outfyt.com', 'Admin User', 'super_admin');
