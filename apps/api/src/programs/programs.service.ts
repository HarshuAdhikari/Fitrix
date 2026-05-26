import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { RequestUser } from "../auth/decorators/current-user.decorator";
import { UserRole, Program } from "@prisma/client";

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getCoachProfileId(clerkId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { clerkId, deletedAt: null },
      include: { coachProfile: true },
    });

    if (!user?.coachProfile) {
      throw new ForbiddenException("Coach profile not found for this user");
    }

    return user.coachProfile.id;
  }

  /**
   * Returns the coach profile id for the caller, lazily creating one for
   * ADMIN users so a gym owner can author programs without a separate coach
   * persona. COACH users without a profile still error (they're misconfigured).
   */
  private async getOrCreateCoachProfileId(
    requestUser: RequestUser,
  ): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { clerkId: requestUser.clerkId, deletedAt: null },
      include: { coachProfile: true },
    });
    if (!user) {
      throw new ForbiddenException("User not found");
    }
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
   * Centralised tenant authorisation for a single Program.
   *
   * - SUPER_ADMIN: unrestricted (platform owner).
   * - ADMIN (gym/business owner): may act on programs whose
   *   `organizationId` matches their own org.
   * - COACH: may act on programs they personally own (`coachId`).
   *   Defence-in-depth: if both the coach and the program have an
   *   `organizationId` set and they differ, deny.
   */
  private async assertCanAccessProgram(
    program: Program,
    requestUser: RequestUser,
  ): Promise<void> {
    if (requestUser.role === UserRole.SUPER_ADMIN) return;

    if (requestUser.role === UserRole.ADMIN) {
      if (
        !requestUser.organizationId ||
        program.organizationId !== requestUser.organizationId
      ) {
        throw new ForbiddenException(
          "This program does not belong to your organization",
        );
      }
      return;
    }

    // COACH (and any future non-admin role with a coach profile).
    const coachId = await this.getCoachProfileId(requestUser.clerkId);
    if (program.coachId !== coachId) {
      throw new ForbiddenException("You can only access your own programs");
    }
    if (
      requestUser.organizationId &&
      program.organizationId &&
      program.organizationId !== requestUser.organizationId
    ) {
      throw new ForbiddenException(
        "This program belongs to a different organization",
      );
    }
  }

  async create(dto: CreateProgramDto, requestUser: RequestUser): Promise<Program> {
    const coachId = await this.getOrCreateCoachProfileId(requestUser);

    return this.prisma.program.create({
      data: {
        ...dto,
        coachId,
        // SUPER_ADMIN may pass an explicit org for cross-tenant tooling.
        // All other roles are pinned to their own org — they cannot create
        // programs inside someone else's organization.
        organizationId:
          requestUser.role === UserRole.SUPER_ADMIN
            ? dto.organizationId
            : requestUser.organizationId,
        durationWeeks: dto.durationWeeks ?? 4,
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
    requestUser: RequestUser,
  ): Promise<PaginatedResponse<Program>> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Build a tenant-aware where clause. Each role gets a different scope.
    let where: { coachId?: string; organizationId?: string } = {};

    if (requestUser.role === UserRole.SUPER_ADMIN) {
      // Platform owner: no scope.
      where = {};
    } else if (requestUser.role === UserRole.ADMIN) {
      // Gym owner: every program inside their organization, regardless of coach.
      if (!requestUser.organizationId) {
        return { data: [], total: 0, page, pageSize };
      }
      where = { organizationId: requestUser.organizationId };
    } else {
      // Coach (and others with a coach profile): only their own programs.
      const coachId = await this.getCoachProfileId(requestUser.clerkId);
      where = { coachId };
    }

    const [data, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { sessions: true } } },
      }),
      this.prisma.program.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string, requestUser: RequestUser): Promise<Program> {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        sessions: {
          include: { exercises: { include: { exercise: true } } },
          orderBy: [{ weekNumber: "asc" }, { dayNumber: "asc" }],
        },
      },
    });

    if (!program) throw new NotFoundException(`Program ${id} not found`);

    await this.assertCanAccessProgram(program, requestUser);

    return program;
  }

  async update(
    id: string,
    dto: UpdateProgramDto,
    requestUser: RequestUser,
  ): Promise<Program> {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException(`Program ${id} not found`);

    await this.assertCanAccessProgram(program, requestUser);

    return this.prisma.program.update({ where: { id }, data: dto });
  }

  async remove(id: string, requestUser: RequestUser): Promise<{ id: string }> {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException(`Program ${id} not found`);

    await this.assertCanAccessProgram(program, requestUser);

    await this.prisma.program.delete({ where: { id } });
    return { id };
  }
}
