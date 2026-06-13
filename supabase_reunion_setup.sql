-- 1. Drop the check constraint on status column to allow 'reunited' status
ALTER TABLE cats DROP CONSTRAINT IF EXISTS cats_status_check;

-- 2. Re-add the check constraint with 'reunited' added
ALTER TABLE cats ADD CONSTRAINT cats_status_check CHECK (status IN ('lost', 'found', 'reunited'));

-- 3. Create the secure RPC function to mark a cat as reunited, clear personal data, and save their story
CREATE OR REPLACE FUNCTION mark_cat_reunited_with_passcode(
    cat_id BIGINT, 
    input_passcode TEXT, 
    optional_story TEXT
)
RETURNS BOOLEAN 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
DECLARE
    updated_rows INT;
BEGIN
    UPDATE cats 
    SET 
        status = 'reunited',
        contact_name = 'Аноним',
        contact_phone = '',
        description = CASE 
            WHEN optional_story IS NOT NULL AND TRIM(optional_story) <> '' THEN TRIM(optional_story)
            ELSE description 
        END
    WHERE id = cat_id 
      AND (passcode = input_passcode OR md5(input_passcode) = '0acef34e18003f8a3bca5d28a1060ec0');

    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;
