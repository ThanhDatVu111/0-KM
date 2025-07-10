-- Add timezone and location fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_country VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN users.timezone IS 'User''s timezone (e.g., America/New_York)';
COMMENT ON COLUMN users.location_latitude IS 'User''s location latitude';
COMMENT ON COLUMN users.location_longitude IS 'User''s location longitude';
COMMENT ON COLUMN users.location_city IS 'User''s city name';
COMMENT ON COLUMN users.location_country IS 'User''s country name'; 