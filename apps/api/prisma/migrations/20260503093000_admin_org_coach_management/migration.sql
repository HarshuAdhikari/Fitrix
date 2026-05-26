CREATE TYPE "OrganizationType" AS ENUM ('GYM_OR_CHAIN', 'INDIVIDUAL_COACH');

ALTER TABLE "Organization"
  ADD COLUMN "type" "OrganizationType" NOT NULL DEFAULT 'GYM_OR_CHAIN',
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "User"
  ADD COLUMN "phone" TEXT;
