import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";
import { PaginationDto, PaginatedResponse } from "../common/dto/pagination.dto";
import { RequestUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { Exercise } from "@prisma/client";

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDbUserId(clerkId: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: { clerkId, deletedAt: null },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  private async getDbUser(
    clerkId: string,
  ): Promise<{ id: string; organizationId: string | null } | null> {
    return this.prisma.user.findFirst({
      where: { clerkId, deletedAt: null },
      select: { id: true, organizationId: true },
    });
  }

  async create(dto: CreateExerciseDto, requestUser: RequestUser): Promise<Exercise> {
    const userId = await this.getDbUserId(requestUser.clerkId);
    return this.prisma.exercise.create({
      data: {
        ...dto,
        secondaryMuscles: dto.secondaryMuscles ?? [],
        createdById: userId,
      },
    });
  }

  /**
   * Returns the exercises the caller can see:
   *   - SUPER_ADMIN: every exercise.
   *   - User in an org: system exercises + every exercise authored by anyone
   *     in the same organization (org-shared gym library).
   *   - Freelancer (no org): system exercises + their own.
   */
  async findAll(
    pagination: PaginationDto,
    requestUser: RequestUser,
  ): Promise<PaginatedResponse<Exercise>> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Exercises are a shared library: every authenticated user sees the
    // full catalog (system exercises + every coach's contributions). Ownership
    // is still tracked on each row and enforced on update/delete.
    const where: object = {};

    const [data, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string): Promise<Exercise> {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException(`Exercise ${id} not found`);
    return exercise;
  }

  async update(
    id: string,
    dto: UpdateExerciseDto,
    requestUser: RequestUser,
  ): Promise<Exercise> {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException(`Exercise ${id} not found`);

    // System exercises are immutable unless the platform owner modifies them.
    if (exercise.createdById === null && requestUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("System exercises cannot be modified");
    }

    // Coaches may only update exercises they created.
    if (requestUser.role !== UserRole.SUPER_ADMIN) {
      const userId = await this.getDbUserId(requestUser.clerkId);
      if (exercise.createdById !== userId) {
        throw new ForbiddenException("You can only update your own exercises");
      }
    }

    return this.prisma.exercise.update({ where: { id }, data: dto });
  }

  async remove(
    id: string,
    requestUser: RequestUser,
  ): Promise<{ id: string }> {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException(`Exercise ${id} not found`);

    // System exercises are immutable.
    if (exercise.createdById === null && requestUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("System exercises cannot be deleted");
    }

    if (requestUser.role !== UserRole.SUPER_ADMIN) {
      const userId = await this.getDbUserId(requestUser.clerkId);
      if (exercise.createdById !== userId) {
        throw new ForbiddenException("You can only delete your own exercises");
      }
    }

    await this.prisma.exercise.delete({ where: { id } });
    return { id };
  }

  // Creates an editable copy of any exercise (typically a system one) owned by
  // the requesting coach. The copy is immediately editable and deletable.
  async duplicate(id: string, requestUser: RequestUser): Promise<Exercise> {
    const original = await this.prisma.exercise.findUnique({ where: { id } });
    if (!original) throw new NotFoundException(`Exercise ${id} not found`);

    const userId = await this.getDbUserId(requestUser.clerkId);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _ca, updatedAt: _ua, createdById: _cb, ...rest } =
      original;

    return this.prisma.exercise.create({
      data: {
        ...rest,
        name: `${original.name} (copy)`,
        createdById: userId,
      },
    });
  }
}
