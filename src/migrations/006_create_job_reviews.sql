-- Migration: Create Job Reviews Table
-- Created: 2025-10-28
-- Purpose: Review giữa employer và freelancer sau khi hoàn thành job

-- Drop table if exists
DROP TABLE IF EXISTS job_reviews CASCADE;

-- Create job_reviews table
CREATE TABLE IF NOT EXISTS job_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job/Project information
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- People involved
  employer_id UUID NOT NULL COMMENT 'ID của employer (job owner)',
  freelancer_id UUID NOT NULL COMMENT 'ID của freelancer (người làm)',
  reviewer_id UUID NOT NULL COMMENT 'ID của người đánh giá (employer hoặc freelancer)',
  reviewer_role VARCHAR(20) NOT NULL CHECK (reviewer_role IN ('EMPLOYER', 'FREELANCER')),
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_review_per_job_reviewer UNIQUE (job_id, reviewer_id)
);

-- Create indexes
CREATE INDEX idx_job_reviews_job_id ON job_reviews(job_id);
CREATE INDEX idx_job_reviews_employer_id ON job_reviews(employer_id);
CREATE INDEX idx_job_reviews_freelancer_id ON job_reviews(freelancer_id);
CREATE INDEX idx_job_reviews_reviewer_id ON job_reviews(reviewer_id);
CREATE INDEX idx_job_reviews_rating ON job_reviews(rating);
CREATE INDEX idx_job_reviews_created_at ON job_reviews(created_at);

-- Comments
COMMENT ON TABLE job_reviews IS 'Bảng lưu đánh giá giữa employer và freelancer sau khi hoàn thành job';
COMMENT ON COLUMN job_reviews.reviewer_role IS 'EMPLOYER: employer đánh giá freelancer, FREELANCER: freelancer đánh giá employer';
COMMENT ON COLUMN job_reviews.rating IS 'Đánh giá từ 1-5 sao';

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_job_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_reviews_updated_at
BEFORE UPDATE ON job_reviews
FOR EACH ROW
EXECUTE FUNCTION update_job_reviews_updated_at();
