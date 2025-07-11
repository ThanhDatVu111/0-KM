-- Add anniversary field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS anniversary_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN users.anniversary_date IS 'User''s anniversary date (when they started dating)'; 