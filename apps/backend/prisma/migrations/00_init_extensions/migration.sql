-- Required Postgres extensions for the Mawared schema.
-- Run BEFORE `prisma migrate dev` so the schema's `extensions = [...]`
-- block has everything it needs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
