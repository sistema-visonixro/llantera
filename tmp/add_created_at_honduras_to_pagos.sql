-- Adds a text column to store Honduras local timestamp for pagos
ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS created_at_honduras TEXT;

-- Optional: backfill existing rows using created_at (assuming created_at is timestamptz)
-- This will produce strings in ISO format converted to Honduras timezone
-- Uncomment and run if you want to backfill existing rows.
-- UPDATE pagos SET created_at_honduras = to_char(created_at AT TIME ZONE 'America/Tegucigalpa','YYYY-MM-DD"T"HH24:MI:SSOF');
