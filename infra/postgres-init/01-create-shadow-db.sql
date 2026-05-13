-- Prisma needs a shadow database for migration diffing. Create it once at
-- container init. Safe to re-run (IF NOT EXISTS).
SELECT 'CREATE DATABASE mawared_shadow OWNER mawared'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mawared_shadow')\gexec
