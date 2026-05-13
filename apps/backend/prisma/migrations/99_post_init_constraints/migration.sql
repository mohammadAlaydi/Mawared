-- =====================================================================
-- Mawared — post-init invariants (CHECK constraints, partial unique
-- indexes, pg_trgm GIN indexes). These can't be expressed in schema.prisma
-- and live here so they're enforced at the DB level.
--
-- Run AFTER `prisma migrate dev --name init` generates the base schema.
-- =====================================================================

-- -------------------------------------------------------------------
-- Money invariants — every money column ≥ 0.
-- -------------------------------------------------------------------
ALTER TABLE "Order"
  ADD CONSTRAINT order_amounts_nonneg
  CHECK (
    "subtotalMinor" >= 0
    AND "discountMinor" >= 0
    AND "vatMinor" >= 0
    AND "totalMinor" >= 0
  );

ALTER TABLE "PaymentIntent"
  ADD CONSTRAINT pi_amount_nonneg CHECK ("amountMinor" >= 0);

ALTER TABLE "Refund"
  ADD CONSTRAINT refund_amount_nonneg CHECK ("amountMinor" >= 0);

ALTER TABLE "ServicePackage"
  ADD CONSTRAINT pkg_price_nonneg CHECK ("priceMinor" >= 0);

ALTER TABLE "Worker"
  ADD CONSTRAINT worker_salary_nonneg CHECK ("monthlySalaryMinor" >= 0);

ALTER TABLE "PromoCode"
  ADD CONSTRAINT promo_discount_xor
  CHECK (
    (("discountPercent" IS NOT NULL)::int + ("discountMinor" IS NOT NULL)::int) = 1
  );

ALTER TABLE "PromoRedemption"
  ADD CONSTRAINT promoredemption_amount_nonneg CHECK ("discountAppliedMinor" >= 0);

-- -------------------------------------------------------------------
-- Currency must be ISO 4217 (3 uppercase letters).
-- -------------------------------------------------------------------
ALTER TABLE "Order"           ADD CONSTRAINT order_currency_iso     CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE "ServicePackage"  ADD CONSTRAINT pkg_currency_iso       CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE "PaymentIntent"   ADD CONSTRAINT pi_currency_iso        CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE "Refund"          ADD CONSTRAINT refund_currency_iso    CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE "Worker"          ADD CONSTRAINT worker_currency_iso    CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE "PromoCode"       ADD CONSTRAINT promo_currency_iso     CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE "PromoRedemption" ADD CONSTRAINT pred_currency_iso      CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE "Contract"        ADD CONSTRAINT contract_currency_iso  CHECK (currency ~ '^[A-Z]{3}$');

-- -------------------------------------------------------------------
-- Phone numbers must be E.164.
-- -------------------------------------------------------------------
ALTER TABLE "User"
  ADD CONSTRAINT user_phone_e164
  CHECK ("phoneE164" IS NULL OR "phoneE164" ~ '^\+[1-9][0-9]{6,14}$');

ALTER TABLE "Branch"
  ADD CONSTRAINT branch_phone_e164
  CHECK ("phoneE164" ~ '^\+[1-9][0-9]{6,14}$');

ALTER TABLE "Lead"
  ADD CONSTRAINT lead_phone_e164
  CHECK ("phoneE164" ~ '^\+[1-9][0-9]{6,14}$');

-- -------------------------------------------------------------------
-- One active reservation per worker (partial unique index).
-- -------------------------------------------------------------------
CREATE UNIQUE INDEX reservation_one_active_per_worker
  ON "Reservation" ("workerId")
  WHERE "releasedAt" IS NULL AND "orderId" IS NULL;

-- -------------------------------------------------------------------
-- pg_trgm fuzzy search on worker full names.
-- -------------------------------------------------------------------
CREATE INDEX worker_fullnamear_trgm_idx ON "Worker" USING GIN ("fullNameAr" gin_trgm_ops);
CREATE INDEX worker_fullnameen_trgm_idx ON "Worker" USING GIN ("fullNameEn" gin_trgm_ops);

-- -------------------------------------------------------------------
-- User role ↔ identifier consistency.
--   * Every CUSTOMER must have a phone.
--   * Every non-CUSTOMER (STAFF / BRANCH_MANAGER / SUPER_ADMIN) must have an email.
-- -------------------------------------------------------------------
-- Active customers must have a phone; soft-deleted users are exempt so we can
-- anonymize identifiers on account deletion.
ALTER TABLE "User"
  ADD CONSTRAINT user_phone_when_customer
  CHECK ("deletedAt" IS NOT NULL OR role <> 'CUSTOMER' OR "phoneE164" IS NOT NULL);

ALTER TABLE "User"
  ADD CONSTRAINT user_email_when_staff
  CHECK ("deletedAt" IS NOT NULL OR role = 'CUSTOMER' OR email IS NOT NULL);
