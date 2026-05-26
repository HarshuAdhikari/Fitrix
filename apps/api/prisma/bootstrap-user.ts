/**
 * One-shot bootstrap: insert a User row for a Clerk user that already exists
 * on Clerk's side, but hasn't been synced to the local DB (because the Clerk
 * webhook can't reach localhost without a tunnel like ngrok).
 *
 * Usage (PowerShell, from repo root):
 *   $env:BOOTSTRAP_CLERK_ID="user_xxxxxxxxxxxxxxxx"
 *   $env:BOOTSTRAP_EMAIL="you@example.com"
 *   pnpm --filter @fitrix/api exec ts-node --compiler-options "{\"module\":\"CommonJS\",\"moduleResolution\":\"node\"}" prisma/bootstrap-user.ts
 *
 * After this completes successfully, run:
 *   pnpm --filter @fitrix/api run seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clerkId = process.env.BOOTSTRAP_CLERK_ID?.trim();
  const email = process.env.BOOTSTRAP_EMAIL?.trim();
  const firstName = process.env.BOOTSTRAP_FIRST_NAME?.trim() ?? "Harshit";
  const lastName = process.env.BOOTSTRAP_LAST_NAME?.trim() ?? "Maharjan";

  if (!clerkId || !email) {
    throw new Error(
      "Missing env vars. Set BOOTSTRAP_CLERK_ID and BOOTSTRAP_EMAIL before running.",
    );
  }

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { email, firstName, lastName },
    create: {
      clerkId,
      email,
      firstName,
      lastName,
      role: "COACH",
    },
  });

  console.log(
    `[bootstrap-user] OK  id=${user.id}  clerkId=${user.clerkId}  email=${user.email}  role=${user.role}`,
  );
}

main()
  .catch((e) => {
    console.error("[bootstrap-user] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
