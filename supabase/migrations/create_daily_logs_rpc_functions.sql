-- Migration: Create RPC functions for daily logs to bypass RLS
-- These functions are called from DailyJournal.tsx to handle daily log operations

BEGIN;

-- Drop existing functions if they exist (handles changes to return types)
DROP FUNCTION IF EXISTS get_user_daily_logs(UUID);
DROP FUNCTION IF EXISTS insert_daily_log(UUID, DATE, TEXT, UUID, UUID, TEXT, TEXT, TEXT);

-- Function to get all daily logs for a user (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_daily_logs(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  date DATE,
  tasks_completed TEXT,
  blockers TEXT,
  collaboration_notes TEXT,
  work_type TEXT,
  tool_id UUID,
  tool_owner_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    id,
    user_id,
    date,
    tasks_completed,
    blockers,
    collaboration_notes,
    work_type,
    tool_id,
    tool_owner_id,
    created_at,
    updated_at
  FROM daily_logs
  WHERE daily_logs.user_id = p_user_id
  ORDER BY date DESC, created_at DESC;
$$;

-- Function to insert a daily log (bypasses RLS)
CREATE OR REPLACE FUNCTION insert_daily_log(
  p_user_id UUID,
  p_date DATE,
  p_work_type TEXT,
  p_tool_id UUID,
  p_tool_owner_id UUID,
  p_tasks_completed TEXT,
  p_blockers TEXT DEFAULT '',
  p_collaboration_notes TEXT DEFAULT ''
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Validate work_type
  IF p_work_type NOT IN ('own_tool', 'others_tool') THEN
    RAISE EXCEPTION 'Invalid work_type. Must be own_tool or others_tool';
  END IF;

  -- Validate tool_id is provided
  IF p_tool_id IS NULL THEN
    RAISE EXCEPTION 'tool_id is required';
  END IF;

  -- Validate owner logic
  IF p_work_type = 'own_tool' AND p_tool_owner_id != p_user_id THEN
    RAISE EXCEPTION 'For own_tool, tool_owner_id must match user_id';
  END IF;

  IF p_work_type = 'others_tool' AND (p_tool_owner_id IS NULL OR p_tool_owner_id = p_user_id) THEN
    RAISE EXCEPTION 'For others_tool, tool_owner_id must be provided and different from user_id';
  END IF;

  -- Insert the log
  INSERT INTO daily_logs (
    user_id,
    date,
    work_type,
    tool_id,
    tool_owner_id,
    tasks_completed,
    blockers,
    collaboration_notes
  ) VALUES (
    p_user_id,
    p_date,
    p_work_type,
    p_tool_id,
    p_tool_owner_id,
    p_tasks_completed,
    COALESCE(p_blockers, ''),
    COALESCE(p_collaboration_notes, '')
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_daily_logs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_daily_log(UUID, DATE, TEXT, UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION get_user_daily_logs IS 'Retrieves all daily logs for a specific user, bypassing RLS';
COMMENT ON FUNCTION insert_daily_log IS 'Inserts a new daily log entry with validation, bypassing RLS';

COMMIT;
