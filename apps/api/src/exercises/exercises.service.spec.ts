import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ExercisesService } from "./exercises.service";
import { PrismaService } from "../prisma/prisma.service";
import { RequestUser } from "../auth/decorators/current-user.decorator";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockExercise = (overrides: Partial<{
  id: string;
  createdById: string | null;
}> = {}) => ({
  id: "ex_1",
  name: "Goblet Squat",
  primaryMuscle: "Quads",
  secondaryMuscles: [],
  equipment: "Dumbbell",
  difficulty: "BEGINNER" as const,
  description: null,
  videoUrl: null,
  imageUrl: null,
  createdById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockUser = (id = "user_db_1") => ({
  id,
  clerkId: "clerk_1",
  email: "coach@test.com",
  firstName: "Coach",
  lastName: null,
  role: "COACH" as const,
  organizationId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const coachRequest = (clerkId = "clerk_1"): RequestUser => ({
  clerkId,
  email: "coach@test.com",
  role: "COACH",
  userId: "user_db_1",
  organizationId: null,
});

const superAdminRequest = (): RequestUser => ({
  clerkId: "clerk_admin",
  email: "admin@test.com",
  role: "SUPER_ADMIN",
  userId: "user_admin",
  organizationId: null,
});

// ─── Mock Prisma factory ──────────────────────────────────────────────────────

function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      findFirst: jest.fn().mockResolvedValue(mockUser()),
    },
    exercise: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  } as unknown as PrismaService;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExercisesService — ownership rules", () => {
  // ── update ───────────────────────────────────────────────────────────────

  describe("update()", () => {
    it("throws ForbiddenException when a coach tries to update a system exercise (createdById = null)", async () => {
      const prisma = buildPrisma();
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(
        mockExercise({ createdById: null }),
      );
      const svc = new ExercisesService(prisma);

      await expect(
        svc.update("ex_1", { name: "Renamed" }, coachRequest()),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws ForbiddenException when a coach updates an exercise owned by another coach", async () => {
      const prisma = buildPrisma();
      // Exercise belongs to a *different* user (user_db_OTHER)
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(
        mockExercise({ createdById: "user_db_OTHER" }),
      );
      // The requesting coach resolves to user_db_1
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser("user_db_1"));
      const svc = new ExercisesService(prisma);

      await expect(
        svc.update("ex_1", { name: "Renamed" }, coachRequest()),
      ).rejects.toThrow(ForbiddenException);
    });

    it("allows the owner to update their own exercise", async () => {
      const prisma = buildPrisma();
      const owned = mockExercise({ createdById: "user_db_1" });
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(owned);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser("user_db_1"));
      (prisma.exercise.update as jest.Mock).mockResolvedValue({
        ...owned,
        name: "Renamed",
      });
      const svc = new ExercisesService(prisma);

      const result = await svc.update("ex_1", { name: "Renamed" }, coachRequest());
      expect(result.name).toBe("Renamed");
    });

    it("allows SUPER_ADMIN to update any exercise including system ones", async () => {
      const prisma = buildPrisma();
      const system = mockExercise({ createdById: null });
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(system);
      (prisma.exercise.update as jest.Mock).mockResolvedValue({
        ...system,
        name: "Admin Edit",
      });
      const svc = new ExercisesService(prisma);

      const result = await svc.update("ex_1", { name: "Admin Edit" }, superAdminRequest());
      expect(result.name).toBe("Admin Edit");
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe("remove()", () => {
    it("throws ForbiddenException when a coach tries to delete a system exercise", async () => {
      const prisma = buildPrisma();
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(
        mockExercise({ createdById: null }),
      );
      const svc = new ExercisesService(prisma);

      await expect(svc.remove("ex_1", coachRequest())).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws ForbiddenException when a coach deletes another coach's exercise", async () => {
      const prisma = buildPrisma();
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(
        mockExercise({ createdById: "user_db_OTHER" }),
      );
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser("user_db_1"));
      const svc = new ExercisesService(prisma);

      await expect(svc.remove("ex_1", coachRequest())).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("allows the owner to delete their exercise", async () => {
      const prisma = buildPrisma();
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(
        mockExercise({ createdById: "user_db_1" }),
      );
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser("user_db_1"));
      const svc = new ExercisesService(prisma);

      const result = await svc.remove("ex_1", coachRequest());
      expect(result).toEqual({ id: "ex_1" });
    });

    it("allows SUPER_ADMIN to delete any exercise", async () => {
      const prisma = buildPrisma();
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(
        mockExercise({ createdById: null }),
      );
      const svc = new ExercisesService(prisma);

      const result = await svc.remove("ex_1", superAdminRequest());
      expect(result).toEqual({ id: "ex_1" });
    });

    it("throws NotFoundException for a non-existent exercise", async () => {
      const prisma = buildPrisma();
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);
      const svc = new ExercisesService(prisma);

      await expect(svc.remove("ex_missing", coachRequest())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── duplicate ─────────────────────────────────────────────────────────────

  describe("duplicate()", () => {
    it("creates a copy owned by the requesting coach", async () => {
      const prisma = buildPrisma();
      const system = mockExercise({ id: "ex_sys", createdById: null });
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(system);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser("user_db_1"));
      (prisma.exercise.create as jest.Mock).mockImplementation(({ data }) =>
        Promise.resolve({ ...data, id: "ex_copy", createdAt: new Date(), updatedAt: new Date() }),
      );
      const svc = new ExercisesService(prisma);

      const copy = await svc.duplicate("ex_sys", coachRequest());
      expect(copy.createdById).toBe("user_db_1");
      expect(copy.name).toBe("Goblet Squat (copy)");
    });

    it("throws NotFoundException when duplicating a non-existent exercise", async () => {
      const prisma = buildPrisma();
      (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);
      const svc = new ExercisesService(prisma);

      await expect(svc.duplicate("ex_missing", coachRequest())).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
