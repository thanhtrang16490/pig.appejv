-- Initial Schema Migration for Pig Farm Management System
-- Created: 2026-04-08

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE IF NOT EXISTS product_type AS ENUM ('heo_thit', 'heo_con');
CREATE TYPE IF NOT EXISTS payment_method AS ENUM ('cash', 'bank', 'company');

-- ============================================
-- TABLES
-- ============================================

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    group_name text,
    location text,
    created_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address text,
    phone text,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date date NOT NULL,
    farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    product_type product_type NOT NULL,
    quantity integer NOT NULL,
    total_weight_kg numeric NOT NULL DEFAULT 0,
    avg_weight_kg numeric DEFAULT 0,
    unit_price numeric NOT NULL DEFAULT 0,
    revenue_by_count numeric DEFAULT 0,
    excess_weight_kg numeric DEFAULT 0,
    excess_price_per_kg numeric DEFAULT 0,
    excess_revenue numeric DEFAULT 0,
    total_invoice numeric DEFAULT 0,
    payment_cash numeric DEFAULT 0,
    payment_bank numeric DEFAULT 0,
    payment_company numeric DEFAULT 0,
    total_paid numeric DEFAULT 0,
    outstanding_debt numeric DEFAULT 0,
    surplus numeric DEFAULT 0,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    payment_date date NOT NULL,
    amount numeric NOT NULL,
    method payment_method NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_farm ON transactions(farm_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_type ON transactions(product_type);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- Customers index for search
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- ============================================
-- VIEWS
-- ============================================

-- Customer summary view
CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.address as customer_address,
    COALESCE(SUM(t.total_invoice), 0) as total_revenue,
    COALESCE(SUM(t.total_paid), 0) as total_paid,
    COALESCE(SUM(t.outstanding_debt), 0) as outstanding_debt,
    COUNT(t.id) as transaction_count
FROM customers c
LEFT JOIN transactions t ON c.id = t.customer_id
GROUP BY c.id, c.name, c.address;

-- Farm summary view
CREATE OR REPLACE VIEW farm_summary AS
SELECT
    f.id as farm_id,
    f.name as farm_name,
    COALESCE(SUM(t.total_invoice), 0) as total_revenue,
    COALESCE(SUM(t.quantity), 0) as total_quantity,
    COALESCE(SUM(t.total_weight_kg), 0) as total_weight_kg,
    COUNT(t.id) as transaction_count
FROM farms f
LEFT JOIN transactions t ON f.id = t.farm_id
GROUP BY f.id, f.name;

-- Daily summary view
CREATE OR REPLACE VIEW daily_summary AS
SELECT
    transaction_date,
    SUM(total_invoice) as total_revenue,
    COUNT(*) as total_transactions,
    SUM(quantity) as total_quantity
FROM transactions
GROUP BY transaction_date
ORDER BY transaction_date DESC;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables (internal tool - no auth required)
CREATE POLICY IF NOT EXISTS "Allow all" ON farms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for transactions table
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
