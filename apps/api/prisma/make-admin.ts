/**
 * Promote a user to ADMIN by email.
 *
 * Usage (PowerShell, from repo root):
 *   $env:ADMIN_EMAIL="your@email.com"
 *   pnpm --filter @fitrix/api exec ts-node --compiler-options "{\"module\":\"CommonJS\",\"moduleResolution\":\"node\"}" prisma/make-admin.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  if (!email) throw new Error("Set ADMIN_EMAIL before running.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user found with email: ${email}`);

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });

  console.log(`[make-admin] Done:`, updated);
}

main()
  .catch((e) => { console.error("[make-admin] Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
