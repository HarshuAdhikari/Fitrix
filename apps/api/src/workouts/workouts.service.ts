import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestUser } from "../auth/decorators/current-user.decorator";
import { Difficulty, TargetArea, UserRole } from "@prisma/client";

/**
 * The user-facing concept "Program" maps to a single `WorkoutSession` row in
 * the schema. Each coach gets a hidden Program container called "_library"
 * which holds all of their workouts. This service hides the container from
 * callers entirely — the API surface is flat workouts, no week/day layer.
 */

const LIBRARY_PROGRAM_NAME = "__library__";

interface CreateWorkoutInput {
  name: string;
  description?: string;
  notes?: string;
  estimatedDurationMin?: number;
  difficulty?: Difficulty;
  targetAreas?: TargetArea[];
}

interface UpdateWorkoutInput {
  name?: string;
  description?: string | null;
  notes?: string | null;
  estimatedDurationMin?: number | null;
  difficulty?: Difficulty | null;
  targetAreas?: TargetArea[];
}

interface AddExerciseInput {
  exerciseId: string;
  sets?: number;
  reps?: string;
  rest?: string;
  notes?: string;
}

interface UpdateExerciseInput {
  sets?: number | null;
  reps?: string | null;
  rest?: string | null;
  notes?: string | null;
  orderIndex?: number;
}

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCoachProfileId(
    requestUser: RequestUser,
  ): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { clerkId: requestUser.clerkId, deletedAt: null },
      include: { coachProfile: true },
    });
    if (!user) throw new ForbiddenException("User not found");
    if (user.coachProfile) return user.coachProfile.id;

    if (
      requestUser.role !== UserRole.ADMIN &&
      requestUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException("Coach profile not found for this user");
    }
    const created = await this.prisma.coachProfile.create({
      data: { userId: user.id },
    });
    return created.id;
  }

  /**
   * Lazily resolve (or create) the caller's "_library" Program container.
   * Every workout the user creates lives inside it. The container itself
   * is never surfaced through the API.
   */
  private async getOrCreateLibraryProgram(
    coachId: string,
    organizationId: string | null,
  ): Promise<string> {
    const existing = await this.prisma.program.findFirst({
      where: { coachId, name: LIBRARY_PROGRAM_NAME },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await this.prisma.program.create({
      data: {
        coachId,
        organizationId,
        name: LIBRARY_PROGRAM_NAME,
        description: null,
        durationWeeks: 1,
      },
    });
    return created.id;
  }

  /** Coach: their own workouts. Admin: every workout in the org. Super: all. */
  async list(requestUser: RequestUser) {
    if (requestUser.role === UserRole.SUPER_ADMIN) {
      return this.serializeMany(
        await this.prisma.workoutSession.findMany({
          orderBy: { id: "desc" },
          include: this.listInclude(),
        }),
      );
    }

    if (requestUser.role === UserRole.ADMIN) {
      if (!requestUser.organizationId) return [];
      return this.serializeMany(
        await this.prisma.workoutSession.findMany({
          where: { program: { organizationId: requestUser.organizationId } },
          orderBy: { id: "desc" },
          include: this.listInclude(),
        }),
      );
    }

    const coachId = await this.getOrCreateCoachProfileId(requestUser);
    return this.serializeMany(
      await this.prisma.workoutSession.findMany({
        where: { program: { coachId } },
        orderBy: { id: "desc" },
        include: this.listInclude(),
      }),
    );
  }

  async findOne(id: string, requestUser: RequestUser) {
    const workout = await this.prisma.workoutSession.findUnique({
      where: { id },
      include: {
        program: true,
        exercises: {
          orderBy: { orderIndex: "asc" },
          include: { exercise: true },
        },
      },
    });
    if (!workout) throw new NotFoundException("Workout not found");
    await this.assertCanAccess(workout.program, requestUser);
    return this.serializeOne(workout);
  }

  async create(input: CreateWorkoutInput, requestUser: RequestUser) {
    if (!input.name?.trim()) {
      throw new BadRequestException("Workout name is required");
    }
    const coachId = await this.getOrCreateCoachProfileId(requestUser);
    const libraryId = await this.getOrCreateLibraryProgram(
      coachId,
      requestUser.organizationId ?? null,
    );

    const created = await this.prisma.workoutSession.create({
      data: {
        programId: libraryId,
        weekNumber: 1,
        dayNumber: 1,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        notes: input.notes?.trim() || null,
        estimatedDurationMin: input.estimatedDurationMin ?? null,
        difficulty: input.difficulty ?? null,
        targetAreas: input.targetAreas ?? [],
      },
      include: {
        program: true,
        exercises: {
          orderBy: { orderIndex: "asc" },
          include: { exercise: true },
        },
      },
    });
    return this.serializeOne(created);
  }

  async update(
    id: string,
    input: UpdateWorkoutInput,
    requestUser: RequestUser,
  ) {
    const workout = await this.prisma.workoutSession.findUnique({
      where: { id },
      include: { program: true },
    });
    if (!workout) throw new NotFoundException("Workout not found");
    await this.assertCanAccess(workout.program, requestUser);

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new BadRequestException("Name cannot be empty");
      }
      data.name = input.name.trim();
    }
    if (input.description !== undefined) data.description = input.description || null;
    if (input.notes !== undefined) data.notes = input.notes || null;
    if (input.estimatedDurationMin !== undefined) {
      data.estimatedDurationMin = input.estimatedDurationMin ?? null;
    }
    if (input.difficulty !== undefined) data.difficulty = input.difficulty;
    if (input.targetAreas !== undefined) data.targetAreas = input.targetAreas;

    const updated = await this.prisma.workoutSession.update({
      where: { id },
      data,
      include: {
        program: true,
        exercises: {
          orderBy: { orderIndex: "asc" },
          include: { exercise: true },
        },
      },
    });
    return this.serializeOne(updated);
  }

  async remove(id: string, requestUser: RequestUser) {
    const workout = await this.prisma.workoutSession.findUnique({
      where: { id },
      include: { program: true },
    });
    if (!workout) throw new NotFoundException("Workout not found");
    await this.assertCanAccess(workout.program, requestUser);
    await this.prisma.workoutSession.delete({ where: { id } });
    return { id };
  }

  async addExercise(
    workoutId: string,
    input: AddExerciseInput,
    requestUser: RequestUser,
  ) {
    const workout = await this.prisma.workoutSession.findUnique({
      where: { id: workoutId },
      include: { program: true },
    });
    if (!workout) throw new NotFoundException("Workout not found");
    await this.assertCanAccess(workout.program, requestUser);

    const exists = await this.prisma.exercise.findUnique({
      where: { id: input.exerciseId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Exercise not found");

    const maxOrder = await this.prisma.workoutSessionExercise.aggregate({
      where: { sessionId: workoutId },
      _max: { orderIndex: true },
    });
    const nextOrder = (maxOrder._max.orderIndex ?? -1) + 1;

    await this.prisma.workoutSessionExercise.create({
      data: {
        sessionId: workoutId,
        exerciseId: input.exerciseId,
        orderIndex: nextOrder,
        sets: input.sets ?? null,
        reps: input.reps ?? null,
        rest: input.rest ?? null,
        notes: input.notes ?? null,
      },
    });
    return this.findOne(workoutId, requestUser);
  }

  async updateExercise(
    workoutId: string,
    sessionExerciseId: string,
    input: UpdateExerciseInput,
    requestUser: RequestUser,
  ) {
    const link = await this.prisma.workoutSessionExercise.findUnique({
      where: { id: sessionExerciseId },
      include: { session: { include: { program: true } } },
    });
    if (!link || link.sessionId !== workoutId) {
      throw new NotFoundException("Exercise not found in this workout");
    }
    await this.assertCanAccess(link.session.program, requestUser);

    const data: Record<string, unknown> = {};
    if (input.sets !== undefined) data.sets = input.sets;
    if (input.reps !== undefined) data.reps = input.reps;
    if (input.rest !== undefined) data.rest = input.rest;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.orderIndex !== undefined) data.orderIndex = input.orderIndex;

    await this.prisma.workoutSessionExercise.update({
      where: { id: sessionExerciseId },
      data,
    });
    return this.findOne(workoutId, requestUser);
  }

  async removeExercise(
    workoutId: string,
    sessionExerciseId: string,
    requestUser: RequestUser,
  ) {
    const link = await this.prisma.workoutSessionExercise.findUnique({
      where: { id: sessionExerciseId },
      include: { session: { include: { program: true } } },
    });
    if (!link || link.sessionId !== workoutId) {
      throw new NotFoundException("Exercise not found in this workout");
    }
    await this.assertCanAccess(link.session.program, requestUser);
    await this.prisma.workoutSessionExercise.delete({
      where: { id: sessionExerciseId },
    });
    return this.findOne(workoutId, requestUser);
  }

  private async assertCanAccess(
    program: { coachId: string; organizationId: string | null },
    requestUser: RequestUser,
  ) {
    if (requestUser.role === UserRole.SUPER_ADMIN) return;
    if (requestUser.role === UserRole.ADMIN) {
      if (
        !requestUser.organizationId ||
        program.organizationId !== requestUser.organizationId
      ) {
        throw new ForbiddenException("Not in your organization");
      }
      return;
    }
    const coachId = await this.getOrCreateCoachProfileId(requestUser);
    if (program.coachId !== coachId) {
      throw new ForbiddenException("Not your workout");
    }
  }

  private listInclude() {
    return {
      _count: { select: { exercises: true } },
      program: { select: { id: true, name: true } },
    };
  }

  private serializeMany(rows: any[]) {
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      notes: r.notes,
      estimatedDurationMin: r.estimatedDurationMin,
      difficulty: r.difficulty,
      targetAreas: r.targetAreas ?? [],
      exerciseCount: r._count?.exercises ?? 0,
    }));
  }

  private serializeOne(workout: any) {
    return {
      id: workout.id,
      name: workout.name,
      description: workout.description,
      notes: workout.notes,
      estimatedDurationMin: workout.estimatedDurationMin,
      difficulty: workout.difficulty,
      targetAreas: workout.targetAreas ?? [],
      exercises: (workout.exercises ?? []).map((we: any) => ({
        id: we.id,
        orderIndex: we.orderIndex,
        sets: we.sets,
        reps: we.reps,
        rest: we.rest,
        notes: we.notes,
        exercise: {
          id: we.exercise.id,
          name: we.exercise.name,
          primaryMuscle: we.exercise.primaryMuscle,
          equipment: we.exercise.equipment,
          equipmentTypes: we.exercise.equipmentTypes,
          exerciseType: we.exercise.exerciseType,
          difficulty: we.exercise.difficulty,
        },
      })),
    };
  }
}
