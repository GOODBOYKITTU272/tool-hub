-- Add code_walkthrough column to tools table
ALTER TABLE tools ADD COLUMN IF NOT EXISTS code_walkthrough text;

-- Add comment for KT
COMMENT ON COLUMN tools.code_walkthrough IS 'Detailed technical guide and KT documentation provided by the Tool Owner.';
