/**
 * One-shot transfer: move the existing CoachProfile (and therefore all its
 * exercises, programs, clients, etc.) from whichever user currently owns it
 * to the user identified by TARGET_CLERK_ID.
 *
 * Usage (PowerShell, from repo root):
 *   $env:TARGET_CLERK_ID="user_xxxxxxxxxxxxxxxx"
 *   pnpm --filter @fitrix/api exec ts-node --compiler-options "{\"module\":\"CommonJS\",\"moduleResolution\":\"node\"}" prisma/transfer-coach.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const targetClerkId = process.env.TARGET_CLERK_ID?.trim();
  if (!targetClerkId) {
    throw new Error("Missing env var TARGET_CLERK_ID");
  }

  // Self-healing: trim any rows whose clerkId got persisted with stray
  // whitespace from a previous bootstrap command line.
  const allUsers = await prisma.user.findMany({ select: { id: true, clerkId: true } });
  for (const u of allUsers) {
    const trimmed = u.clerkId.trim();
    if (trimmed !== u.clerkId) {
      console.log(
        `[transfer-coach] cleaning whitespace on user ${u.id} (clerkId)`,
      );
      await prisma.user.update({
        where: { id: u.id },
        data: { clerkId: trimmed },
      });
    }
  }

  const target = await prisma.user.findUnique({
    where: { clerkId: targetClerkId },
  });
  if (!target) {
    throw new Error(
      `No User row found for clerkId=${targetClerkId}. Run bootstrap-user first.`,
    );
  }

  // Find the existing CoachProfile (the one the seed created).
  const profiles = await prisma.coachProfile.findMany({
    include: { user: true },
  });

  if (profiles.length === 0) {
    throw new Error("No CoachProfile rows exist. Run seed first.");
  }

  // Pick the profile NOT already owned by target (the one we want to transfer).
  const sourceProfile =
    profiles.find((p) => p.userId !== target.id) ?? profiles[0]!;

  if (sourceProfile.userId === target.id) {
    console.log(
      `[transfer-coach] CoachProfile already owned by target user ${target.email}. Nothing to do.`,
    );
    return;
  }

  console.log(
    `[transfer-coach] transferring CoachProfile ${sourceProfile.id} from ${sourceProfile.user.email} -> ${target.email}`,
  );

  await prisma.$transaction(async (tx) => {
    // If target user already has its own (empty) CoachProfile, delete it first
    // because CoachProfile.userId is unique.
    const existing = await tx.coachProfile.findUnique({
      where: { userId: target.id },
    });
    if (existing) {
      console.log(
        `[transfer-coach] removing target's empty CoachProfile ${existing.id}`,
      );
      await tx.coachProfile.delete({ where: { id: existing.id } });
    }

    // Move ownership of the populated CoachProfile.
    await tx.coachProfile.update({
      where: { id: sourceProfile.id },
      data: { userId: target.id },
    });

    // Make sure target's role is COACH.
    await tx.user.update({
      where: { id: target.id },
      data: { role: "COACH" },
    });

    // Also reassign Exercise.createdById so "your exercises" listings work.
    await tx.exercise.updateMany({
      where: { createdById: sourceProfile.userId },
      data: { createdById: target.id },
    });

    // Demote the previous owner to CLIENT so we don't have two coaches floating.
    await tx.user.update({
      where: { id: sourceProfile.userId },
      data: { role: "CLIENT" },
    });
  });

  console.log("[transfer-coach] done.");
}

main()
  .catch((e) => {
    console.error("[transfer-coach] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
