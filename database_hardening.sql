-- SQL Hardening: Secure Stored Procedures
-- Run this script in the Supabase SQL Editor to secure the SECURITY DEFINER functions.

-- 1. Enforce a secure search path for delete_cat_with_passcode
ALTER FUNCTION delete_cat_with_passcode(bigint, text) SET search_path = public, pg_temp;

-- 2. Enforce a secure search path for mark_cat_reunited_with_passcode
ALTER FUNCTION mark_cat_reunited_with_passcode(bigint, text, text) SET search_path = public, pg_temp;

-- 3. Enforce a secure search path for get_feedback_messages
ALTER FUNCTION get_feedback_messages(text) SET search_path = public, pg_temp;

-- 4. Enforce a secure search path for archive_feedback_message
ALTER FUNCTION archive_feedback_message(uuid, text) SET search_path = public, pg_temp;

-- 5. Enforce a secure search path for get_analytics_data
ALTER FUNCTION get_analytics_data(text) SET search_path = public, pg_temp;
