-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "activeProgramId" TEXT,
ADD COLUMN     "activeProgramStartedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_activeProgramId_fkey" FOREIGN KEY ("activeProgramId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: For every client, copy the most-recent ACCEPTED invitation with a
-- programId (matched by email, case-insensitive) into the new columns. Mirrors
-- the in-code derivation we used before this migration. Safe to re-run because
-- it only writes where activeProgramId is currently NULL.
UPDATE "ClientProfile" AS cp
SET    "activeProgramId" = src."programId",
       "activeProgramStartedAt" = src."acceptedAt"
FROM (
    SELECT DISTINCT ON (u.id)
           cp_inner.id      AS profile_id,
           i."programId"    AS "programId",
           i."acceptedAt"   AS "acceptedAt"
    FROM   "User" u
    JOIN   "ClientProfile" cp_inner ON cp_inner."userId" = u.id
    JOIN   "Invitation" i ON LOWER(i.email) = LOWER(u.email)
    WHERE  i.status = 'ACCEPTED'
      AND  i."programId" IS NOT NULL
    ORDER  BY u.id, i."acceptedAt" DESC NULLS LAST
) AS src
WHERE  cp.id = src.profile_id
  AND  cp."activeProgramId" IS NULL;
