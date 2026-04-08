#!/usr/bin/env python3
"""
Database Setup Script for Pig Farm Management System
This script helps set up the database schema in Supabase.

Since we cannot directly execute SQL via the REST API, you need to:
1. Go to your Supabase Dashboard: https://svlgjtsjcsksqajtwepc.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the SQL below
4. Run the query
"""

MIGRATION_SQL = """
-- Initial Schema Migration for Pig Farm Management System

-- ============================================
-- ENUMS
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
        CREATE TYPE product_type AS ENUM ('heo_thit', 'heo_con');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('cash', 'bank', 'company');
    END IF;
END
$$;

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
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables (internal tool - no auth required)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'farms' AND policyname = 'Allow all') THEN
        CREATE POLICY "Allow all" ON farms FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Allow all') THEN
        CREATE POLICY "Allow all" ON customers FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Allow all') THEN
        CREATE POLICY "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow all') THEN
        CREATE POLICY "Allow all" ON payments FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

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
"""

if __name__ == "__main__":
    print("="*70)
    print("DATABASE SETUP SQL FOR SUPABASE")
    print("="*70)
    print()
    print("Please follow these steps to set up your database:")
    print()
    print("1. Go to your Supabase Dashboard:")
    print("   https://svlgjtsjcsksqajtwepc.supabase.co")
    print()
    print("2. Navigate to: SQL Editor → New Query")
    print()
    print("3. Copy and paste the SQL below:")
    print()
    print("-"*70)
    print(MIGRATION_SQL)
    print("-"*70)
    print()
    print("4. Click 'Run' to execute the SQL")
    print()
    print("5. After the migration is complete, run the seed_data.py script:")
    print("   python3 scripts/seed_data.py")
    print()
    print("="*70)
