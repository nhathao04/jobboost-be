-- Migration: Create platform_reviews table
-- Description: Bảng lưu trữ đánh giá của users về nền tảng

CREATE TABLE IF NOT EXISTS platform_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('FREELANCER', 'EMPLOYER')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    aspects JSONB,
    completed_jobs_count INTEGER DEFAULT 0,
    total_earned DECIMAL(15, 2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    admin_response TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'reported', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_platform_reviews_user_id ON platform_reviews(user_id);
CREATE INDEX idx_platform_reviews_user_role ON platform_reviews(user_role);
CREATE INDEX idx_platform_reviews_rating ON platform_reviews(rating);
CREATE INDEX idx_platform_reviews_is_verified ON platform_reviews(is_verified);
CREATE INDEX idx_platform_reviews_status ON platform_reviews(status);
CREATE INDEX idx_platform_reviews_created_at ON platform_reviews(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_reviews_updated_at
    BEFORE UPDATE ON platform_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_reviews_updated_at();

-- Comments
COMMENT ON TABLE platform_reviews IS 'Bảng lưu trữ đánh giá của users về nền tảng JobBoost';
COMMENT ON COLUMN platform_reviews.user_id IS 'ID của user (freelancer hoặc employer) đánh giá';
COMMENT ON COLUMN platform_reviews.user_role IS 'Vai trò của người đánh giá: FREELANCER hoặc EMPLOYER';
COMMENT ON COLUMN platform_reviews.rating IS 'Đánh giá từ 1-5 sao';
COMMENT ON COLUMN platform_reviews.comment IS 'Nội dung đánh giá chi tiết';
COMMENT ON COLUMN platform_reviews.aspects IS 'Đánh giá chi tiết các khía cạnh (JSON): user_interface, job_quality, support, payment, etc.';
COMMENT ON COLUMN platform_reviews.completed_jobs_count IS 'Số lượng job đã hoàn thành khi đánh giá (để tham khảo độ tin cậy)';
COMMENT ON COLUMN platform_reviews.total_earned IS 'Tổng số tiền kiếm được/chi tiêu trên nền tảng (để tham khảo)';
COMMENT ON COLUMN platform_reviews.is_verified IS 'Đánh giá đã được xác thực (từ user có hoạt động thực tế)';
COMMENT ON COLUMN platform_reviews.is_visible IS 'Hiển thị đánh giá này ra ngoài';
COMMENT ON COLUMN platform_reviews.helpful_count IS 'Số lượng người thấy đánh giá này hữu ích';
COMMENT ON COLUMN platform_reviews.admin_response IS 'Phản hồi từ admin (nếu có)';
COMMENT ON COLUMN platform_reviews.status IS 'Trạng thái: active, hidden, reported, removed';
