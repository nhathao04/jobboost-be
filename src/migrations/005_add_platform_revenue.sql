-- Migration: Add platform fee tracking
-- Created: 2025-10-28

-- 1. Thêm cột platform_fee vào wallet_transactions
ALTER TABLE wallet_transactions 
ADD COLUMN platform_fee DECIMAL(15, 2) DEFAULT 0 
COMMENT 'Phí nền tảng (% được giữ lại bởi platform)';

-- 2. Tạo bảng platform_revenue để tracking lợi nhuận
CREATE TABLE IF NOT EXISTS platform_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Thông tin giao dịch
  transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  
  -- Số tiền
  total_amount DECIMAL(15, 2) NOT NULL COMMENT 'Tổng số tiền của job',
  fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 8.00 COMMENT 'Phần trăm phí (%)',
  fee_amount DECIMAL(15, 2) NOT NULL COMMENT 'Số tiền phí thu được',
  freelancer_amount DECIMAL(15, 2) NOT NULL COMMENT 'Số tiền freelancer nhận được',
  
  -- Metadata
  freelancer_id UUID NOT NULL COMMENT 'ID của freelancer',
  employer_id UUID NOT NULL COMMENT 'ID của employer',
  revenue_type VARCHAR(50) DEFAULT 'JOB_COMPLETION' COMMENT 'Loại doanh thu',
  
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tạo indexes cho performance
CREATE INDEX idx_platform_revenues_created_at ON platform_revenues(created_at);
CREATE INDEX idx_platform_revenues_job_id ON platform_revenues(job_id);
CREATE INDEX idx_platform_revenues_freelancer_id ON platform_revenues(freelancer_id);
CREATE INDEX idx_platform_revenues_employer_id ON platform_revenues(employer_id);
CREATE INDEX idx_platform_revenues_revenue_type ON platform_revenues(revenue_type);

-- 4. Tạo view để dễ query tổng doanh thu
CREATE OR REPLACE VIEW platform_revenue_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_job_amount,
  SUM(fee_amount) as total_platform_revenue,
  SUM(freelancer_amount) as total_freelancer_payment,
  AVG(fee_percentage) as avg_fee_percentage
FROM platform_revenues
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- 5. Comments
COMMENT ON TABLE platform_revenues IS 'Bảng lưu trữ lợi nhuận của nền tảng từ các giao dịch';
COMMENT ON COLUMN platform_revenues.fee_percentage IS 'Phần trăm phí, mặc định 8%';
COMMENT ON COLUMN platform_revenues.fee_amount IS 'Số tiền phí thực tế thu được (total_amount * fee_percentage / 100)';
