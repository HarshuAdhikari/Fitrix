import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RequestUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getCoachContext(clerkId: string) {
    const user = await this.prisma.user.findFirst({
      where: { clerkId, deletedAt: null },
      include: { coachProfile: true },
    });

    if (!user?.coachProfile) {
      throw new ForbiddenException("Coach profile not found for this user");
    }

    return { user, coachProfile: user.coachProfile };
  }

  private async getCoachProfileId(clerkId: string): Promise<string> {
    const { coachProfile } = await this.getCoachContext(clerkId);
    return coachProfile.id;
  }

  async findAll(requestUser: RequestUser) {
    const coachId = await this.getCoachProfileId(requestUser.clerkId);

    const assignments = await this.prisma.coachClientAssignment.findMany({
      where: { coachId, status: "ACTIVE" },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return assignments.map((a) => ({
      assignmentId: a.id,
      status: a.status,
      startedAt: a.startedAt,
      clientProfileId: a.client.id,
      user: a.client.user,
      goals: a.client.goals,
      heightCm: a.client.heightCm,
      weightKg: a.client.weightKg,
    }));
  }

  async findOne(clientUserId: string, requestUser: RequestUser) {
    const coachId = await this.getCoachProfileId(requestUser.clerkId);

    const clientUser = await this.prisma.user.findFirst({
      where: { id: clientUserId, deletedAt: null },
      include: { clientProfile: true },
    });

    if (!clientUser?.clientProfile) {
      throw new NotFoundException(`Client ${clientUserId} not found`);
    }

    const assignment = await this.prisma.coachClientAssignment.findFirst({
      where: {
        coachId,
        clientId: clientUser.clientProfile.id,
        status: "ACTIVE",
      },
    });

    if (!assignment && requestUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("This client is not assigned to you");
    }

    // Source of truth: ClientProfile.activeProgramId. We still optionally
    // peek at the latest matching invitation to surface a per-assignment
    // durationWeeks override; otherwise the program's default is used.
    const activeProgramId = clientUser.clientProfile.activeProgramId;
    let activeProgram: {
      id: string;
      name: string;
      difficulty: string;
      durationWeeks: number;
      startDate: Date | null;
    } | null = null;

    if (activeProgramId) {
      const program = await this.prisma.program.findUnique({
        where: { id: activeProgramId },
        select: {
          id: true,
          name: true,
          difficulty: true,
          durationWeeks: true,
        },
      });
      if (program) {
        const overrideInvitation = await this.prisma.invitation.findFirst({
          where: {
            email: clientUser.email.trim().toLowerCase(),
            status: "ACCEPTED",
            programId: activeProgramId,
          },
          orderBy: { acceptedAt: "desc" },
          select: { durationWeeks: true, startDate: true },
        });
        activeProgram = {
          id: program.id,
          name: program.name,
          difficulty: program.difficulty,
          durationWeeks:
            overrideInvitation?.durationWeeks ?? program.durationWeeks,
          startDate:
            overrideInvitation?.startDate ??
            clientUser.clientProfile.activeProgramStartedAt,
        };
      }
    } else {
      // Fallback for legacy rows where the column wasn't backfilled. Safe to
      // remove this branch once the migration has run everywhere.
      const legacy = await this.prisma.invitation.findFirst({
        where: {
          email: clientUser.email.trim().toLowerCase(),
          status: "ACCEPTED",
          programId: { not: null },
        },
        orderBy: { acceptedAt: "desc" },
        include: {
          program: {
            select: {
              id: true,
              name: true,
              difficulty: true,
              durationWeeks: true,
            },
          },
        },
      });
      if (legacy?.program) {
        activeProgram = {
          id: legacy.program.id,
          name: legacy.program.name,
          difficulty: legacy.program.difficulty,
          durationWeeks:
            legacy.durationWeeks ?? legacy.program.durationWeeks,
          startDate: legacy.startDate,
        };
      }
    }

    return {
      user: {
        id: clientUser.id,
        email: clientUser.email,
        firstName: clientUser.firstName,
        lastName: clientUser.lastName,
        createdAt: clientUser.createdAt,
      },
      profile: clientUser.clientProfile,
      assignment,
      activeProgram,
    };
  }

  async findLogs(clientUserId: string, requestUser: RequestUser, limit = 10) {
    const coachId = await this.getCoachProfileId(requestUser.clerkId);

    const clientUser = await this.prisma.user.findFirst({
      where: { id: clientUserId, deletedAt: null },
      include: { clientProfile: true },
    });

    if (!clientUser?.clientProfile) {
      throw new NotFoundException(`Client ${clientUserId} not found`);
    }

    const assignment = await this.prisma.coachClientAssignment.findFirst({
      where: {
        coachId,
        clientId: clientUser.clientProfile.id,
        status: "ACTIVE",
      },
    });

    if (!assignment && requestUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("This client is not assigned to you");
    }

    const logs = await this.prisma.workoutLog.findMany({
      where: { clientId: clientUser.clientProfile.id },
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
        sets: {
          orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
          include: { exercise: { select: { id: true, name: true } } },
        },
      },
    });

    return logs.map((l) => ({
      id: l.id,
      performedAt: l.performedAt,
      notes: l.notes,
      session: l.session,
      sets: l.sets.map((s) => ({
        id: s.id,
        exerciseId: s.exerciseId,
        exerciseName: s.exercise.name,
        setNumber: s.setNumber,
        reps: s.reps,
        weightKg: s.weightKg,
        rpe: s.rpe,
      })),
    }));
  }

  async assignProgramToClient(
    clientUserId: string,
    programId: string,
    requestUser: RequestUser,
    options: { startDate?: string; durationWeeks?: number } = {},
  ) {
    const { coachProfile } = await this.getCoachContext(requestUser.clerkId);
    const coachId = coachProfile.id;

    const clientUser = await this.prisma.user.findFirst({
      where: { id: clientUserId, deletedAt: null },
      include: { clientProfile: true },
    });
    if (!clientUser?.clientProfile) {
      throw new NotFoundException(`Client ${clientUserId} not found`);
    }

    const assignment = await this.prisma.coachClientAssignment.findFirst({
      where: {
        coachId,
        clientId: clientUser.clientProfile.id,
        status: "ACTIVE",
      },
    });
    if (!assignment && requestUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("This client is not assigned to you");
    }

    const program = await this.prisma.program.findFirst({
      where: { id: programId, coachId },
    });
    if (!program) {
      throw new NotFoundException("Program not found in your library");
    }

    const startDate = options.startDate ? new Date(options.startDate) : null;
    const durationWeeks = options.durationWeeks ?? program.durationWeeks;

    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      // Authoritative state: update the new ClientProfile.activeProgramId
      // column. The audit/history is still preserved via the Invitation row
      // below; readers will prefer the column.
      await tx.clientProfile.update({
        where: { id: clientUser.clientProfile!.id },
        data: {
          activeProgramId: program.id,
          activeProgramStartedAt: startDate ?? now,
        },
      });

      // Keep writing the ACCEPTED invitation for audit history and so older
      // readers that still derive from invitations stay correct during the
      // transition. Safe to remove this side-effect once we trust the column.
      const invitation = await tx.invitation.create({
        data: {
          token,
          coachId,
          email: clientUser.email,
          firstName: clientUser.firstName,
          lastName: clientUser.lastName,
          status: "ACCEPTED",
          acceptedAt: now,
          acceptedByUserId: clientUser.id,
          programId: program.id,
          startDate,
          durationWeeks,
          expiresAt: now,
        },
      });
      return { invitationId: invitation.id };
    });

    return {
      clientUserId: clientUser.id,
      programId: program.id,
      invitationId: result.invitationId,
    };
  }

  async assignClient(clientUserId: string, requestUser: RequestUser) {
    const { user, coachProfile } = await this.getCoachContext(
      requestUser.clerkId,
    );

    if (requestUser.role === UserRole.COACH && user.organizationId) {
      throw new ForbiddenException(
        "Organization coaches cannot add clients. Ask an organization admin to add the client and assign them to you.",
      );
    }

    const coachId = coachProfile.id;

    const clientUser = await this.prisma.user.findFirst({
      where: { id: clientUserId, deletedAt: null },
      include: { clientProfile: true },
    });

    if (!clientUser) {
      throw new NotFoundException(`User ${clientUserId} not found`);
    }

    let clientProfileId = clientUser.clientProfile?.id;

    if (!clientProfileId) {
      const profile = await this.prisma.clientProfile.create({
        data: { userId: clientUser.id },
      });
      clientProfileId = profile.id;
    }

    const existing = await this.prisma.coachClientAssignment.findFirst({
      where: { coachId, clientId: clientProfileId },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        throw new ConflictException("Client is already assigned to this coach");
      }
      return this.prisma.coachClientAssignment.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", startedAt: new Date(), endedAt: null },
      });
    }

    return this.prisma.coachClientAssignment.create({
      data: { coachId, clientId: clientProfileId, status: "ACTIVE" },
    });
  }

  async plansToAssign(requestUser: RequestUser) {
    const coachId = await this.getCoachProfileId(requestUser.clerkId);

    const assignments = await this.prisma.coachClientAssignment.findMany({
      where: { coachId, status: "ACTIVE" },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            workoutLogs: { take: 1, select: { id: true } },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return assignments
      .filter((a) => a.client.workoutLogs.length === 0)
      .map((a) => ({
        assignmentId: a.id,
        clientProfileId: a.client.id,
        startedAt: a.startedAt,
        user: a.client.user,
        goals: a.client.goals,
      }));
  }

  async removeClient(clientUserId: string, requestUser: RequestUser) {
    const { user, coachProfile } = await this.getCoachContext(
      requestUser.clerkId,
    );

    if (requestUser.role === UserRole.COACH && user.organizationId) {
      throw new ForbiddenException(
        "Organization coaches cannot remove clients. Ask an organization admin to manage the roster.",
      );
    }

    const coachId = coachProfile.id;

    const clientUser = await this.prisma.user.findFirst({
      where: { id: clientUserId, deletedAt: null },
      include: { clientProfile: true },
    });

    if (!clientUser?.clientProfile) {
      throw new NotFoundException(`Client ${clientUserId} not found`);
    }

    const assignment = await this.prisma.coachClientAssignment.findFirst({
      where: {
        coachId,
        clientId: clientUser.clientProfile.id,
        status: "ACTIVE",
      },
    });

    if (!assignment) {
      throw new NotFoundException("Active assignment not found");
    }

    return this.prisma.coachClientAssignment.update({
      where: { id: assignment.id },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  }
}
