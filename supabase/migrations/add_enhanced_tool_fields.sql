-- Migration: Add 29 enhanced fields to tools table
-- This migration adds comprehensive tool documentation fields

BEGIN;

-- ============================================
-- OVERVIEW TAB FIELDS (5 new fields)
-- ============================================

-- Status: Live, In Development, Maintenance, or Deprecated
ALTER TABLE tools ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_development' 
  CHECK (status IN ('live', 'in_development', 'maintenance', 'deprecated'));

-- Purpose: Why does this tool exist? (10-500 chars)
ALTER TABLE tools ADD COLUMN IF NOT EXISTS purpose TEXT 
  CHECK (purpose IS NULL OR (LENGTH(purpose) >= 10 AND LENGTH(purpose) <= 500));

-- Primary Users: Who uses this tool?
ALTER TABLE tools ADD COLUMN IF NOT EXISTS primary_users TEXT;

-- Updated At: Auto-updated timestamp
ALTER TABLE tools ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Enhanced Category with CHECK constraint
ALTER TABLE tools DROP CONSTRAINT IF EXISTS tools_category_check;
ALTER TABLE tools ADD CONSTRAINT tools_category_check 
  CHECK (category IS NULL OR category IN ('internal_tool', 'customer_facing', 'analytics', 'automation', 'integration', 'other'));

-- ============================================
-- ARCHITECTURE TAB FIELDS (5 new fields)
-- ============================================

-- System Diagram URL
ALTER TABLE tools ADD COLUMN IF NOT EXISTS system_diagram_url TEXT 
  CHECK (system_diagram_url IS NULL OR system_diagram_url ~ '^https?://');

-- Database Info: Which database(s) are used?
ALTER TABLE tools ADD COLUMN IF NOT EXISTS database_info TEXT;

-- Key Dependencies: What does this tool depend on?
ALTER TABLE tools ADD COLUMN IF NOT EXISTS key_dependencies TEXT;

-- Data Flow: How does data move through the system?
ALTER TABLE tools ADD COLUMN IF NOT EXISTS data_flow TEXT;

-- Third-Party Services: External services used
ALTER TABLE tools ADD COLUMN IF NOT EXISTS third_party_services TEXT;

-- ============================================
-- LANGUAGE & TECH TAB FIELDS (5 new fields)
-- ============================================

-- Frontend Stack: React, Vue, etc.
ALTER TABLE tools ADD COLUMN IF NOT EXISTS frontend_stack TEXT;

-- Backend Stack: Node.js, Python, etc.
ALTER TABLE tools ADD COLUMN IF NOT EXISTS backend_stack TEXT;

-- Package Manager: npm, yarn, pnpm
ALTER TABLE tools ADD COLUMN IF NOT EXISTS package_manager TEXT 
  CHECK (package_manager IS NULL OR package_manager IN ('npm', 'yarn', 'pnpm', 'other'));

-- Node Version: Required Node.js version
ALTER TABLE tools ADD COLUMN IF NOT EXISTS node_version TEXT;

-- Build Tool: Vite, Webpack, etc.
ALTER TABLE tools ADD COLUMN IF NOT EXISTS build_tool TEXT;

-- ============================================
-- HOSTING TAB FIELDS (6 new fields)
-- ============================================

-- Production URL: Live tool link
ALTER TABLE tools ADD COLUMN IF NOT EXISTS production_url TEXT 
  CHECK (production_url IS NULL OR production_url ~ '^https?://');

-- Staging URL: Staging environment link
ALTER TABLE tools ADD COLUMN IF NOT EXISTS staging_url TEXT 
  CHECK (staging_url IS NULL OR staging_url ~ '^https?://');

-- Deployment Method: How is it deployed?
ALTER TABLE tools ADD COLUMN IF NOT EXISTS deployment_method TEXT;

-- CI/CD Pipeline: GitHub Actions, etc.
ALTER TABLE tools ADD COLUMN IF NOT EXISTS cicd_pipeline TEXT;

-- Monitoring Tools: Sentry, Analytics, etc.
ALTER TABLE tools ADD COLUMN IF NOT EXISTS monitoring_tools TEXT;

