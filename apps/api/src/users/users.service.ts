import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";
import { RequestUser } from "../auth/decorators/current-user.decorator";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(requestUser: RequestUser) {
    const where =
      requestUser.role === UserRole.SUPER_ADMIN
        ? { deletedAt: null }
        : {
            deletedAt: null,
            organizationId: requestUser.organizationId ?? "__unassigned__",
          };

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, requestUser: RequestUser) {
    const where =
      requestUser.role === UserRole.SUPER_ADMIN
        ? { id, deletedAt: null }
        : {
            id,
            deletedAt: null,
            organizationId: requestUser.organizationId ?? "__unassigned__",
          };

    const user = await this.prisma.user.findFirst({
      where,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        coachProfile: true,
        clientProfile: true,
      },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByClerkId(clerkId: string) {
    const user = await this.prisma.user.findFirst({
      where: { clerkId, deletedAt: null },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        coachProfile: true,
        clientProfile: true,
      },
    });

    if (!user) throw new NotFoundException(`User with clerkId ${clerkId} not found`);
    return user;
  }

  async getMe(requestUser: RequestUser) {
    return this.findByClerkId(requestUser.clerkId);
  }

  async getDashboardStats(requestUser: RequestUser) {
    const user = await this.prisma.user.findFirst({
      where: { clerkId: requestUser.clerkId, deletedAt: null },
      include: { coachProfile: true },
    });

    if (!user?.coachProfile) {
      return { activeClients: 0, programs: 0, sessionsThisWeek: 0 };
    }

    const coachId = user.coachProfile.id;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [activeClients, programs, sessionsThisWeek] = await Promise.all([
      this.prisma.coachClientAssignment.count({
        where: { coachId, status: "ACTIVE" },
      }),
      this.prisma.program.count({ where: { coachId } }),
      this.prisma.workoutLog.count({
        where: {
          performedAt: { gte: weekStart },
          client: {
            coaches: { some: { coachId, status: "ACTIVE" } },
          },
        },
      }),
    ]);

    return { activeClients, programs, sessionsThisWeek };
  }

  async updateRole(id: string, role: UserRole, requestUser: RequestUser) {
    if (requestUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Only super admins can update roles");
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        updatedAt: true,
      },
    });
  }
}
