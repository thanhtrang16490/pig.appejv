-- =====================================================
-- SEED DATA FOR PIG FARM MANAGEMENT SYSTEM
-- Dữ liệu mẫu cho Hệ thống Quản lý Trang trại Heo
-- =====================================================
-- File: seed_data.sql
-- Purpose: Create schema + Insert sample data into Supabase database
-- Date: October 2025
-- =====================================================
-- Hướng dẫn: Copy toàn bộ file này và chạy trong Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 0. TẠO SCHEMA (Create database schema)
-- =====================================================

-- Tạo ENUM types
DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('heo_thit', 'heo_con');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'bank', 'company');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tạo bảng Trang trại
CREATE TABLE IF NOT EXISTS farms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    group_name text,
    location text,
    created_at timestamptz DEFAULT now()
);

-- Tạo bảng Khách hàng
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address text,
    phone text,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Tạo bảng Giao dịch
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

-- Tạo bảng Thanh toán
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

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_farm ON transactions(farm_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_type ON transactions(product_type);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Tạo views
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

CREATE OR REPLACE VIEW daily_summary AS
SELECT
    transaction_date,
    SUM(total_invoice) as total_revenue,
    COUNT(*) as total_transactions,
    SUM(quantity) as total_quantity
FROM transactions
GROUP BY transaction_date
ORDER BY transaction_date DESC;

-- Bật Row Level Security
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép tất cả (ứng dụng nội bộ)
DO $$ BEGIN
    CREATE POLICY "Allow all" ON farms FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Allow all" ON customers FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Allow all" ON payments FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tạo trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 1. XÓA DỮ LIỆU HIỆN CÓ (Clear existing data)
-- =====================================================
-- Xóa theo thứ tự để tránh vi phạm khóa ngoại

BEGIN;

DELETE FROM payments;
DELETE FROM transactions;
DELETE FROM customers;
DELETE FROM farms;

-- =====================================================
-- 2. INSERT FARMS - Trang trại heo
-- =====================================================

INSERT INTO farms (id, name, group_name, location, created_at) VALUES
(gen_random_uuid(), 'Trang trại Heo Phú Mỹ', 'Nhóm Đông Nam Bộ', 'Huyện Châu Thành, Tỉnh Bà Rịa - Vũng Tàu', NOW()),
(gen_random_uuid(), 'Trang trại Heo Long An', 'Nhóm Tây Nam Bộ', 'Huyện Bến Lức, Tỉnh Long An', NOW()),
(gen_random_uuid(), 'Trang trại Heo Bình Dương', 'Nhóm Đông Nam Bộ', 'Thành phố Thủ Dầu Một, Tỉnh Bình Dương', NOW()),
(gen_random_uuid(), 'Trang trại Heo Đồng Nai', 'Nhóm Đông Nam Bộ', 'Huyện Long Thành, Tỉnh Đồng Nai', NOW()),
(gen_random_uuid(), 'Trang trại Heo Tiền Giang', 'Nhóm Tây Nam Bộ', 'Huyện Cai Lậy, Tỉnh Tiền Giang', NOW()),
(gen_random_uuid(), 'Trang trại Heo Vĩnh Long', 'Nhóm Tây Nam Bộ', 'Huyện Long Hồ, Tỉnh Vĩnh Long', NOW()),
(gen_random_uuid(), 'Trang trại Heo An Giang', 'Nhóm Tây Nam Bộ', 'Huyện Châu Thành, Tỉnh An Giang', NOW()),
(gen_random_uuid(), 'Trang trại Heo Bình Thuận', 'Nhóm Miền Trung', 'Huyện Hàm Thuận Nam, Tỉnh Bình Thuận', NOW()),
(gen_random_uuid(), 'Trang trại Heo Ninh Thuận', 'Nhóm Miền Trung', 'Huyện Ninh Phước, Tỉnh Ninh Thuận', NOW()),
(gen_random_uuid(), 'Trang trại Heo Khánh Hòa', 'Nhóm Miền Trung', 'Huyện Diên Khánh, Tỉnh Khánh Hòa', NOW()),
(gen_random_uuid(), 'Trang trại Heo Bình Định', 'Nhóm Miền Trung', 'Huyện Tuy Phước, Tỉnh Bình Định', NOW()),
(gen_random_uuid(), 'Trang trại Heo Phú Yên', 'Nhóm Miền Trung', 'Huyện Tuy Hòa, Tỉnh Phú Yên', NOW()),
(gen_random_uuid(), 'Trang trại Heo Bến Tre', 'Nhóm Tây Nam Bộ', 'Huyện Châu Thành, Tỉnh Bến Tre', NOW()),
(gen_random_uuid(), 'Trang trại Heo Trà Vinh', 'Nhóm Tây Nam Bộ', 'Huyện Càng Long, Tỉnh Trà Vinh', NOW()),
(gen_random_uuid(), 'Trang trại Heo Sóc Trăng', 'Nhóm Tây Nam Bộ', 'Huyện Mỹ Xuyên, Tỉnh Sóc Trăng', NOW());

-- =====================================================
-- 3. INSERT CUSTOMERS - Khách hàng
-- =====================================================

INSERT INTO customers (id, name, address, phone, notes, created_at) VALUES
(gen_random_uuid(), 'Công ty CP Chăn nuôi Miền Nam', '123 Nguyễn Văn A, Quận 1, TP.HCM', '0901234567', 'Khách hàng thân thiết, thanh toán đúng hạn', NOW()),
(gen_random_uuid(), 'Thương lái Nguyễn Văn Bình', '45 Lê Lợi, TP. Biên Hòa, Đồng Nai', '0912345678', 'Mua heo thịt số lượng lớn', NOW()),
(gen_random_uuid(), 'Cơ sở giết mổ Hòa Phát', '78 Trần Hưng Đạo, TP. Long Xuyên, An Giang', '0923456789', 'Cơ sở giết mổ lớn', NOW()),
(gen_random_uuid(), 'Thương lái Trần Thị Lan', '12 Nguyễn Trãi, TP. Mỹ Tho, Tiền Giang', '0934567890', 'Chuyên mua heo con', NOW()),
(gen_random_uuid(), 'Công ty TNHH Thực phẩm Sạch', '56 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', '0945678901', 'Công ty thực phẩm', NOW()),
(gen_random_uuid(), 'Thương lái Lê Văn Hùng', '89 Nguyễn Huệ, TP. Vũng Tàu, Bà Rịa - Vũng Tàu', '0956789012', 'Mua heo định kỳ hàng tuần', NOW()),
(gen_random_uuid(), 'Trang trại Heo Hoàng Gia', '234 Quốc lộ 1A, Huyện Bến Lức, Long An', '0967890123', 'Trang trại lớn, cần heo giống', NOW()),
(gen_random_uuid(), 'Công ty CP Thương mại Nông sản', '567 Lý Thường Kiệt, Quận 10, TP.HCM', '0978901234', 'Xuất khẩu nông sản', NOW()),
(gen_random_uuid(), 'Thương lái Phạm Thị Hoa', '34 Hùng Vương, TP. Rạch Giá, Kiên Giang', '0989012345', 'Mua heo cho chợ đầu mối', NOW()),
(gen_random_uuid(), 'Cơ sở chế biến thịt Minh Tâm', '90 Nguyễn Thị Minh Khai, TP. Cao Lãnh, Đồng Tháp', '0990123456', 'Chế biến thịt nguội', NOW()),
(gen_random_uuid(), 'Thương lái Đỗ Văn Minh', '67 Phan Đình Phùng, TP. Tân An, Long An', '0909876543', 'Mua heo thịt', NOW()),
(gen_random_uuid(), 'Công ty TNHH Xuất nhập khẩu Agri', '789 Nguyễn Văn Linh, Quận 7, TP.HCM', '0918765432', 'Xuất khẩu heo', NOW()),
(gen_random_uuid(), 'Thương lái Võ Thị Thanh', '23 Trần Phú, TP. Phan Thiết, Bình Thuận', '0927654321', 'Mua heo cho nhà hàng', NOW()),
(gen_random_uuid(), 'Chợ đầu mối Thủ Đức', '456 Quốc lộ 13, TP. Thủ Đức, TP.HCM', '0936543210', 'Chợ đầu mối lớn', NOW()),
(gen_random_uuid(), 'Thương lái Bùi Văn Sơn', '11 Lê Duẩn, TP. Nha Trang, Khánh Hòa', '0945432109', 'Mua heo miền Trung', NOW()),
(gen_random_uuid(), 'Công ty CP Thực phẩm Cholimex', '222 Võ Văn Tần, Quận 3, TP.HCM', '0954321098', 'Công ty thực phẩm lớn', NOW()),
(gen_random_uuid(), 'Thương lái Nguyễn Thị Mai', '88 Hà Huy Tập, TP. Quy Nhơn, Bình Định', '0963210987', 'Mua heo con giống', NOW()),
(gen_random_uuid(), 'Trang trại Heo Thái Sơn', '345 Nguyễn Tất Thành, Huyện Châu Thành, Bến Tre', '0972109876', 'Trang trại vừa', NOW()),
(gen_random_uuid(), 'Thương lái Lý Văn Tâm', '66 Trương Định, TP. Vĩnh Long, Vĩnh Long', '0981098765', 'Mua heo định kỳ', NOW()),
(gen_random_uuid(), 'Công ty TNHH Chăn nuôi ABC', '999 Cách Mạng Tháng 8, Quận Tân Bình, TP.HCM', '0990987654', 'Chuỗi chăn nuôi', NOW()),
(gen_random_uuid(), 'Thương lái Hồ Thị Lan', '44 Nguyễn Đình Chiểu, TP. Bến Tre, Bến Tre', '0908765432', 'Mua heo cho tiểu thương', NOW()),
(gen_random_uuid(), 'Cơ sở giết mổ An Phú', '77 Nguyễn Văn Cừ, TP. Cần Thơ', '0917654321', 'Giết mổ quy mô vừa', NOW()),
(gen_random_uuid(), 'Thương lái Dương Văn Phong', '55 Lê Hồng Phong, TP. Trà Vinh, Trà Vinh', '0926543210', 'Mua heo xuất khẩu', NOW()),
(gen_random_uuid(), 'Công ty CP Thực phẩm Việt Nam', '888 Đồng Khởi, Quận 1, TP.HCM', '0935432109', 'Công ty thực phẩm quốc gia', NOW()),
(gen_random_uuid(), 'Thương lái Trương Thị Hồng', '33 Nguyễn Trung Trực, TP. Sóc Trăng, Sóc Trăng', '0944321098', 'Mua heo cho chợ địa phương', NOW());

-- =====================================================
-- 4. INSERT TRANSACTIONS - Giao dịch bán heo
-- =====================================================
-- Giao dịch heo thịt (heo_thit)

INSERT INTO transactions (
    id, transaction_date, farm_id, customer_id, product_type, quantity, total_weight_kg, avg_weight_kg,
    unit_price, revenue_by_count, excess_weight_kg, excess_price_per_kg, excess_revenue,
    total_invoice, payment_cash, payment_bank, payment_company, total_paid, outstanding_debt, surplus, notes, created_at, updated_at
) VALUES
-- Giao dịch 1: Heo thịt, thanh toán đủ tiền mặt
(gen_random_uuid(), '2025-10-01', 
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Phú Mỹ'),
    (SELECT id FROM customers WHERE name = 'Thương lái Nguyễn Văn Bình'),
    'heo_thit', 15, 1650, 110, 55000, 90750000, 0, 0, 0, 90750000, 90750000, 0, 0, 90750000, 0, 0, 'Giao dịch đầu tháng 10', NOW(), NOW()),

-- Giao dịch 2: Heo thịt, thanh toán chuyển khoản đủ
(gen_random_uuid(), '2025-10-02',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Long An'),
    (SELECT id FROM customers WHERE name = 'Cơ sở giết mổ Hòa Phát'),
    'heo_thit', 25, 2875, 115, 58000, 166750000, 0, 0, 0, 166750000, 0, 166750000, 0, 166750000, 0, 0, 'Thanh toán qua ngân hàng', NOW(), NOW()),

-- Giao dịch 3: Heo thịt, thanh toán công nợ một phần
(gen_random_uuid(), '2025-10-03',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Bình Dương'),
    (SELECT id FROM customers WHERE name = 'Công ty CP Chăn nuôi Miền Nam'),
    'heo_thit', 30, 3300, 110, 56000, 184800000, 0, 0, 0, 184800000, 50000000, 50000000, 50000000, 150000000, 34800000, 0, 'Khách hàng công nợ 34.8 triệu', NOW(), NOW()),

-- Giao dịch 4: Heo thịt, thanh toán tiền mặt + chuyển khoản
(gen_random_uuid(), '2025-10-05',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Đồng Nai'),
    (SELECT id FROM customers WHERE name = 'Thương lái Lê Văn Hùng'),
    'heo_thit', 12, 1380, 115, 60000, 82800000, 0, 0, 0, 82800000, 40000000, 42800000, 0, 82800000, 0, 0, 'Tiền mặt 40tr, chuyển khoản 42.8tr', NOW(), NOW()),

-- Giao dịch 5: Heo thịt, thanh toán đủ công ty
(gen_random_uuid(), '2025-10-06',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Tiền Giang'),
    (SELECT id FROM customers WHERE name = 'Công ty TNHH Thực phẩm Sạch'),
    'heo_thit', 20, 2300, 115, 62000, 142600000, 0, 0, 0, 142600000, 0, 0, 142600000, 142600000, 0, 0, 'Thanh toán qua công ty', NOW(), NOW()),

-- Giao dịch 6: Heo thịt, nợ toàn bộ
(gen_random_uuid(), '2025-10-07',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Vĩnh Long'),
    (SELECT id FROM customers WHERE name = 'Thương lái Trần Thị Lan'),
    'heo_thit', 18, 1980, 110, 54000, 106920000, 0, 0, 0, 106920000, 0, 0, 0, 0, 106920000, 0, 'Khách hàng nợ toàn bộ', NOW(), NOW()),

-- Giao dịch 7: Heo thịt, thanh toán dư
(gen_random_uuid(), '2025-10-08',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo An Giang'),
    (SELECT id FROM customers WHERE name = 'Trang trại Heo Hoàng Gia'),
    'heo_thit', 35, 4025, 115, 59000, 237475000, 0, 0, 0, 237475000, 200000000, 0, 40000000, 240000000, 0, 2525000, 'Khách trả dư 2.5 triệu', NOW(), NOW()),

-- Giao dịch 8: Heo thịt, số lượng nhỏ
(gen_random_uuid(), '2025-10-10',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Bình Thuận'),
    (SELECT id FROM customers WHERE name = 'Thương lái Võ Thị Thanh'),
    'heo_thit', 8, 880, 110, 57000, 50160000, 0, 0, 0, 50160000, 50160000, 0, 0, 50160000, 0, 0, 'Giao dịch nhỏ lẻ', NOW(), NOW()),

-- Giao dịch 9: Heo thịt, thanh toán hỗn hợp 3 phương thức
(gen_random_uuid(), '2025-10-12',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Khánh Hòa'),
    (SELECT id FROM customers WHERE name = 'Công ty CP Thương mại Nông sản'),
    'heo_thit', 40, 4600, 115, 61000, 280600000, 0, 0, 0, 280600000, 100000000, 100000000, 80600000, 280600000, 0, 0, 'Tiền mặt + chuyển khoản + công ty', NOW(), NOW()),

-- Giao dịch 10: Heo thịt, nợ một phần
(gen_random_uuid(), '2025-10-14',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Bình Định'),
    (SELECT id FROM customers WHERE name = 'Thương lái Phạm Thị Hoa'),
    'heo_thit', 22, 2420, 110, 55000, 133100000, 0, 0, 0, 133100000, 80000000, 0, 0, 80000000, 53100000, 0, 'Còn nợ 53.1 triệu', NOW(), NOW()),

-- Giao dịch 11: Heo thịt, số lượng lớn
(gen_random_uuid(), '2025-10-15',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Phú Yên'),
    (SELECT id FROM customers WHERE name = 'Chợ đầu mối Thủ Đức'),
    'heo_thit', 50, 5750, 115, 53000, 304750000, 0, 0, 0, 304750000, 150000000, 154750000, 0, 304750000, 0, 0, 'Giao dịch lớn cho chợ đầu mối', NOW(), NOW()),

-- Giao dịch 12: Heo thịt, giá cao
(gen_random_uuid(), '2025-10-16',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Bến Tre'),
    (SELECT id FROM customers WHERE name = 'Công ty CP Thực phẩm Cholimex'),
    'heo_thit', 28, 3080, 110, 65000, 200200000, 0, 0, 0, 200200000, 0, 200200000, 0, 200200000, 0, 0, 'Giá cao 65k/kg', NOW(), NOW()),

-- Giao dịch 13: Heo thịt, thanh toán tiền mặt
(gen_random_uuid(), '2025-10-18',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Trà Vinh'),
    (SELECT id FROM customers WHERE name = 'Thương lái Đỗ Văn Minh'),
    'heo_thit', 16, 1760, 110, 56000, 98560000, 0, 0, 0, 98560000, 98560000, 0, 0, 98560000, 0, 0, 'Thanh toán tiền mặt đủ', NOW(), NOW()),

-- Giao dịch 14: Heo thịt, nợ dài hạn
(gen_random_uuid(), '2025-10-20',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Sóc Trăng'),
    (SELECT id FROM customers WHERE name = 'Thương lái Nguyễn Thị Mai'),
    'heo_thit', 10, 1150, 115, 58000, 66700000, 0, 0, 0, 66700000, 0, 0, 0, 0, 66700000, 0, 'Khách hẹn trả sau 15 ngày', NOW(), NOW()),

-- Giao dịch 15: Heo thịt, trung bình
(gen_random_uuid(), '2025-10-22',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Phú Mỹ'),
    (SELECT id FROM customers WHERE name = 'Thương lái Bùi Văn Sơn'),
    'heo_thit', 14, 1610, 115, 59000, 94990000, 0, 0, 0, 94990000, 50000000, 0, 44990000, 94990000, 0, 0, 'Tiền mặt + công ty', NOW(), NOW()),

-- Giao dịch 16: Heo thịt, giá thấp số lượng nhiều
(gen_random_uuid(), '2025-10-25',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Long An'),
    (SELECT id FROM customers WHERE name = 'Cơ sở chế biến thịt Minh Tâm'),
    'heo_thit', 45, 4950, 110, 52000, 257400000, 0, 0, 0, 257400000, 100000000, 157400000, 0, 257400000, 0, 0, 'Giá thấp nhưng số lượng lớn', NOW(), NOW()),

-- Giao dịch 17: Heo thịt, cuối tháng
(gen_random_uuid(), '2025-10-28',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Bình Dương'),
    (SELECT id FROM customers WHERE name = 'Công ty TNHH Xuất nhập khẩu Agri'),
    'heo_thit', 32, 3520, 110, 60000, 211200000, 0, 0, 0, 211200000, 0, 211200000, 0, 211200000, 0, 0, 'Giao dịch cuối tháng 10', NOW(), NOW()),

-- Giao dịch 18: Heo thịt, thanh toán dư nhẹ
(gen_random_uuid(), '2025-10-30',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Đồng Nai'),
    (SELECT id FROM customers WHERE name = 'Thương lái Lý Văn Tâm'),
    'heo_thit', 19, 2090, 110, 57000, 119130000, 0, 0, 0, 119130000, 120000000, 0, 0, 120000000, 0, 870000, 'Khách trả dư 870k', NOW(), NOW()),

-- Giao dịch 19: Heo thịt, ngày 31
(gen_random_uuid(), '2025-10-31',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Tiền Giang'),
    (SELECT id FROM customers WHERE name = 'Thương lái Hồ Thị Lan'),
    'heo_thit', 11, 1210, 110, 55000, 66550000, 0, 0, 0, 66550000, 66550000, 0, 0, 66550000, 0, 0, 'Giao dịch cuối cùng tháng 10', NOW(), NOW()),

-- Giao dịch heo con (heo_con) - Bắt đầu từ đây
-- Giao dịch 20: Heo con, thanh toán đủ tiền mặt
(gen_random_uuid(), '2025-10-01',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Vĩnh Long'),
    (SELECT id FROM customers WHERE name = 'Trang trại Heo Hoàng Gia'),
    'heo_con', 50, 500, 10, 1000000, 50000000, 25, 50000, 1250000, 51250000, 51250000, 0, 0, 51250000, 0, 0, 'Heo con 10kg, dư 25kg', NOW(), NOW()),

-- Giao dịch 21: Heo con, thanh toán chuyển khoản
(gen_random_uuid(), '2025-10-03',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo An Giang'),
    (SELECT id FROM customers WHERE name = 'Thương lái Nguyễn Thị Mai'),
    'heo_con', 80, 960, 12, 1100000, 88000000, 40, 55000, 2200000, 90200000, 0, 90200000, 0, 90200000, 0, 0, 'Heo con 12kg, dư 40kg', NOW(), NOW()),

-- Giao dịch 22: Heo con, thanh toán công nợ
(gen_random_uuid(), '2025-10-05',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Bình Thuận'),
    (SELECT id FROM customers WHERE name = 'Trang trại Heo Thái Sơn'),
    'heo_con', 120, 1560, 13, 1200000, 144000000, 60, 60000, 3600000, 147600000, 0, 0, 100000000, 100000000, 47600000, 0, 'Heo con 13kg, còn nợ 47.6 triệu', NOW(), NOW()),

-- Giao dịch 23: Heo con, thanh toán hỗn hợp
(gen_random_uuid(), '2025-10-07',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Khánh Hòa'),
    (SELECT id FROM customers WHERE name = 'Thương lái Trương Thị Hồng'),
    'heo_con', 30, 300, 10, 950000, 28500000, 15, 48000, 720000, 29220000, 15000000, 14220000, 0, 29220000, 0, 0, 'Heo con nhỏ, thanh toán tiền mặt + chuyển khoản', NOW(), NOW()),

-- Giao dịch 24: Heo con, số lượng lớn
(gen_random_uuid(), '2025-10-09',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Bình Định'),
    (SELECT id FROM customers WHERE name = 'Công ty CP Chăn nuôi Miền Nam'),
    'heo_con', 150, 2100, 14, 1300000, 195000000, 75, 65000, 4875000, 199875000, 100000000, 99875000, 0, 199875000, 0, 0, 'Heo con giống cao cấp 14kg', NOW(), NOW()),

-- Giao dịch 25: Heo con, thanh toán đủ tiền mặt
(gen_random_uuid(), '2025-10-11',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Phú Yên'),
    (SELECT id FROM customers WHERE name = 'Thương lái Dương Văn Phong'),
    'heo_con', 60, 660, 11, 1050000, 63000000, 30, 52000, 1560000, 64560000, 64560000, 0, 0, 64560000, 0, 0, 'Heo con 11kg, thanh toán đủ', NOW(), NOW()),

-- Giao dịch 26: Heo con, nợ toàn bộ
(gen_random_uuid(), '2025-10-13',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Bến Tre'),
    (SELECT id FROM customers WHERE name = 'Thương lái Hồ Thị Lan'),
    'heo_con', 90, 990, 11, 1080000, 97200000, 45, 54000, 2430000, 99630000, 0, 0, 0, 0, 99630000, 0, 'Heo con 11kg, khách nợ toàn bộ', NOW(), NOW()),

-- Giao dịch 27: Heo con, thanh toán công ty
(gen_random_uuid(), '2025-10-15',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Trà Vinh'),
    (SELECT id FROM customers WHERE name = 'Công ty CP Thực phẩm Việt Nam'),
    'heo_con', 100, 1300, 13, 1250000, 125000000, 50, 62000, 3100000, 128100000, 0, 0, 128100000, 128100000, 0, 0, 'Heo con 13kg, thanh toán công ty', NOW(), NOW()),

-- Giao dịch 28: Heo con, thanh toán dư
(gen_random_uuid(), '2025-10-17',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Sóc Trăng'),
    (SELECT id FROM customers WHERE name = 'Trang trại Heo Thái Sơn'),
    'heo_con', 45, 495, 11, 1150000, 51750000, 22, 58000, 1276000, 53026000, 55000000, 0, 0, 55000000, 0, 1974000, 'Heo con 11kg, khách trả dư', NOW(), NOW()),

-- Giao dịch 29: Heo con, giá cao
(gen_random_uuid(), '2025-10-19',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Phú Mỹ'),
    (SELECT id FROM customers WHERE name = 'Công ty TNHH Chăn nuôi ABC'),
    'heo_con', 70, 980, 14, 1400000, 98000000, 35, 70000, 2450000, 100450000, 0, 100450000, 0, 100450000, 0, 0, 'Heo con 14kg giá cao', NOW(), NOW()),

-- Giao dịch 30: Heo con, số lượng trung bình
(gen_random_uuid(), '2025-10-21',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Long An'),
    (SELECT id FROM customers WHERE name = 'Thương lái Nguyễn Văn Bình'),
    'heo_con', 55, 605, 11, 1020000, 56100000, 27, 51000, 1377000, 57477000, 30000000, 27477000, 0, 57477000, 0, 0, 'Heo con 11kg, thanh toán tiền mặt + chuyển khoản', NOW(), NOW()),

-- Giao dịch 31: Heo con, nợ một phần
(gen_random_uuid(), '2025-10-23',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Bình Dương'),
    (SELECT id FROM customers WHERE name = 'Thương lái Trần Thị Lan'),
    'heo_con', 85, 1020, 12, 1120000, 95200000, 42, 56000, 2352000, 97552000, 50000000, 0, 0, 50000000, 47552000, 0, 'Heo con 12kg, còn nợ 47.5 triệu', NOW(), NOW()),

-- Giao dịch 32: Heo con, thanh toán đủ
(gen_random_uuid(), '2025-10-25',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Đồng Nai'),
    (SELECT id FROM customers WHERE name = 'Cơ sở giết mổ An Phú'),
    'heo_con', 40, 480, 12, 980000, 39200000, 20, 49000, 980000, 40180000, 0, 0, 40180000, 40180000, 0, 0, 'Heo con 12kg, thanh toán công ty', NOW(), NOW()),

-- Giao dịch 33: Heo con, giá thấp số lượng nhiều
(gen_random_uuid(), '2025-10-27',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Tiền Giang'),
    (SELECT id FROM customers WHERE name = 'Chợ đầu mối Thủ Đức'),
    'heo_con', 180, 2160, 12, 900000, 162000000, 90, 45000, 4050000, 166050000, 80000000, 86050000, 0, 166050000, 0, 0, 'Heo con 12kg giá thấp, số lượng lớn', NOW(), NOW()),

-- Giao dịch 34: Heo con, cuối tháng
(gen_random_uuid(), '2025-10-29',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo Vĩnh Long'),
    (SELECT id FROM customers WHERE name = 'Thương lái Lê Văn Hùng'),
    'heo_con', 35, 385, 11, 1060000, 37100000, 17, 53000, 901000, 38001000, 38001000, 0, 0, 38001000, 0, 0, 'Heo con 11kg, thanh toán đủ tiền mặt', NOW(), NOW()),

-- Giao dịch 35: Heo con, ngày 30
(gen_random_uuid(), '2025-10-30',
    (SELECT id FROM farms WHERE name = 'Trang trại Heo An Giang'),
    (SELECT id FROM customers WHERE name = 'Thương lái Phạm Thị Hoa'),
    'heo_con', 65, 780, 12, 1180000, 76700000, 32, 59000, 1888000, 78588000, 40000000, 38588000, 0, 78588000, 0, 0, 'Heo con 12kg, thanh toán tiền mặt + chuyển khoản', NOW(), NOW());

-- =====================================================
-- 5. INSERT PAYMENTS - Thanh toán
-- =====================================================

INSERT INTO payments (id, transaction_id, customer_id, payment_date, amount, method, notes, created_at) VALUES
-- Thanh toán cho giao dịch có công nợ
(gen_random_uuid(), 
    (SELECT id FROM transactions WHERE notes = 'Khách hàng công nợ 34.8 triệu' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Công ty CP Chăn nuôi Miền Nam'),
    '2025-10-10', 34800000, 'bank', 'Thanh toán nợ giao dịch 03/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Khách hàng nợ toàn bộ' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Thương lái Trần Thị Lan'),
    '2025-10-15', 50000000, 'cash', 'Trả nợ một phần giao dịch 07/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Khách hàng nợ toàn bộ' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Thương lái Trần Thị Lan'),
    '2025-10-25', 56920000, 'bank', 'Trả nợ còn lại giao dịch 07/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Còn nợ 53.1 triệu' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Thương lái Phạm Thị Hoa'),
    '2025-10-20', 30000000, 'cash', 'Trả nợ một phần giao dịch 14/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Còn nợ 53.1 triệu' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Thương lái Phạm Thị Hoa'),
    '2025-10-28', 23100000, 'bank', 'Trả nợ còn lại giao dịch 14/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Khách hẹn trả sau 15 ngày' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Thương lái Nguyễn Thị Mai'),
    '2025-11-05', 66700000, 'bank', 'Thanh toán đủ giao dịch 20/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Heo con 13kg, còn nợ 47.6 triệu' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Trang trại Heo Thái Sơn'),
    '2025-10-20', 25000000, 'cash', 'Trả nợ một phần giao dịch 05/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Heo con 13kg, còn nợ 47.6 triệu' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Trang trại Heo Thái Sơn'),
    '2025-10-30', 22600000, 'bank', 'Trả nợ còn lại giao dịch 05/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Heo con 11kg, khách nợ toàn bộ' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Thương lái Hồ Thị Lan'),
    '2025-10-25', 50000000, 'cash', 'Trả nợ một phần giao dịch 13/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Heo con 11kg, khách nợ toàn bộ' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Thương lái Hồ Thị Lan'),
    '2025-11-02', 49630000, 'bank', 'Trả nợ còn lại giao dịch 13/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Heo con 12kg, còn nợ 47.5 triệu' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Thương lái Trần Thị Lan'),
    '2025-10-28', 25000000, 'cash', 'Trả nợ một phần giao dịch 23/10', NOW()),

(gen_random_uuid(),
    (SELECT id FROM transactions WHERE notes = 'Heo con 12kg, còn nợ 47.5 triệu' LIMIT 1),
    (SELECT id FROM customers WHERE name = 'Thương lái Trần Thị Lan'),
    '2025-11-03', 22552000, 'bank', 'Trả nợ còn lại giao dịch 23/10', NOW()),

-- Thanh toán không liên quan đến giao dịch cụ thể (trả nợ cũ)
(gen_random_uuid(),
    NULL,
    (SELECT id FROM customers WHERE name = 'Công ty CP Chăn nuôi Miền Nam'),
    '2025-10-05', 20000000, 'bank', 'Thanh toán nợ cũ tháng 9', NOW()),

(gen_random_uuid(),
    NULL,
    (SELECT id FROM customers WHERE name = 'Thương lái Nguyễn Văn Bình'),
    '2025-10-12', 15000000, 'cash', 'Thanh toán nợ cũ', NOW()),

(gen_random_uuid(),
    NULL,
    (SELECT id FROM customers WHERE name = 'Cơ sở giết mổ Hòa Phát'),
    '2025-10-18', 30000000, 'company', 'Thanh toán nợ cũ qua công ty', NOW()),

(gen_random_uuid(),
    NULL,
    (SELECT id FROM customers WHERE name = 'Trang trại Heo Hoàng Gia'),
    '2025-10-22', 10000000, 'cash', 'Thanh toán nợ cũ', NOW()),

(gen_random_uuid(),
    NULL,
    (SELECT id FROM customers WHERE name = 'Thương lái Lý Văn Tâm'),
    '2025-10-15', 8000000, 'bank', 'Thanh toán nợ cũ', NOW()),

(gen_random_uuid(),
    NULL,
    (SELECT id FROM customers WHERE name = 'Công ty TNHH Thực phẩm Sạch'),
    '2025-10-25', 25000000, 'company', 'Thanh toán nợ cũ tháng 9', NOW()),

(gen_random_uuid(),
    NULL,
    (SELECT id FROM customers WHERE name = 'Thương lái Võ Thị Thanh'),
    '2025-10-20', 12000000, 'cash', 'Thanh toán nợ cũ', NOW());

-- =====================================================
-- 6. KIỂM TRA DỮ LIỆU (Verification)
-- =====================================================

-- Kiểm tra số lượng bản ghi trong mỗi bảng
SELECT 'FARMS' as table_name, COUNT(*) as record_count FROM farms
UNION ALL
SELECT 'CUSTOMERS' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'TRANSACTIONS' as table_name, COUNT(*) as record_count FROM transactions
UNION ALL
SELECT 'PAYMENTS' as table_name, COUNT(*) as record_count FROM payments;

-- Kiểm tra tổng doanh thu theo loại sản phẩm
SELECT 
    product_type,
    COUNT(*) as transaction_count,
    SUM(total_invoice) as total_revenue,
    SUM(total_paid) as total_paid,
    SUM(outstanding_debt) as total_outstanding
FROM transactions
GROUP BY product_type;

-- Kiểm tra tổng thanh toán theo phương thức
SELECT 
    method,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount
FROM payments
GROUP BY method;

COMMIT;
