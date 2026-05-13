-- =====================================================================
-- Mawared spec compliance — Signit verification, expanded roles, WhatsApp.
-- Apply via `prisma migrate deploy` after pulling this branch.
-- =====================================================================

-- ----- New enums -----
CREATE TYPE "VerificationStatus" AS ENUM (
  'NOT_VERIFIED', 'PENDING', 'VERIFIED', 'FAILED', 'EXPIRED'
);
CREATE TYPE "VerificationProvider" AS ENUM ('SIGNIT', 'MANUAL');

-- ----- Expand UserRole with Sales / Finance / Support -----
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SALES';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPPORT';

-- ----- Customer verification columns -----
ALTER TABLE "Customer"
  ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
  ADD COLUMN "verificationLastCheckedAt" TIMESTAMPTZ,
  ADD COLUMN "verificationExpiresAt" TIMESTAMPTZ;

-- ----- Identity verifications audit table -----
CREATE TABLE "IdentityVerification" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId"        UUID NOT NULL REFERENCES "Customer"("userId") ON DELETE CASCADE,
  "provider"          "VerificationProvider" NOT NULL DEFAULT 'SIGNIT',
  "providerSessionId" TEXT UNIQUE,
  "status"            "VerificationStatus" NOT NULL,
  "redirectUrl"       TEXT,
  "callbackPayload"   JSONB,
  "failureReason"     TEXT,
  "initiatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt"       TIMESTAMPTZ,
  "expiresAt"         TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "IdentityVerification_customerId_completedAt_idx"
  ON "IdentityVerification" ("customerId", "completedAt" DESC);
CREATE INDEX "IdentityVerification_status_expiresAt_idx"
  ON "IdentityVerification" ("status", "expiresAt");

-- ----- WhatsApp number on Branch -----
ALTER TABLE "Branch" ADD COLUMN "whatsappE164" TEXT;
ALTER TABLE "Branch"
  ADD CONSTRAINT branch_whatsapp_e164
  CHECK ("whatsappE164" IS NULL OR "whatsappE164" ~ '^\+[1-9][0-9]{6,14}$');
