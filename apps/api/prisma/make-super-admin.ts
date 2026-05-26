/**
 * Promote a user to SUPER_ADMIN by email.
 *
 * Usage (PowerShell, from repo root):
 *   $env:SUPER_ADMIN_EMAIL="your@email.com"
 *   pnpm --filter @fitrix/api exec ts-node --compiler-options "{\"module\":\"CommonJS\",\"moduleResolution\":\"node\"}" prisma/make-super-admin.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim();
  if (!email) throw new Error("Set SUPER_ADMIN_EMAIL before running.");

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "SUPER_ADMIN" },
    select: { id: true, email: true, role: true },
  });

  console.log("[make-super-admin] Done:", updated);
}

main()
  .catch((e) => {
    console.error("[make-super-admin] Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
