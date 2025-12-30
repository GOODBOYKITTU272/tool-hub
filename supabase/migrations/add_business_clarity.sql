-- Create tool_business_clarity table for documenting product rationale
CREATE TABLE IF NOT EXISTS tool_business_clarity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    
    -- Product & Business Clarity
    why_building TEXT,
    problem_statement TEXT,
    target_audience TEXT,
    company_usage TEXT,
    revenue_model TEXT,
    
    -- User & Workflow Understanding
    primary_user TEXT,
    user_persona TEXT,
    end_to_end_workflow TEXT,
    challenges_risks TEXT,
    success_metrics TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tool_id)
);

-- Enable RLS
ALTER TABLE tool_business_clarity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view business clarity for visible tools
CREATE POLICY "Users can view business clarity for visible tools"
ON tool_business_clarity FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tools
        WHERE tools.id = tool_business_clarity.tool_id
        AND (tools.status = 'approved' OR tools.owner_id = auth.uid())
    )
);

-- Policy: Owners can manage their tool's business clarity
CREATE POLICY "Owners can manage their tool business clarity"
ON tool_business_clarity FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tools
        WHERE tools.id = tool_business_clarity.tool_id
        AND tools.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tools
        WHERE tools.id = tool_business_clarity.tool_id
        AND tools.owner_id = auth.uid()
    )
);

-- Policy: Admins can manage all business clarity
CREATE POLICY "Admins can manage all business clarity"
ON tool_business_clarity FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'Admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'Admin'
    )
);

-- Create index for performance
CREATE INDEX idx_tool_business_clarity_tool_id ON tool_business_clarity(tool_id);

-- Verify the table was created
SELECT tablename FROM pg_tables WHERE tablename = 'tool_business_clarity';
