-- Migration: Create job_products table
-- Date: 2025-10-29

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create job_products table
CREATE TABLE IF NOT EXISTS job_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,
    applicant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    files JSONB[] DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rejected', 'approved')),
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to jobs table
    CONSTRAINT fk_job_products_job
        FOREIGN KEY (job_id) 
        REFERENCES jobs(id) 
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_title_length CHECK (char_length(title) >= 3),
    CONSTRAINT chk_rejection_reason_required 
        CHECK (
            (status = 'rejected' AND rejection_reason IS NOT NULL) OR 
            (status != 'rejected')
        )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_products_job_id ON job_products(job_id);
CREATE INDEX IF NOT EXISTS idx_job_products_applicant_id ON job_products(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_products_status ON job_products(status);
CREATE INDEX IF NOT EXISTS idx_job_products_job_status ON job_products(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_products_created_at ON job_products(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_job_products_updated_at ON job_products;
CREATE TRIGGER trigger_update_job_products_updated_at
    BEFORE UPDATE ON job_products
    FOR EACH ROW
    EXECUTE FUNCTION update_job_products_updated_at();

-- Add comments for documentation
COMMENT ON TABLE job_products IS 'Stores job deliverables/products uploaded by freelancers for employer review';
COMMENT ON COLUMN job_products.id IS 'Unique identifier for the job product';
COMMENT ON COLUMN job_products.job_id IS 'Reference to the job this product belongs to';
COMMENT ON COLUMN job_products.applicant_id IS 'Freelancer who uploaded this product (Supabase user ID)';
COMMENT ON COLUMN job_products.title IS 'Title of the job product';
COMMENT ON COLUMN job_products.description IS 'Detailed description of the job product';
COMMENT ON COLUMN job_products.files IS 'Array of file metadata (name, path, size, mimetype)';
COMMENT ON COLUMN job_products.status IS 'Review status: pending, rejected, approved';
COMMENT ON COLUMN job_products.rejection_reason IS 'Reason for rejection if status is rejected';
COMMENT ON COLUMN job_products.reviewed_at IS 'Timestamp when the product was reviewed';
COMMENT ON COLUMN job_products.reviewed_by IS 'Employer who reviewed this product (Supabase user ID)';
