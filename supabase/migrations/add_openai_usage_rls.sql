-- Enable RLS on openai_usage table
ALTER TABLE openai_usage ENABLE ROW LEVEL SECURITY;

-- Admins can view all usage data
CREATE POLICY "admins_view_usage"
  ON openai_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
    )
  );

-- Service role can insert usage records  
CREATE POLICY "service_insert_usage"
  ON openai_usage FOR INSERT
  TO service_role
  WITH CHECK (true);
