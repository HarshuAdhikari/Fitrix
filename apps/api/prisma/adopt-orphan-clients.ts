/**
 * Adopt all CLIENT users without an organizationId into a target organization.
 *
 * Why: clients seeded before the multi-tenant rules went in have
 * organizationId = null, so an ADMIN trying to schedule for them gets
 * "Client is not in your organization". This adopts them as if the admin
 * had added them via the org "Add member" flow.
 *
 * Safe to re-run: only touches rows where organizationId IS NULL.
 *
 * Usage:
 *   # Defaults to the most-recently-created organization.
 *   pnpm --filter @fitrix/api exec ts-node \
 *     --compiler-options "{\"module\":\"CommonJS\",\"moduleResolution\":\"node\"}" \
 *     prisma/adopt-orphan-clients.ts
 *
 *   # Or pass a specific org slug:
 *   pnpm --filter @fitrix/api exec ts-node ... prisma/adopt-orphan-clients.ts leogenfitness
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const slugArg = process.argv[2];

  const org = slugArg
    ? await prisma.organization.findFirst({
        where: { slug: slugArg, deletedAt: null },
      })
    : await prisma.organization.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      });

  if (!org) {
    console.error(
      `[adopt] No organization found${slugArg ? ` for slug ${slugArg}` : ""}.`,
    );
    process.exit(1);
  }
  console.log(`[adopt] Target organization: ${org.name} (${org.slug}, ${org.id})`);

  const orphans = await prisma.user.findMany({
    where: {
      role: UserRole.CLIENT,
      organizationId: null,
      deletedAt: null,
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  console.log(`[adopt] Found ${orphans.length} orphan client(s).`);

  for (const u of orphans) {
    await prisma.user.update({
      where: { id: u.id },
      data: { organizationId: org.id },
    });
    const label =
      [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
    console.log(`  ✓ adopted ${label} (${u.email})`);
  }

  console.log(`[adopt] Done. Adopted ${orphans.length} client(s) into ${org.name}.`);
}

main()
  .catch((e) => {
    console.error("[adopt] Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
