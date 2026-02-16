
-- ===============================================================
-- PHASE 6: CRON FIX (Step 5)
-- ===============================================================

-- Remove the SQL-based cron job that had authentication issues
SELECT cron.unschedule('poker-simulation-tick');

-- NOTE TO USER:
-- After running this, please go to your Supabase Dashboard:
-- 1. Navigate to "Edge Functions".
-- 2. Click on "poker-simulator".
-- 3. Enabling "Scheduled Execution" (if available) or setup a trigger.
-- 
-- ALTERNATIVELY (Recommended):
-- Use a secure external scheduler or strictly manage the key via Vault 
-- if you stick with pg_cron, but for now we are removing the broken one.
