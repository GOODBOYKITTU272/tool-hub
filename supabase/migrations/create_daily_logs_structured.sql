-- Create daily_logs table with structured tool selection
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Work content
  tasks_completed TEXT NOT NULL,
  blockers TEXT,
  collaboration_notes TEXT,
  
  -- Structured tool/project tracking
  work_type TEXT NOT NULL CHECK (work_type IN ('own_tool', 'others_tool')),
  tool_id UUID REFERENCES tools(id) ON DELETE SET NULL,
  tool_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT one_log_per_user_per_day UNIQUE(user_id, date),
  CONSTRAINT tool_required CHECK (tool_id IS NOT NULL),
  CONSTRAINT owner_required_for_collaboration CHECK (
    (work_type = 'own_tool' AND tool_owner_id = user_id) OR
    (work_type = 'others_tool' AND tool_owner_id IS NOT NULL AND tool_owner_id != user_id)
  )
);

-- Indexes for better query performance
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date DESC);
CREATE INDEX idx_daily_logs_tool_id ON daily_logs(tool_id);
CREATE INDEX idx_daily_logs_work_type ON daily_logs(work_type);
CREATE INDEX idx_daily_logs_collaboration ON daily_logs(tool_owner_id) WHERE work_type = 'others_tool';

-- Row Level Security (RLS)
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own logs"
  ON daily_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert own logs"
  ON daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own logs
CREATE POLICY "Users can update own logs"
  ON daily_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own logs
CREATE POLICY "Users can delete own logs"
  ON daily_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Admins can view all logs (for analytics/reports)
CREATE POLICY "Admins can view all logs"
  ON daily_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
    )
  );

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_logs_updated_at();

-- Comments for documentation
COMMENT ON TABLE daily_logs IS 'Daily work logs for team members (Monday-Friday, Admin & Owner roles only)';
COMMENT ON COLUMN daily_logs.work_type IS 'Type of work: own_tool (working on own project) or others_tool (collaboration)';
COMMENT ON COLUMN daily_logs.tool_id IS 'Reference to the tool being worked on';
COMMENT ON COLUMN daily_logs.tool_owner_id IS 'Owner of the tool - must match user_id for own_tool, must be different for others_tool';
COMMENT ON COLUMN daily_logs.collaboration_notes IS 'Details about collaboration (only relevant when work_type = others_tool)';
