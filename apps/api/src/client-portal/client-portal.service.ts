import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InvitationsService } from "../invitations/invitations.service";
import { RequestUser } from "../auth/decorators/current-user.decorator";

interface LogSetInput {
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  rpe?: number;
  notes?: string;
}

export interface LogSessionInput {
  notes?: string;
  sets?: LogSetInput[];
}

@Injectable()
export class ClientPortalService {
  private readonly logger = new Logger(ClientPortalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invitations: InvitationsService,
  ) {}

  /**
   * Self-heal for the case where the Clerk user.created webhook fired with an
   * empty email (Clerk sometimes does this before email verification) and the
   * pending invitation was never auto-accepted. If we detect this user has no
   * active coach assignment but does have a PENDING invitation matching their
   * email, accept it on the fly. Idempotent — returns silently when there's
   * nothing to do.
   */
  private async ensureInvitationAccepted(
    userId: string,
    email: string,
    clientProfileId: string,
  ) {
    const activeAssignment =
      await this.prisma.coachClientAssignment.findFirst({
        where: { clientId: clientProfileId, status: "ACTIVE" },
        select: { id: true },
      });
    if (activeAssignment) return;

    const pending = await this.prisma.invitation.findFirst({
      where: { email: email.trim().toLowerCase(), status: "PENDING" },
      select: { id: true },
    });
    if (!pending) return;

    try {
      await this.invitations.acceptByEmailForNewUser(email, userId);
      this.logger.log(
        `Self-healed pending invitation for ${email} via client portal`,
      );
    } catch (err) {
      this.logger.error(
        `Self-heal accept failed for ${email}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Resolve the calling Clerk user to a ClientProfile. Throws if the user has
   * not been provisioned as a client yet (e.g. their invitation has not been
   * accepted / no clientProfile row exists).
   */
  private async getClientContext(clerkId: string) {
    const user = await this.prisma.user.findFirst({
      where: { clerkId, deletedAt: null },
      include: { clientProfile: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (!user.clientProfile) {
      throw new ForbiddenException(
        "No client profile is linked to this account",
      );
    }
    return { user, clientProfile: user.clientProfile };
  }

  /**
   * Resolve the client's currently-assigned programme.
   *
   * Source of truth is `ClientProfile.activeProgramId`. We still fetch the
   * latest matching ACCEPTED invitation to carry over per-assignment overrides
   * (durationWeeks, startDate) and the inviting coach. If the column is null
   * (legacy clients pre-backfill, edge cases), we fall back to the old "most
   * recent ACCEPTED invitation with any programId" behaviour so nothing breaks.
   */
  private async resolveActiveInvitation(
    email: string,
    activeProgramId: string | null,
  ) {
    const baseWhere = {
      email: email.trim().toLowerCase(),
      status: "ACCEPTED" as const,
      programId: activeProgramId ?? { not: null },
    };
    return this.prisma.invitation.findFirst({
      where: baseWhere,
      orderBy: { acceptedAt: "desc" },
      include: {
        program: true,
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /** GET /client/me */
  async getMe(requestUser: RequestUser) {
    const { user, clientProfile } = await this.getClientContext(
      requestUser.clerkId,
    );

    await this.ensureInvitationAccepted(user.id, user.email, clientProfile.id);

    const activeAssignment = await this.prisma.coachClientAssignment.findFirst({
      where: { clientId: clientProfile.id, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
      include: {
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const invitation = await this.resolveActiveInvitation(
      user.email,
      clientProfile.activeProgramId,
    );

    const totalLogs = await this.prisma.workoutLog.count({
      where: { clientId: clientProfile.id },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      profile: {
        id: clientProfile.id,
        goals: clientProfile.goals,
        heightCm: clientProfile.heightCm,
        weightKg: clientProfile.weightKg,
      },
      coach: activeAssignment
        ? {
            id: activeAssignment.coach.user.id,
            firstName: activeAssignment.coach.user.firstName,
            lastName: activeAssignment.coach.user.lastName,
            email: activeAssignment.coach.user.email,
            startedAt: activeAssignment.startedAt,
          }
        : null,
      activeProgram: invitation?.program
        ? {
            id: invitation.program.id,
            name: invitation.program.name,
            description: invitation.program.description,
            durationWeeks:
              invitation.durationWeeks ?? invitation.program.durationWeeks,
            startDate: invitation.startDate,
            difficulty: invitation.program.difficulty,
          }
        : null,
      stats: {
        totalWorkoutsLogged: totalLogs,
      },
    };
  }

  /** GET /client/program — full week-by-week view */
  async getActiveProgram(requestUser: RequestUser) {
    const { user, clientProfile } = await this.getClientContext(
      requestUser.clerkId,
    );

    await this.ensureInvitationAccepted(user.id, user.email, clientProfile.id);

    const invitation = await this.resolveActiveInvitation(
      user.email,
      clientProfile.activeProgramId,
    );
    if (!invitation?.programId) {
      return null;
    }

    const program = await this.prisma.program.findUnique({
      where: { id: invitation.programId },
      include: {
        sessions: {
          orderBy: [{ weekNumber: "asc" }, { dayNumber: "asc" }],
          include: {
            _count: { select: { exercises: true } },
            workoutLogs: {
              where: { clientId: clientProfile.id },
              select: { id: true, performedAt: true },
              orderBy: { performedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });
    if (!program) return null;

    return {
      id: program.id,
      name: program.name,
      description: program.description,
      durationWeeks: invitation.durationWeeks ?? program.durationWeeks,
      difficulty: program.difficulty,
      startDate: invitation.startDate,
      sessions: program.sessions.map((s) => ({
        id: s.id,
        weekNumber: s.weekNumber,
        dayNumber: s.dayNumber,
        name: s.name,
        notes: s.notes,
        estimatedDurationMin: s.estimatedDurationMin,
        exerciseCount: s._count.exercises,
        lastLoggedAt: s.workoutLogs[0]?.performedAt ?? null,
        completed: s.workoutLogs.length > 0,
      })),
    };
  }

  /** GET /client/sessions/:id */
  async getSession(sessionId: string, requestUser: RequestUser) {
    const { user, clientProfile } = await this.getClientContext(
      requestUser.clerkId,
    );

    const invitation = await this.resolveActiveInvitation(
      user.email,
      clientProfile.activeProgramId,
    );
    if (!invitation?.programId) {
      throw new ForbiddenException("No active program is assigned to you");
    }

    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: {
        program: { select: { id: true, name: true } },
        exercises: {
          orderBy: { orderIndex: "asc" },
          include: { exercise: true },
        },
        workoutLogs: {
          where: { clientId: clientProfile.id },
          orderBy: { performedAt: "desc" },
          take: 1,
          include: { sets: true },
        },
      },
    });
    if (!session) throw new NotFoundException("Session not found");

    // Tenant check: client may only view sessions of their assigned program.
    if (session.programId !== invitation.programId) {
      throw new ForbiddenException("This session is not part of your program");
    }

    return {
      id: session.id,
      weekNumber: session.weekNumber,
      dayNumber: session.dayNumber,
      name: session.name,
      notes: session.notes,
      estimatedDurationMin: session.estimatedDurationMin,
      program: session.program,
      exercises: session.exercises.map((se) => ({
        id: se.id,
        orderIndex: se.orderIndex,
        sets: se.sets,
        reps: se.reps,
        rest: se.rest,
        notes: se.notes,
        exercise: {
          id: se.exercise.id,
          name: se.exercise.name,
          primaryMuscle: se.exercise.primaryMuscle,
          equipment: se.exercise.equipment,
          videoUrl: se.exercise.videoUrl,
          imageUrl: se.exercise.imageUrl,
          description: se.exercise.description,
        },
      })),
      lastLog: session.workoutLogs[0]
        ? {
            id: session.workoutLogs[0].id,
            performedAt: session.workoutLogs[0].performedAt,
            notes: session.workoutLogs[0].notes,
            sets: session.workoutLogs[0].sets,
          }
        : null,
    };
  }

  /** POST /client/sessions/:id/log */
  async logSession(
    sessionId: string,
    input: LogSessionInput,
    requestUser: RequestUser,
  ) {
    const { user, clientProfile } = await this.getClientContext(
      requestUser.clerkId,
    );

    const invitation = await this.resolveActiveInvitation(
      user.email,
      clientProfile.activeProgramId,
    );
    if (!invitation?.programId) {
      throw new ForbiddenException("No active program is assigned to you");
    }

    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
      select: { id: true, programId: true },
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.programId !== invitation.programId) {
      throw new ForbiddenException("This session is not part of your program");
    }

    // Validate that every set's exerciseId actually belongs to this session.
    if (input.sets && input.sets.length > 0) {
      const validExerciseIds = await this.prisma.workoutSessionExercise
        .findMany({
          where: { sessionId },
          select: { exerciseId: true },
        })
        .then((rows) => new Set(rows.map((r) => r.exerciseId)));

      for (const set of input.sets) {
        if (!validExerciseIds.has(set.exerciseId)) {
          throw new BadRequestException(
            `Exercise ${set.exerciseId} is not part of this session`,
          );
        }
      }
    }

    const log = await this.prisma.workoutLog.create({
      data: {
        clientId: clientProfile.id,
        sessionId,
        notes: input.notes ?? null,
        sets: input.sets
          ? {
              create: input.sets.map((s) => ({
                exerciseId: s.exerciseId,
                setNumber: s.setNumber,
                reps: s.reps ?? null,
                weightKg: s.weightKg ?? null,
                rpe: s.rpe ?? null,
                notes: s.notes ?? null,
              })),
            }
          : undefined,
      },
      include: { sets: true },
    });

    return log;
  }

  /** GET /client/history */
  async getHistory(requestUser: RequestUser, limit = 20) {
    const { clientProfile } = await this.getClientContext(requestUser.clerkId);

    const logs = await this.prisma.workoutLog.findMany({
      where: { clientId: clientProfile.id },
      orderBy: { performedAt: "desc" },
      take: limit,
      include: {
        session: {
          select: {
            id: true,
            name: true,
            weekNumber: true,
            dayNumber: true,
            program: { select: { id: true, name: true } },
          },
        },
        _count: { select: { sets: true } },
      },
    });

    return logs.map((l) => ({
      id: l.id,
      performedAt: l.performedAt,
      notes: l.notes,
      setCount: l._count.sets,
      session: l.session,
    }));
  }
}
