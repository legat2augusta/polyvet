-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT,
    contact TEXT,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'suggestion',
    status TEXT DEFAULT 'new'
);

-- Enable Row Level Security (RLS)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT (anyone can submit feedback)
CREATE POLICY "Allow anonymous insertions" 
ON feedback 
FOR INSERT 
TO public 
WITH CHECK (true);

-- No SELECT policy for public (only authenticated service role or via RPC function)
-- This ensures users cannot read other people's feedback directly.

-- RPC function to securely get feedback using admin passcode
-- The default passcode is 'kotopoisk2026'
-- MD5 hash of 'kotopoisk2026' is '9f7d4512bd31d279cf4370258cfbc10d'
CREATE OR REPLACE FUNCTION get_feedback_messages(passcode text)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    name TEXT,
    contact TEXT,
    message TEXT,
    type TEXT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF md5(passcode) = '9f7d4512bd31d279cf4370258cfbc10d' THEN
        RETURN QUERY 
        SELECT f.id, f.created_at, f.name, f.contact, f.message, f.type, f.status 
        FROM feedback f
        ORDER BY f.created_at DESC;
    ELSE
        RAISE EXCEPTION 'Invalid admin passcode';
    END IF;
END;
$$;

-- RPC function to securely archive feedback using admin passcode
CREATE OR REPLACE FUNCTION archive_feedback_message(message_id UUID, passcode text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF md5(passcode) = '9f7d4512bd31d279cf4370258cfbc10d' THEN
        UPDATE feedback 
        SET status = 'archived' 
        WHERE id = message_id;
    ELSE
        RAISE EXCEPTION 'Invalid admin passcode';
    END IF;
END;
$$;
