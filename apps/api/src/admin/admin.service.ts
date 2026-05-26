import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClerkClient } from "@clerk/backend";
import { PrismaService } from "../prisma/prisma.service";
import { RedisCacheService } from "../cache/redis-cache.service";
import { UserRole } from "@prisma/client";

const STATS_CACHE_KEY = "admin:platform-stats";
// 5 minutes — stats don't need to be real-time on the admin dashboard
const STATS_CACHE_TTL = 300;

export interface CreateCoachInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  timezone?: string;
}

export interface UpdateCoachInput {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  bio?: string | null;
  specialties?: string[];
  yearsOfExperience?: number | null;
  timezone?: string | null;
}

function cleanOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cache: RedisCacheService,
  ) {}

  async getPlatformStats() {
    const cached = await this.cache.get<ReturnType<typeof this._fetchPlatformStats>>(
      STATS_CACHE_KEY,
    );
    if (cached) return cached;

    const stats = await this._fetchPlatformStats();
    await this.cache.set(STATS_CACHE_KEY, stats, STATS_CACHE_TTL);
    return stats;
  }

  private async _fetchPlatformStats() {
    const [
      totalUsers,
      totalSuperAdmins,
      totalAdmins,
      totalCoaches,
      totalClients,
      totalPrograms,
      totalExercises,
      totalOrganizations,
      pendingInvitations,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { role: "SUPER_ADMIN", deletedAt: null } }),
      this.prisma.user.count({ where: { role: "ADMIN", deletedAt: null } }),
      this.prisma.user.count({ where: { role: "COACH", deletedAt: null } }),
      this.prisma.user.count({ where: { role: "CLIENT", deletedAt: null } }),
      this.prisma.program.count(),
      this.prisma.exercise.count(),
      this.prisma.organization.count(),
      this.prisma.invitation.count({ where: { status: "PENDING" } }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersThisMonth = await this.prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
    });

    return {
      totalUsers,
      totalSuperAdmins,
      totalAdmins,
      totalCoaches,
      totalClients,
      totalPrograms,
      totalExercises,
      totalOrganizations,
      pendingInvitations,
      newUsersThisMonth,
    };
  }

  async getCoaches() {
    const coaches = await this.prisma.user.findMany({
      where: { role: "COACH", organizationId: null, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        organizationId: true,
        createdAt: true,
        coachProfile: {
          select: {
            id: true,
            bio: true,
            specialties: true,
            yearsOfExperience: true,
            timezone: true,
            _count: {
              select: {
                clients: true,
                programs: true,
                invitations: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return coaches.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      organizationId: u.organizationId,
      createdAt: u.createdAt,
      hasProfile: !!u.coachProfile,
      clientCount: u.coachProfile?._count.clients ?? 0,
      programCount: u.coachProfile?._count.programs ?? 0,
      invitationCount: u.coachProfile?._count.invitations ?? 0,
      bio: u.coachProfile?.bio ?? null,
      specialties: u.coachProfile?.specialties ?? [],
      yearsOfExperience: u.coachProfile?.yearsOfExperience ?? null,
      timezone: u.coachProfile?.timezone ?? null,
    }));
  }

  async createCoach(input: CreateCoachInput) {
    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new BadRequestException("Invalid email address");
    }
    if (input.password.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("A user with this email already exists");
    }

    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
    if (!secretKey) {
      throw new InternalServerErrorException("Clerk secret key not configured");
    }
    const clerkClient = createClerkClient({ secretKey });

    const firstName = cleanOptional(input.firstName);
    const lastName = cleanOptional(input.lastName);
    const phone = cleanOptional(input.phone);

    let clerkUser: Awaited<ReturnType<typeof clerkClient.users.createUser>>;
    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        password: input.password,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        publicMetadata: { role: UserRole.COACH },
      });
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        "Failed to create Clerk account";
      throw new BadRequestException(msg);
    }

    const user = await this.prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      create: {
        clerkId: clerkUser.id,
        email,
        firstName,
        lastName,
        phone,
        role: UserRole.COACH,
        organizationId: null,
      },
      update: {
        email,
        firstName,
        lastName,
        phone,
        role: UserRole.COACH,
        organizationId: null,
        deletedAt: null,
      },
    });

    await this.prisma.coachProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: cleanOptional(input.bio),
        specialties: input.specialties ?? [],
        yearsOfExperience: input.yearsOfExperience ?? null,
        timezone: cleanOptional(input.timezone),
      },
      create: {
        userId: user.id,
        bio: cleanOptional(input.bio),
        specialties: input.specialties ?? [],
        yearsOfExperience: input.yearsOfExperience ?? null,
        timezone: cleanOptional(input.timezone),
      },
    });

    await this.cache.del(STATS_CACHE_KEY);

    return {
      ...(await this.getCoachDetail(user.id)),
      temporaryPassword: input.password,
    };
  }

  async getCoachDetail(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.COACH, organizationId: null, deletedAt: null },
      include: {
        coachProfile: {
          include: {
            programs: {
              take: 10,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                name: true,
                durationWeeks: true,
                difficulty: true,
                createdAt: true,
              },
            },
            invitations: {
              take: 10,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                email: true,
                status: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                clients: true,
                programs: true,
                invitations: true,
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException("Independent coach not found");

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      coachProfile: user.coachProfile
        ? {
            id: user.coachProfile.id,
            bio: user.coachProfile.bio,
            specialties: user.coachProfile.specialties,
            yearsOfExperience: user.coachProfile.yearsOfExperience,
            timezone: user.coachProfile.timezone,
            clientCount: user.coachProfile._count.clients,
            programCount: user.coachProfile._count.programs,
            invitationCount: user.coachProfile._count.invitations,
            programs: user.coachProfile.programs,
            invitations: user.coachProfile.invitations,
          }
        : null,
    };
  }

  async updateCoach(id: string, input: UpdateCoachInput) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.COACH, organizationId: null, deletedAt: null },
      include: { coachProfile: true },
    });
    if (!user) throw new NotFoundException("Independent coach not found");

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          firstName:
            input.firstName === undefined
              ? undefined
              : cleanOptional(input.firstName),
          lastName:
            input.lastName === undefined ? undefined : cleanOptional(input.lastName),
          phone: input.phone === undefined ? undefined : cleanOptional(input.phone),
        },
      });

      await tx.coachProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          bio: cleanOptional(input.bio),
          specialties: input.specialties ?? [],
          yearsOfExperience: input.yearsOfExperience ?? null,
          timezone: cleanOptional(input.timezone),
        },
        update: {
          bio: input.bio === undefined ? undefined : cleanOptional(input.bio),
          specialties: input.specialties,
          yearsOfExperience: input.yearsOfExperience,
          timezone:
            input.timezone === undefined ? undefined : cleanOptional(input.timezone),
        },
      });
    });

    return this.getCoachDetail(id);
  }

  async deleteCoach(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new ForbiddenException("You cannot delete yourself");
    }
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.COACH, organizationId: null, deletedAt: null },
    });
    if (!user) throw new NotFoundException("Independent coach not found");

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.cache.del(
      `user:clerkId:${user.clerkId}`,
      STATS_CACHE_KEY,
    );
    return { id };
  }

  async deleteUser(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new ForbiddenException("You cannot delete yourself");
    }
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException("User not found");

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Super-admins cannot be deleted");
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.cache.del(`user:clerkId:${user.clerkId}`, STATS_CACHE_KEY);
    return { id };
  }

  async getInvitations(page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize;
    const [invitations, total] = await Promise.all([
      this.prisma.invitation.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          coach: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          program: { select: { id: true, name: true } },
        },
      }),
      this.prisma.invitation.count(),
    ]);

    const now = new Date();
    return {
      data: invitations.map((i) => ({
        id: i.id,
        email: i.email,
        firstName: i.firstName,
        lastName: i.lastName,
        status:
          i.status === "PENDING" && i.expiresAt < now ? "EXPIRED" : i.status,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
        acceptedAt: i.acceptedAt,
        coach: i.coach.user,
        program: i.program,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getBillingOverview() {
    const [
      totalRevenue,
      pendingRevenue,
      failedRevenue,
      activeSubscriptions,
      pastDueSubscriptions,
      cancelledSubscriptions,
      recentPayments,
      recentInvoices,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amountCents: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: "PENDING" },
        _sum: { amountCents: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: "FAILED" },
        _sum: { amountCents: true },
      }),
      this.prisma.subscription.count({ where: { status: "ACTIVE" } }),
      this.prisma.subscription.count({ where: { status: "PAST_DUE" } }),
      this.prisma.subscription.count({ where: { status: "CANCELLED" } }),
      this.prisma.payment.findMany({
        take: 25,
        orderBy: { createdAt: "desc" },
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
            },
          },
        },
      }),
      this.prisma.invoice.findMany({
        take: 10,
        orderBy: { issuedAt: "desc" },
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
            },
          },
        },
      }),
    ]);

    return {
      totals: {
        paidCents: totalRevenue._sum.amountCents ?? 0,
        pendingCents: pendingRevenue._sum.amountCents ?? 0,
        failedCents: failedRevenue._sum.amountCents ?? 0,
        activeSubscriptions,
        pastDueSubscriptions,
        cancelledSubscriptions,
      },
      payments: recentPayments.map((p) => ({
        id: p.id,
        amountCents: p.amountCents,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        providerRef: p.providerRef,
        createdAt: p.createdAt,
        client: p.client.user,
      })),
      invoices: recentInvoices.map((i) => ({
        id: i.id,
        number: i.number,
        totalCents: i.totalCents,
        currency: i.currency,
        issuedAt: i.issuedAt,
        pdfUrl: i.pdfUrl,
        client: i.client.user,
      })),
    };
  }

  async getAuditLog() {
    const [users, invitations, payments, automationRuns] = await Promise.all([
      this.prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.invitation.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          coach: {
            include: {
              user: { select: { email: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.payment.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          client: { include: { user: { select: { email: true } } } },
        },
      }),
      this.prisma.automationRun.findMany({
        take: 20,
        orderBy: { startedAt: "desc" },
        include: { automation: { select: { name: true, trigger: true } } },
      }),
    ]);

    const events = [
      ...users.map((u) => ({
        id: `user-${u.id}`,
        type: "USER_CREATED",
        title: `User created: ${u.email}`,
        detail: `Role: ${u.role}`,
        occurredAt: u.createdAt,
      })),
      ...invitations.map((i) => ({
        id: `invitation-${i.id}`,
        type: "INVITATION_CREATED",
        title: `Invitation sent to ${i.email}`,
        detail: `Coach: ${[i.coach.user.firstName, i.coach.user.lastName].filter(Boolean).join(" ") || i.coach.user.email}; Status: ${i.status}`,
        occurredAt: i.createdAt,
      })),
      ...payments.map((p) => ({
        id: `payment-${p.id}`,
        type: "PAYMENT_CREATED",
        title: `${p.status} payment for ${p.client.user.email}`,
        detail: `${p.currency} ${(p.amountCents / 100).toFixed(2)} via ${p.provider}`,
        occurredAt: p.createdAt,
      })),
      ...automationRuns.map((r) => ({
        id: `automation-${r.id}`,
        type: "AUTOMATION_RUN",
        title: `Automation run: ${r.automation.name}`,
        detail: `${r.automation.trigger}; ${r.success ? "Success" : "Failed"}`,
        occurredAt: r.startedAt,
      })),
    ];

    return events
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, 50);
  }

  async getSettings() {
    return {
      environment: this.config.get<string>("NODE_ENV") ?? "development",
      appUrl: this.config.get<string>("APP_URL") ?? "http://localhost:3000",
      apiPort: Number(this.config.get<string>("PORT") ?? 4000),
      email: {
        provider: "Resend",
        configured: !!this.config.get<string>("RESEND_API_KEY"),
        fromEmail:
          this.config.get<string>("RESEND_FROM_EMAIL") ??
          "onboarding@resend.dev",
      },
      auth: {
        provider: "Clerk",
        configured:
          !!this.config.get<string>("CLERK_SECRET_KEY") &&
          !!this.config.get<string>("CLERK_PUBLISHABLE_KEY"),
        webhooksConfigured: !!this.config.get<string>("CLERK_WEBHOOK_SECRET"),
      },
      database: {
        configured: !!this.config.get<string>("DATABASE_URL"),
      },
    };
  }

  async getUserSupportDetail(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        coachProfile: {
          include: {
            _count: {
              select: {
                clients: true,
                programs: true,
                invitations: true,
              },
            },
          },
        },
        clientProfile: {
          include: {
            _count: {
              select: {
                coaches: true,
                workoutLogs: true,
                mealLogs: true,
                payments: true,
              },
            },
          },
        },
        notifications: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            body: true,
            readAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      coachProfile: user.coachProfile
        ? {
            id: user.coachProfile.id,
            specialties: user.coachProfile.specialties,
            yearsOfExperience: user.coachProfile.yearsOfExperience,
            timezone: user.coachProfile.timezone,
            clientCount: user.coachProfile._count.clients,
            programCount: user.coachProfile._count.programs,
            invitationCount: user.coachProfile._count.invitations,
          }
        : null,
      clientProfile: user.clientProfile
        ? {
            id: user.clientProfile.id,
            goals: user.clientProfile.goals,
            heightCm: user.clientProfile.heightCm,
            weightKg: user.clientProfile.weightKg,
            coachCount: user.clientProfile._count.coaches,
            workoutLogCount: user.clientProfile._count.workoutLogs,
            mealLogCount: user.clientProfile._count.mealLogs,
            paymentCount: user.clientProfile._count.payments,
          }
        : null,
      notifications: user.notifications,
    };
  }

  async getAllUsers(page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
          coachProfile: { select: { id: true } },
          clientProfile: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
        isCoach: !!u.coachProfile,
        isClient: !!u.clientProfile,
      })),
      total,
      page,
      pageSize,
    };
  }

  async updateUserRole(targetId: string, role: UserRole, requesterId: string) {
    if (targetId === requesterId) {
      throw new ForbiddenException("You cannot change your own role");
    }

    const user = await this.prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
    });
    if (!user) throw new NotFoundException(`User ${targetId} not found`);

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });

    if (role === UserRole.COACH) {
      await this.prisma.coachProfile.upsert({
        where: { userId: targetId },
        update: {},
        create: { userId: targetId },
      });
    }
    if (role === UserRole.CLIENT) {
      await this.prisma.clientProfile.upsert({
        where: { userId: targetId },
        update: {},
        create: { userId: targetId },
      });
    }

    await this.cache.del(`user:clerkId:${user.clerkId}`, STATS_CACHE_KEY);

    return updated;
  }

  async updateCoachEmail(id: string, newEmail: string) {
    const email = newEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      throw new BadRequestException("Invalid email address");
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const conflict = await this.prisma.user.findFirst({
      where: { email, NOT: { id } },
      select: { id: true },
    });
    if (conflict) throw new ConflictException("Email already in use");

    await this.prisma.user.update({ where: { id }, data: { email } });
    await this.cache.del(`user:clerkId:${user.clerkId}`);
    return { id, email };
  }

  async resetCoachPassword(id: string): Promise<{ temporaryPassword: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, clerkId: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
    if (!secretKey) {
      throw new InternalServerErrorException("Clerk not configured");
    }

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const temporaryPassword = Array.from(
      { length: 12 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");

    const clerkClient = createClerkClient({ secretKey });
    await clerkClient.users.updateUser(user.clerkId, {
      password: temporaryPassword,
      skipPasswordChecks: true,
    } as any);

    return { temporaryPassword };
  }

  async suspendCoach(targetId: string, requesterId: string) {
    if (targetId === requesterId) {
      throw new ForbiddenException("You cannot suspend yourself");
    }
    const user = await this.prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
    });
    if (!user) throw new NotFoundException(`User ${targetId} not found`);

    // Demote to CLIENT — coach profile data is preserved
    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role: "CLIENT" },
      select: { id: true, email: true, role: true, clerkId: true },
    });
    await this.cache.del(`user:clerkId:${user.clerkId}`);
    return { id: updated.id, email: updated.email, role: updated.role };
  }
}
