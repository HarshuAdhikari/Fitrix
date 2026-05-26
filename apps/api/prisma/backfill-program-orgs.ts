/**
 * Backfill Program.organizationId from each program's coach's user.organizationId.
 *
 * Why: Programs created before the organization layer had organizationId = null.
 * The new tenant scoping (programs.service.ts) requires this field to match the
 * caller's org for ADMIN reads. Run this once after migrating to the org model.
 *
 * Safe to re-run: only updates rows where organizationId IS NULL.
 *
 * Usage (PowerShell, from repo root):
 *   pnpm --filter @fitrix/api exec ts-node --compiler-options "{\"module\":\"CommonJS\",\"moduleResolution\":\"node\"}" prisma/backfill-program-orgs.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program.findMany({
    where: { organizationId: null },
    include: {
      coach: { include: { user: { select: { organizationId: true } } } },
    },
  });

  console.log(`[backfill] Found ${programs.length} program(s) with no organization.`);

  let updated = 0;
  let skipped = 0;
  for (const p of programs) {
    const orgId = p.coach.user.organizationId;
    if (!orgId) {
      skipped++;
      console.log(`  · skip ${p.id} (${p.name}) — coach has no org`);
      continue;
    }
    await prisma.program.update({
      where: { id: p.id },
      data: { organizationId: orgId },
    });
    updated++;
    console.log(`  ✓ ${p.id} (${p.name}) -> org ${orgId}`);
  }

  console.log(`[backfill] Done. Updated: ${updated}, skipped: ${skipped}.`);
}

main()
  .catch((e) => {
    console.error("[backfill] Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
