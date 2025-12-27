-- Migration: Allow multiple logs per day
-- Removes one-log-per-day constraint and adds unique constraint per tool

BEGIN;

-- Drop the old constraint that limits to one log per user per day
ALTER TABLE daily_logs 
DROP CONSTRAINT IF EXISTS one_log_per_user_per_day;

-- Add new constraint: allows multiple logs per day, but prevents duplicate tool entries
-- This means a user can log multiple different tools in one day, but not the same tool twice
ALTER TABLE daily_logs
ADD CONSTRAINT unique_user_date_tool 
UNIQUE (user_id, date, tool_id);

-- Add index for faster queries when fetching all logs for a specific date
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date 
ON daily_logs(user_id, date DESC);

COMMIT;

COMMENT ON CONSTRAINT unique_user_date_tool ON daily_logs IS 
'Allows multiple logs per day but prevents duplicate tool entries on same day';
