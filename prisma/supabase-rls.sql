-- Supabase exposes the "public" schema through its Data API (with the anon key).
-- This app talks to the database only through Prisma on the server, so we turn on
-- Row Level Security with NO policies: the Data API can then read/write nothing,
-- while Prisma (connecting as the postgres owner) keeps full access.
-- Safe to run again any time (e.g. after adding a new table).
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t.tablename);
  END LOOP;
END $$;
