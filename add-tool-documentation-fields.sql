-- Add comprehensive technical documentation fields to tools table

-- Architecture & Documentation
ALTER TABLE tools
ADD COLUMN IF NOT EXISTS architecture TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS tech_stack TEXT,
ADD COLUMN IF NOT EXISTS hosting_provider TEXT,
ADD COLUMN IF NOT EXISTS hosting_details TEXT,
ADD COLUMN IF NOT EXISTS demo_username TEXT,
ADD COLUMN IF NOT EXISTS demo_password TEXT,
ADD COLUMN IF NOT EXISTS demo_url TEXT,
ADD COLUMN IF NOT EXISTS environment_variables JSONB DEFAULT '[]'::jsonb;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tools' 
AND column_name IN (
    'architecture', 
    'language', 
    'tech_stack', 
    'hosting_provider', 
    'hosting_details',
    'demo_username', 
    'demo_password',
    'demo_url',
    'environment_variables'
)
ORDER BY column_name;