-- Backup Strategy: How is data backed up?
ALTER TABLE tools ADD COLUMN IF NOT EXISTS backup_strategy TEXT;

-- ============================================
-- DEMO LOGIN TAB FIELDS (3 new fields)
-- ============================================

-- Demo Account Type: Admin, User, etc.
ALTER TABLE tools ADD COLUMN IF NOT EXISTS demo_account_type TEXT;

-- Demo Data Reset Schedule: When is demo data reset?
ALTER TABLE tools ADD COLUMN IF NOT EXISTS demo_data_reset_schedule TEXT;

-- Demo Limitations: What doesn't work in demo?
ALTER TABLE tools ADD COLUMN IF NOT EXISTS demo_limitations TEXT;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_updated_at ON tools(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category) WHERE category IS NOT NULL;

-- ============================================
-- CREATE TRIGGER FOR AUTO-UPDATING updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tools_updated_at ON tools;

CREATE TRIGGER trigger_update_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW
  EXECUTE FUNCTION update_tools_updated_at();

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN tools.status IS 'Tool status: live, in_development, maintenance, or deprecated';
COMMENT ON COLUMN tools.purpose IS 'Why does this tool exist? Business purpose and value proposition';
COMMENT ON COLUMN tools.primary_users IS 'Who uses this tool? Target audience';
COMMENT ON COLUMN tools.updated_at IS 'Auto-updated timestamp when tool info is modified';

COMMENT ON COLUMN tools.system_diagram_url IS 'URL to system architecture diagram';
COMMENT ON COLUMN tools.database_info IS 'Which database(s) are used';
COMMENT ON COLUMN tools.key_dependencies IS 'What does this tool depend on';
COMMENT ON COLUMN tools.data_flow IS 'How data moves through the system';
COMMENT ON COLUMN tools.third_party_services IS 'External services used';

COMMENT ON COLUMN tools.frontend_stack IS 'Frontend technologies (React, Vue, etc.)';
COMMENT ON COLUMN tools.backend_stack IS 'Backend technologies (Node.js, Python, etc.)';
COMMENT ON COLUMN tools.package_manager IS 'Package manager: npm, yarn, or pnpm';
COMMENT ON COLUMN tools.node_version IS 'Required Node.js version';
COMMENT ON COLUMN tools.build_tool IS 'Build tool: Vite, Webpack, etc.';

COMMENT ON COLUMN tools.production_url IS 'Live production URL';
COMMENT ON COLUMN tools.staging_url IS 'Staging environment URL';
COMMENT ON COLUMN tools.deployment_method IS 'How is this tool deployed';
COMMENT ON COLUMN tools.cicd_pipeline IS 'CI/CD pipeline: GitHub Actions, etc.';
COMMENT ON COLUMN tools.monitoring_tools IS 'Monitoring tools: Sentry, Analytics, etc.';
COMMENT ON COLUMN tools.backup_strategy IS 'How is data backed up';

COMMENT ON COLUMN tools.demo_account_type IS 'Demo account role: Admin, User, etc.';
COMMENT ON COLUMN tools.demo_data_reset_schedule IS 'When is demo data reset';
COMMENT ON COLUMN tools.demo_limitations IS 'What features are disabled in demo';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that all columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tools'
  AND column_name IN (
    'status', 'purpose', 'primary_users', 'updated_at',
    'system_diagram_url', 'database_info', 'key_dependencies', 'data_flow', 'third_party_services',
    'frontend_stack', 'backend_stack', 'package_manager', 'node_version', 'build_tool',
    'production_url', 'staging_url', 'deployment_method', 'cicd_pipeline', 'monitoring_tools', 'backup_strategy',
    'demo_account_type', 'demo_data_reset_schedule', 'demo_limitations'
  )
ORDER BY column_name;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tools'
  AND indexname IN ('idx_tools_status', 'idx_tools_updated_at', 'idx_tools_category');

-- Check trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tools'
  AND trigger_name = 'trigger_update_tools_updated_at';
