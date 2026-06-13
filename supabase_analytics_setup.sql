-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    event_type TEXT NOT NULL,
    page_path TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT (anyone can submit tracking events)
DROP POLICY IF EXISTS "Allow anonymous insertions" ON analytics;
CREATE POLICY "Allow anonymous insertions" 
ON analytics 
FOR INSERT 
TO public 
WITH CHECK (true);

-- No SELECT policy for public (only accessible via RPC function by admin)

-- RPC function to securely get analytics data using admin passcode
-- The default passcode is 'QWEasd123,.'
-- MD5 hash of 'QWEasd123,.' is '0acef34e18003f8a3bca5d28a1060ec0'
CREATE OR REPLACE FUNCTION get_analytics_data(passcode text)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    event_type TEXT,
    page_path TEXT,
    session_id TEXT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF md5(passcode) = '0acef34e18003f8a3bca5d28a1060ec0' THEN
        RETURN QUERY 
        SELECT a.id, a.created_at, a.event_type, a.page_path, a.session_id, a.metadata
        FROM analytics a
        ORDER BY a.created_at DESC;
    ELSE
        RAISE EXCEPTION 'Invalid admin passcode';
    END IF;
END;
$$;
