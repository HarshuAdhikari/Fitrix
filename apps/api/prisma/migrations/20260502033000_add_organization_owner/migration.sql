ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

CREATE INDEX IF NOT EXISTS "Organization_ownerId_idx" ON "Organization"("ownerId");

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
