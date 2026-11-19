-- =========================================================================
-- DG GRAPHICS - SUPABASE DATABASE SCHEMA
-- Commercial Printing Studio OS & ERP
-- Paste this entire script into your Supabase SQL Editor and click RUN
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'sqft',
  base_price NUMERIC NOT NULL DEFAULT 0,
  min_quantity INT NOT NULL DEFAULT 1,
  min_billable_area NUMERIC,
  images JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  finishing_options JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  turnaround_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers CRM Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  pincode TEXT,
  city TEXT,
  first_order_date TIMESTAMPTZ,
  total_orders INT DEFAULT 0,
  total_billed NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  outstanding_balance NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  job_number TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'walk_in',
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_whatsapp TEXT,
  customer_email TEXT,
  delivery_method TEXT NOT NULL DEFAULT 'shop_collection',
  delivery_address TEXT,
  delivery_pincode TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  design_charges NUMERIC NOT NULL DEFAULT 0,
  additional_charges NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  delivery_charges NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  advance_paid NUMERIC NOT NULL DEFAULT 0,
  balance_due NUMERIC NOT NULL DEFAULT 0,
  order_status TEXT NOT NULL DEFAULT 'Order Received',
  payment_status TEXT NOT NULL DEFAULT 'Unpaid',
  production_method TEXT NOT NULL DEFAULT 'in_house',
  expected_completion_date TIMESTAMPTZ,
  internal_notes TEXT,
  customer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Production Tasks Table
CREATE TABLE IF NOT EXISTS production_tasks (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  job_number TEXT NOT NULL,
  task_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'in_house',
  assigned_staff_id TEXT,
  assigned_staff_name TEXT,
  vendor_id TEXT,
  vendor_name TEXT,
  vendor_work_order_id TEXT,
  material_cost NUMERIC DEFAULT 0,
  labour_cost NUMERIC DEFAULT 0,
  vendor_cost NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  category TEXT NOT NULL,
  services_provided JSONB DEFAULT '[]'::jsonb,
  total_work_assigned NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  outstanding_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Vendor Work Orders Table
CREATE TABLE IF NOT EXISTS vendor_work_orders (
  id TEXT PRIMARY KEY,
  work_order_number TEXT NOT NULL UNIQUE,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_phone TEXT NOT NULL,
  job_number TEXT NOT NULL,
  task_description TEXT NOT NULL,
  specifications TEXT,
  quantity INT DEFAULT 1,
  dimensions TEXT,
  agreed_price NUMERIC NOT NULL DEFAULT 0,
  advance_paid NUMERIC DEFAULT 0,
  balance_due NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Assigned',
  expected_delivery_date TIMESTAMPTZ,
  artwork_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Raw Materials & Stock Inventory Table
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'piece',
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  usage_cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  stock_quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock_alert NUMERIC NOT NULL DEFAULT 5,
  vendor_id TEXT,
  vendor_name TEXT,
  last_purchase_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Material Consumption Table
CREATE TABLE IF NOT EXISTS material_consumptions (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  job_number TEXT NOT NULL,
  material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  quantity_used NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Labour & Staff Directory Table
CREATE TABLE IF NOT EXISTS labour (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  work_type TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'per_job',
  default_rate NUMERIC NOT NULL DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  pending_amount NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Labour Wage Transactions Table
CREATE TABLE IF NOT EXISTS labour_transactions (
  id TEXT PRIMARY KEY,
  labour_id TEXT REFERENCES labour(id) ON DELETE CASCADE,
  labour_name TEXT NOT NULL,
  order_id TEXT,
  job_number TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN DEFAULT TRUE,
  date TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT DEFAULT 'Cash'
);

-- 12. Employee Daily Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  labour_id TEXT REFERENCES labour(id) ON DELETE CASCADE,
  labour_name TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'permanent',
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'full_day',
  work_notes TEXT,
  wage_calculated NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(labour_id, date)
);

-- 13. Monthly Salary & Wage Payments Table
CREATE TABLE IF NOT EXISTS monthly_salary_payments (
  id TEXT PRIMARY KEY,
  labour_id TEXT REFERENCES labour(id) ON DELETE CASCADE,
  labour_name TEXT NOT NULL,
  month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(labour_id, month)
);

-- 14. Billing Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  order_id TEXT,
  job_number TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  delivery_charges NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  balance_due NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid',
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Financial Payments Received Table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  order_id TEXT,
  job_number TEXT NOT NULL,
  customer_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  transaction_reference TEXT,
  notes TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  received_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Studio Expenses & Costs Table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  job_number TEXT,
  vendor_id TEXT,
  vendor_name TEXT,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  payment_status TEXT NOT NULL DEFAULT 'Paid',
  receipt_url TEXT,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Online Customer Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  product_or_service TEXT NOT NULL,
  dimensions TEXT,
  quantity INT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  follow_up_date TIMESTAMPTZ,
  quoted_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Studio Business Settings Table
CREATE TABLE IF NOT EXISTS business_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  business_name TEXT NOT NULL DEFAULT 'DG graphics',
  tagline TEXT DEFAULT 'Professional Commercial Printing Studio',
  phone TEXT DEFAULT '+91 98450 12345',
  whatsapp TEXT DEFAULT '+91 98450 12345',
  email TEXT DEFAULT 'contact@dpgraphics.com',
  address TEXT DEFAULT 'No. 42, Commercial Print Street, Indiranagar',
  city TEXT DEFAULT 'Bengaluru',
  pincode TEXT DEFAULT '560038',
  gst_number TEXT DEFAULT '29ABCDE1234F1Z5',
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT DEFAULT 'dpgraphics@upi',
  default_delivery_charge NUMERIC DEFAULT 100,
  free_delivery_threshold NUMERIC DEFAULT 2500,
  whatsapp_templates JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
-- =========================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON %I;', t);
    EXECUTE format('CREATE POLICY "Public access policy" ON %I FOR ALL USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- Grant API access to anon, authenticated and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
