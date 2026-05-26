import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

interface CreateScheduleInput {
  clientUserId: string;
  name: string;
  startDate: string;
  endDate?: string;
}

interface UpdateScheduleInput {
  name?: string;
  startDate?: string;
  endDate?: string | null;
}

interface SetDayInput {
  date: string;
  workoutSessionId: string | null;
  notes?: string | null;
}

interface DuplicateScheduleInput {
  startDate: string;
  name?: string;
  /** If omitted, the duplicate is made for the same client as the source. */
  clientUserId?: string;
}

function toDateOnly(value: string): Date {
  // Treat incoming YYYY-MM-DD strings as UTC midnight so they survive the
  // round trip without timezone drift in the @db.Date column.
  const d = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`Invalid date: ${value}`);
  }
  return d;
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the caller's CoachProfile id, lazily creating one for ADMIN /
   * SUPER_ADMIN users so a gym owner can author schedules without a separate
   * coach persona. Mirrors the same helper used in programs/invitations.
   */
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

  /** SUPER_ADMIN: any. ADMIN: same org. COACH: schedules they own. */
  private async assertCanAccessSchedule(
    scheduleId: string,
    requestUser: RequestUser,
  ) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule) throw new NotFoundException("Schedule not found");

    if (requestUser.role === UserRole.SUPER_ADMIN) return schedule;

    if (requestUser.role === UserRole.ADMIN) {
      if (
        !requestUser.organizationId ||
        schedule.organizationId !== requestUser.organizationId
      ) {
        throw new ForbiddenException(
          "This schedule does not belong to your organization",
        );
      }
      return schedule;
    }

    const coachId = await this.getOrCreateCoachProfileId(requestUser);
    if (schedule.coachId !== coachId) {
      throw new ForbiddenException("You can only access your own schedules");
    }
    return schedule;
  }

  async listMine(requestUser: RequestUser) {
    if (requestUser.role === UserRole.SUPER_ADMIN) {
      return this.prisma.schedule.findMany({
        orderBy: { createdAt: "desc" },
        include: this.listInclude(),
      });
    }

    if (requestUser.role === UserRole.ADMIN) {
      if (!requestUser.organizationId) return [];
      return this.prisma.schedule.findMany({
        where: { organizationId: requestUser.organizationId },
        orderBy: { createdAt: "desc" },
        include: this.listInclude(),
      });
    }

    const coachId = await this.getOrCreateCoachProfileId(requestUser);
    return this.prisma.schedule.findMany({
      where: { coachId },
      orderBy: { createdAt: "desc" },
      include: this.listInclude(),
    });
  }

  async findOne(id: string, requestUser: RequestUser) {
    await this.assertCanAccessSchedule(id, requestUser);
    return this.prisma.schedule.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
        coach: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
        days: {
          orderBy: { date: "asc" },
          include: {
            workoutSession: {
              select: {
                id: true,
                name: true,
                estimatedDurationMin: true,
                program: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  }

  async create(input: CreateScheduleInput, requestUser: RequestUser) {
    if (!input.name?.trim()) {
      throw new BadRequestException("Schedule name is required");
    }
    if (!input.startDate) {
      throw new BadRequestException("Start date is required");
    }

    const coachId = await this.getOrCreateCoachProfileId(requestUser);

    // Resolve the target client and confirm authority.
    const clientUser = await this.prisma.user.findFirst({
      where: {
        id: input.clientUserId,
        role: UserRole.CLIENT,
        deletedAt: null,
      },
      include: { clientProfile: true },
    });
    if (!clientUser) throw new NotFoundException("Client not found");

    if (requestUser.role === UserRole.ADMIN) {
      if (
        !requestUser.organizationId ||
        clientUser.organizationId !== requestUser.organizationId
      ) {
        throw new ForbiddenException("Client is not in your organization");
      }
    } else if (requestUser.role === UserRole.COACH) {
      // Coach must have an active assignment with this client.
      const clientProfileId = clientUser.clientProfile?.id;
      if (!clientProfileId) {
        throw new ForbiddenException("Client has no profile yet");
      }
      const link = await this.prisma.coachClientAssignment.findFirst({
        where: { coachId, clientId: clientProfileId, status: "ACTIVE" },
      });
      if (!link) {
        throw new ForbiddenException(
          "This client is not on your active roster",
        );
      }
    }

    const clientProfile =
      clientUser.clientProfile ??
      (await this.prisma.clientProfile.create({
        data: { userId: clientUser.id },
      }));

    return this.prisma.schedule.create({
      data: {
        name: input.name.trim(),
        startDate: toDateOnly(input.startDate),
        endDate: input.endDate ? toDateOnly(input.endDate) : null,
        clientId: clientProfile.id,
        coachId,
        organizationId: requestUser.organizationId ?? null,
      },
    });
  }

  async update(
    id: string,
    input: UpdateScheduleInput,
    requestUser: RequestUser,
  ) {
    await this.assertCanAccessSchedule(id, requestUser);
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new BadRequestException("Schedule name cannot be empty");
      }
      data.name = input.name.trim();
    }
    if (input.startDate !== undefined) {
      data.startDate = toDateOnly(input.startDate);
    }
    if (input.endDate !== undefined) {
      data.endDate = input.endDate ? toDateOnly(input.endDate) : null;
    }
    return this.prisma.schedule.update({ where: { id }, data });
  }

  async remove(id: string, requestUser: RequestUser) {
    await this.assertCanAccessSchedule(id, requestUser);
    await this.prisma.schedule.delete({ where: { id } });
    return { id };
  }

  /**
   * Clone a schedule's layout (its ScheduleDay rows) onto a new start date,
   * optionally for a different client. Day dates are shifted by the offset
   * between the new and the source start date so the relative pattern is
   * preserved (e.g. rest days, push/pull cadence). Completion state and notes
   * specific to the original run are not carried over — the new schedule
   * starts fresh.
   */
  async duplicate(
    sourceId: string,
    input: DuplicateScheduleInput,
    requestUser: RequestUser,
  ) {
    if (!input.startDate) {
      throw new BadRequestException("Start date is required");
    }

    const source = await this.assertCanAccessSchedule(sourceId, requestUser);
    const sourceDays = await this.prisma.scheduleDay.findMany({
      where: { scheduleId: sourceId },
      orderBy: { date: "asc" },
      select: { date: true, workoutSessionId: true },
    });

    const coachId = await this.getOrCreateCoachProfileId(requestUser);

    // Resolve target client. Default: same client as the source.
    let targetClientProfileId = source.clientId;
    let targetOrgId = source.organizationId;
    if (input.clientUserId) {
      const targetUser = await this.prisma.user.findFirst({
        where: {
          id: input.clientUserId,
          role: UserRole.CLIENT,
          deletedAt: null,
        },
        include: { clientProfile: true },
      });
      if (!targetUser?.clientProfile) {
        throw new NotFoundException("Target client not found");
      }

      // Authority check matches `create`.
      if (requestUser.role === UserRole.ADMIN) {
        if (
          !requestUser.organizationId ||
          targetUser.organizationId !== requestUser.organizationId
        ) {
          throw new ForbiddenException(
            "Target client is not in your organization",
          );
        }
      } else if (requestUser.role === UserRole.COACH) {
        const link = await this.prisma.coachClientAssignment.findFirst({
          where: {
            coachId,
            clientId: targetUser.clientProfile.id,
            status: "ACTIVE",
          },
        });
        if (!link) {
          throw new ForbiddenException(
            "Target client is not on your active roster",
          );
        }
      }

      targetClientProfileId = targetUser.clientProfile.id;
      targetOrgId = targetUser.organizationId ?? requestUser.organizationId ?? null;
    }

    const newStart = toDateOnly(input.startDate);
    const sourceStart = source.startDate;
    const offsetMs = newStart.getTime() - sourceStart.getTime();

    // Shift the optional end date by the same offset so the schedule keeps
    // its original length when carried over.
    const newEnd =
      source.endDate != null
        ? new Date(source.endDate.getTime() + offsetMs)
        : null;

    const fallbackName = `Copy of ${source.name}`;
    const name = (input.name ?? fallbackName).trim() || fallbackName;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.schedule.create({
        data: {
          name,
          startDate: newStart,
          endDate: newEnd,
          clientId: targetClientProfileId,
          coachId,
          organizationId: targetOrgId,
        },
      });

      if (sourceDays.length > 0) {
        await tx.scheduleDay.createMany({
          data: sourceDays.map((d) => ({
            scheduleId: created.id,
            date: new Date(d.date.getTime() + offsetMs),
            workoutSessionId: d.workoutSessionId,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });
  }

  /**
   * Upsert a single day in the schedule. `workoutSessionId: null` clears
   * the slot (rest day).
   */
  async setDay(
    scheduleId: string,
    input: SetDayInput,
    requestUser: RequestUser,
  ) {
    const schedule = await this.assertCanAccessSchedule(scheduleId, requestUser);
    const date = toDateOnly(input.date);

    // Validate the session exists and is accessible if one was provided.
    if (input.workoutSessionId) {
      const session = await this.prisma.workoutSession.findUnique({
        where: { id: input.workoutSessionId },
        include: { program: true },
      });
      if (!session) throw new NotFoundException("Workout session not found");

      if (requestUser.role === UserRole.ADMIN) {
        if (
          !requestUser.organizationId ||
          session.program.organizationId !== requestUser.organizationId
        ) {
          throw new ForbiddenException(
            "Session belongs to a different organization",
          );
        }
      } else if (requestUser.role === UserRole.COACH) {
        if (session.program.coachId !== schedule.coachId) {
          throw new ForbiddenException("Session is not in your program library");
        }
      }
    }

    return this.prisma.scheduleDay.upsert({
      where: { scheduleId_date: { scheduleId, date } },
      create: {
        scheduleId,
        date,
        workoutSessionId: input.workoutSessionId,
        notes: input.notes ?? null,
      },
      update: {
        workoutSessionId: input.workoutSessionId,
        notes: input.notes ?? undefined,
      },
    });
  }

  async clearDay(
    scheduleId: string,
    dateStr: string,
    requestUser: RequestUser,
  ) {
    await this.assertCanAccessSchedule(scheduleId, requestUser);
    const date = toDateOnly(dateStr);
    await this.prisma.scheduleDay.deleteMany({
      where: { scheduleId, date },
    });
    return { ok: true };
  }

  private listInclude() {
    return {
      client: {
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      },
      _count: { select: { days: true } },
    };
  }
}
