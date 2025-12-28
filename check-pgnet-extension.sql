-- Check if pg_net extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- If the above returns no rows, enable it:
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant permissions for pg_net
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
