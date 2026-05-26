import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClerkClient } from "@clerk/backend";
import { randomBytes } from "crypto";
import { OrganizationType, UserRole } from "@prisma/client";
import { RequestUser } from "../auth/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";

interface CreateOrganizationInput {
  name: string;
  slug?: string;
  type?: OrganizationType;
  contactEmail?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  ownerUserId?: string;
  ownerEmail?: string;
  ownerPassword?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerPhone?: string;
}

interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  type?: OrganizationType;
  contactEmail?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
}

const ORGANIZATION_TEAM_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.COACH,
  UserRole.CLIENT,
]);

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export interface CreateOrgMemberInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: "COACH" | "CLIENT";
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async listOrganizations() {
    const organizations = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        _count: {
          select: {
            users: true,
            programs: true,
          },
        },
        users: {
          where: { deletedAt: null },
          select: { role: true },
        },
      },
    });

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      contactEmail: org.contactEmail,
      phone: org.phone,
      website: org.website,
      addressLine1: org.addressLine1,
      addressLine2: org.addressLine2,
      city: org.city,
      state: org.state,
      postalCode: org.postalCode,
      country: org.country,
      notes: org.notes,
      owner: org.owner,
      userCount: org.users.length,
      programCount: org._count.programs,
      adminCount: org.users.filter((u) => u.role === UserRole.ADMIN).length,
      coachCount: org.users.filter((u) => u.role === UserRole.COACH).length,
      clientCount: org.users.filter((u) => u.role === UserRole.CLIENT).length,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }));
  }

  async createOrganization(input: CreateOrganizationInput) {
    const name = input.name.trim();
    const slug = slugify(input.slug || name);
    const type = input.type ?? OrganizationType.GYM_OR_CHAIN;

    if (!name) throw new BadRequestException("Organization name is required");
    if (!slug) throw new BadRequestException("Organization slug is required");
    if (!Object.values(OrganizationType).includes(type)) {
      throw new BadRequestException("Invalid organization type");
    }

    const existing = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("Organization slug is already in use");
    }

    const organizationData = {
      name,
      slug,
      type,
      contactEmail: cleanOptional(input.contactEmail),
      phone: cleanOptional(input.phone),
      website: cleanOptional(input.website),
      addressLine1: cleanOptional(input.addressLine1),
      addressLine2: cleanOptional(input.addressLine2),
      city: cleanOptional(input.city),
      state: cleanOptional(input.state),
      postalCode: cleanOptional(input.postalCode),
      country: cleanOptional(input.country),
      notes: cleanOptional(input.notes),
    };

    if (input.ownerEmail || input.ownerPassword) {
      if (!input.ownerEmail || !input.ownerPassword) {
        throw new BadRequestException("Owner email and password are required together");
      }
      if (input.ownerPassword.length < 8) {
        throw new BadRequestException("Owner password must be at least 8 characters");
      }
      const ownerEmail = input.ownerEmail.trim().toLowerCase();
      const existingUser = await this.prisma.user.findUnique({
        where: { email: ownerEmail },
        select: { id: true },
      });
      if (existingUser) {
        throw new ConflictException("A user with the owner email already exists");
      }

      const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
      if (!secretKey) {
        throw new InternalServerErrorException("Clerk secret key not configured");
      }
      const clerkClient = createClerkClient({ secretKey });

      const organization = await this.prisma.organization.create({
        data: organizationData,
      });

      try {
        const clerkUser = await clerkClient.users.createUser({
          emailAddress: [ownerEmail],
          password: input.ownerPassword,
          firstName: cleanOptional(input.ownerFirstName) ?? undefined,
          lastName: cleanOptional(input.ownerLastName) ?? undefined,
          publicMetadata: {
            role: UserRole.ADMIN,
            organizationId: organization.id,
          },
        });

        const owner = await this.prisma.user.upsert({
          where: { clerkId: clerkUser.id },
          create: {
            clerkId: clerkUser.id,
            email: ownerEmail,
            firstName: cleanOptional(input.ownerFirstName),
            lastName: cleanOptional(input.ownerLastName),
            phone: cleanOptional(input.ownerPhone),
            role: UserRole.ADMIN,
            organizationId: organization.id,
          },
          update: {
            email: ownerEmail,
            firstName: cleanOptional(input.ownerFirstName),
            lastName: cleanOptional(input.ownerLastName),
            phone: cleanOptional(input.ownerPhone),
            role: UserRole.ADMIN,
            organizationId: organization.id,
            deletedAt: null,
          },
        });

        await this.prisma.organization.update({
          where: { id: organization.id },
          data: { ownerId: owner.id },
        });

        return this.getOrganizationSummary(organization.id, input.ownerPassword);
      } catch (err: any) {
        await this.prisma.organization.delete({ where: { id: organization.id } });
        const msg =
          err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Failed to create organization owner account";
        throw new BadRequestException(msg);
      }
    }

    if (!input.ownerUserId) {
      const organization = await this.prisma.organization.create({
        data: organizationData,
      });
      return this.getOrganizationSummary(organization.id);
    }

    const owner = await this.prisma.user.findFirst({
      where: { id: input.ownerUserId, deletedAt: null },
      select: { id: true, role: true, organizationId: true },
    });
    if (!owner) throw new NotFoundException("Owner user not found");
    if (owner.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException("Super admins cannot own customer organizations");
    }
    if (owner.organizationId) {
      throw new BadRequestException("Owner user already belongs to an organization");
    }

    const organization = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          ...organizationData,
          ownerId: owner.id,
        },
      });

      await tx.user.update({
        where: { id: owner.id },
        data: {
          role: UserRole.ADMIN,
          organizationId: organization.id,
        },
      });

      return organization;
    });
    return this.getOrganizationSummary(organization.id);
  }

  async getOrganizationDetail(id: string) {
    return this.getOrganizationSummary(id);
  }

  async updateOrganization(id: string, input: UpdateOrganizationInput) {
    const existing = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, slug: true },
    });
    if (!existing) throw new NotFoundException("Organization not found");

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new BadRequestException("Organization name is required");
      data.name = name;
    }
    if (input.slug !== undefined) {
      const slug = slugify(input.slug);
      if (!slug) throw new BadRequestException("Organization slug is required");
      if (slug !== existing.slug) {
        const taken = await this.prisma.organization.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (taken) throw new ConflictException("Organization slug is already in use");
      }
      data.slug = slug;
    }
    if (input.type !== undefined) {
      if (!Object.values(OrganizationType).includes(input.type)) {
        throw new BadRequestException("Invalid organization type");
      }
      data.type = input.type;
    }

    for (const key of [
      "contactEmail",
      "phone",
      "website",
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "postalCode",
      "country",
      "notes",
    ] as const) {
      if (input[key] !== undefined) data[key] = cleanOptional(input[key]);
    }

    await this.prisma.organization.update({ where: { id }, data });
    return this.getOrganizationSummary(id);
  }

  async deleteOrganization(id: string) {
    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!organization) throw new NotFoundException("Organization not found");

    await this.prisma.$transaction([
      this.prisma.organization.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.user.updateMany({
        where: { organizationId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { id };
  }

  async getMyOrganization(requestUser: RequestUser) {
    const organization = await this.getRequestOrganization(requestUser);

    const [admins, coaches, clients, programs, pendingInvitations] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            organizationId: organization.id,
            role: UserRole.ADMIN,
            deletedAt: null,
          },
        }),
        this.prisma.user.count({
          where: {
            organizationId: organization.id,
            role: UserRole.COACH,
            deletedAt: null,
          },
        }),
        this.prisma.user.count({
          where: {
            organizationId: organization.id,
            role: UserRole.CLIENT,
            deletedAt: null,
          },
        }),
        this.prisma.program.count({
          where: { organizationId: organization.id },
        }),
        this.prisma.invitation.count({
          where: {
            status: "PENDING",
            coach: { user: { organizationId: organization.id } },
          },
        }),
      ]);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      owner: organization.owner,
      stats: {
        admins,
        coaches,
        clients,
        programs,
        pendingInvitations,
      },
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  async getMyTeam(requestUser: RequestUser) {
    const organization = await this.getRequestOrganization(requestUser);
    const users = await this.prisma.user.findMany({
      where: {
        organizationId: organization.id,
        deletedAt: null,
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        coachProfile: { select: { id: true } },
        clientProfile: { select: { id: true } },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      isOwner: user.id === organization.ownerId,
      isCoach: !!user.coachProfile,
      isClient: !!user.clientProfile,
    }));
  }

  async createOrgMember(
    input: CreateOrgMemberInput,
    requestUser: RequestUser,
  ) {
    const organization = await this.getRequestOrganization(requestUser);

    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new BadRequestException("Invalid email address");
    }
    if (input.password.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }
    if (input.role !== "COACH" && input.role !== "CLIENT") {
      throw new BadRequestException("Role must be COACH or CLIENT");
    }

    const firstName = cleanOptional(input.firstName);
    const lastName = cleanOptional(input.lastName);
    const phone = cleanOptional(input.phone);

    // Prevent creating a member that already exists in our DB.
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, organizationId: true },
    });
    if (existing) {
      throw new ConflictException(
        "A user with this email address already exists",
      );
    }

    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
    if (!secretKey) {
      throw new InternalServerErrorException("Clerk secret key not configured");
    }
    const clerkClient = createClerkClient({ secretKey });

    // Create the Clerk account.  public_metadata carries role + org so the
    // user.created webhook can bootstrap the DB row without extra API calls.
    let clerkUser: Awaited<ReturnType<typeof clerkClient.users.createUser>>;
    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        password: input.password,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        publicMetadata: {
          role: input.role,
          organizationId: organization.id,
        },
      });
    } catch (err: any) {
      // Clerk returns structured errors; surface the first message.
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
        role: input.role,
        organizationId: organization.id,
      },
      update: {
        email,
        firstName,
        lastName,
        phone,
        role: input.role,
        organizationId: organization.id,
        deletedAt: null,
      },
    });

    if (input.role === "COACH") {
      await this.prisma.coachProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    } else {
      await this.prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }

    return {
      clerkId: clerkUser.id,
      email,
      firstName,
      lastName,
      phone,
      role: input.role,
      organizationId: organization.id,
      organizationName: organization.name,
      // Return the password so the admin can share it with the user.
      temporaryPassword: input.password,
    };
  }

  async listMyPrograms(requestUser: RequestUser) {
    const organization = await this.getRequestOrganization(requestUser);
    const programs = await this.prisma.program.findMany({
      where: { organizationId: organization.id },
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
        _count: { select: { sessions: true } },
      },
    });

    // Count active invitations referencing each program (proxy for "assigned clients")
    const programIds = programs.map((p) => p.id);
    const invitationCounts = programIds.length
      ? await this.prisma.invitation.groupBy({
          by: ["programId"],
          where: {
            programId: { in: programIds },
            status: "ACCEPTED",
          },
          _count: { _all: true },
        })
      : [];
    const acceptedByProgram = new Map(
      invitationCounts.map((c) => [c.programId!, c._count._all]),
    );

    return programs.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      difficulty: p.difficulty,
      durationWeeks: p.durationWeeks,
      createdAt: p.createdAt,
      coach: {
        id: p.coach.id,
        userId: p.coach.user.id,
        email: p.coach.user.email,
        firstName: p.coach.user.firstName,
        lastName: p.coach.user.lastName,
      },
      sessionCount: p._count.sessions,
      assignedClientCount: acceptedByProgram.get(p.id) ?? 0,
    }));
  }

  async listMyClients(requestUser: RequestUser) {
    const organization = await this.getRequestOrganization(requestUser);
    const clients = await this.prisma.user.findMany({
      where: {
        organizationId: organization.id,
        role: UserRole.CLIENT,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        clientProfile: {
          select: {
            id: true,
            goals: true,
            activeProgramId: true,
            activeProgram: { select: { id: true, name: true } },
            coaches: {
              where: { status: "ACTIVE" },
              orderBy: { startedAt: "desc" },
              take: 1,
              select: {
                startedAt: true,
                coach: {
                  select: {
                    id: true,
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
            },
            workoutLogs: {
              orderBy: { performedAt: "desc" },
              take: 1,
              select: { performedAt: true },
            },
            _count: { select: { workoutLogs: true } },
          },
        },
      },
    });

    // Legacy fallback: for any client whose ClientProfile.activeProgramId was
    // never backfilled, derive from the most-recent ACCEPTED invitation. Safe
    // to remove once we trust the column.
    const legacyEmails = clients
      .filter((c) => !c.clientProfile?.activeProgramId)
      .map((c) => c.email);
    const legacyInvitations = legacyEmails.length
      ? await this.prisma.invitation.findMany({
          where: {
            email: { in: legacyEmails },
            status: "ACCEPTED",
            programId: { not: null },
          },
          orderBy: { acceptedAt: "desc" },
          select: {
            email: true,
            program: { select: { id: true, name: true } },
          },
        })
      : [];
    const legacyProgramByEmail = new Map<
      string,
      { id: string; name: string }
    >();
    for (const inv of legacyInvitations) {
      if (!legacyProgramByEmail.has(inv.email) && inv.program) {
        legacyProgramByEmail.set(inv.email, inv.program);
      }
    }

    return clients.map((c) => {
      const assignment = c.clientProfile?.coaches[0] ?? null;
      const lastLog = c.clientProfile?.workoutLogs[0] ?? null;
      const program =
        c.clientProfile?.activeProgram ??
        legacyProgramByEmail.get(c.email) ??
        null;
      return {
        id: c.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        createdAt: c.createdAt,
        goals: c.clientProfile?.goals ?? [],
        coach: assignment
          ? {
              id: assignment.coach.id,
              userId: assignment.coach.user.id,
              email: assignment.coach.user.email,
              firstName: assignment.coach.user.firstName,
              lastName: assignment.coach.user.lastName,
              startedAt: assignment.startedAt,
            }
          : null,
        program,
        workoutsLogged: c.clientProfile?._count.workoutLogs ?? 0,
        lastWorkoutAt: lastLog?.performedAt ?? null,
      };
    });
  }

  async getMyClientDetail(clientUserId: string, requestUser: RequestUser) {
    const organization = await this.getRequestOrganization(requestUser);

    const client = await this.prisma.user.findFirst({
      where: {
        id: clientUserId,
        organizationId: organization.id,
        role: UserRole.CLIENT,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        clientProfile: {
          select: {
            id: true,
            goals: true,
            heightCm: true,
            weightKg: true,
            dateOfBirth: true,
            medicalNotes: true,
            coaches: {
              where: { status: "ACTIVE" },
              orderBy: { startedAt: "desc" },
              take: 1,
              select: {
                startedAt: true,
                coach: {
                  select: {
                    id: true,
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
            },
          },
        },
      },
    });

    if (!client?.clientProfile) {
      throw new NotFoundException("Client not found in this organization");
    }

    const assignment = client.clientProfile.coaches[0] ?? null;

    return {
      user: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        createdAt: client.createdAt,
      },
      profile: {
        id: client.clientProfile.id,
        goals: client.clientProfile.goals,
        heightCm: client.clientProfile.heightCm,
        weightKg: client.clientProfile.weightKg,
        dateOfBirth: client.clientProfile.dateOfBirth,
        medicalNotes: client.clientProfile.medicalNotes,
      },
      coach: assignment
        ? {
            id: assignment.coach.id,
            userId: assignment.coach.user.id,
            email: assignment.coach.user.email,
            firstName: assignment.coach.user.firstName,
            lastName: assignment.coach.user.lastName,
            startedAt: assignment.startedAt,
          }
        : null,
    };
  }

  async getMyClientLogs(
    clientUserId: string,
    requestUser: RequestUser,
    limit = 10,
  ) {
    const organization = await this.getRequestOrganization(requestUser);

    const client = await this.prisma.user.findFirst({
      where: {
        id: clientUserId,
        organizationId: organization.id,
        role: UserRole.CLIENT,
        deletedAt: null,
      },
      select: { clientProfile: { select: { id: true } } },
    });

    if (!client?.clientProfile) {
      throw new NotFoundException("Client not found in this organization");
    }

    const logs = await this.prisma.workoutLog.findMany({
      where: { clientId: client.clientProfile.id },
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

  async listMyInvitations(requestUser: RequestUser) {
    const organization = await this.getRequestOrganization(requestUser);
    const invitations = await this.prisma.invitation.findMany({
      where: {
        coach: { user: { organizationId: organization.id } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        coach: {
          select: {
            id: true,
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
    });

    const now = new Date();
    return invitations.map((i) => ({
      id: i.id,
      email: i.email,
      firstName: i.firstName,
      lastName: i.lastName,
      status:
        i.status === "PENDING" && i.expiresAt < now ? "EXPIRED" : i.status,
      expiresAt: i.expiresAt,
      acceptedAt: i.acceptedAt,
      createdAt: i.createdAt,
      coach: {
        id: i.coach.id,
        userId: i.coach.user.id,
        email: i.coach.user.email,
        firstName: i.coach.user.firstName,
        lastName: i.coach.user.lastName,
      },
      program: i.program,
    }));
  }

  /**
   * Get the admin's own CoachProfile, creating one on first use so the gym
   * owner can author programs and assign clients directly without a separate
   * coach persona.
   */
  private async getOrCreateAdminCoachProfileId(
    requestUser: RequestUser,
  ): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { clerkId: requestUser.clerkId, deletedAt: null },
      include: { coachProfile: true },
    });
    if (!user) throw new NotFoundException("Admin user not found");
    if (user.coachProfile) return user.coachProfile.id;

    const created = await this.prisma.coachProfile.create({
      data: { userId: user.id },
    });
    return created.id;
  }

  /**
   * Admin-direct: attach an existing program to a client in the org without
   * routing through a coach. The admin's lazy CoachProfile becomes the owner
   * of the resulting assignment + invitation record so all downstream code
   * (client portal, listMyClients) keeps working unchanged.
   */
  async assignProgramToClient(
    clientUserId: string,
    programId: string,
    requestUser: RequestUser,
    options: { startDate?: string; durationWeeks?: number } = {},
  ) {
    const organization = await this.getRequestOrganization(requestUser);

    const [clientUser, program] = await Promise.all([
      this.prisma.user.findFirst({
        where: {
          id: clientUserId,
          organizationId: organization.id,
          role: UserRole.CLIENT,
          deletedAt: null,
        },
        include: { clientProfile: true },
      }),
      this.prisma.program.findFirst({
        where: { id: programId, organizationId: organization.id },
      }),
    ]);

    if (!clientUser) {
      throw new NotFoundException("Client not found in this organization");
    }
    if (!program) {
      throw new NotFoundException("Program not found in this organization");
    }

    const adminCoachProfileId =
      await this.getOrCreateAdminCoachProfileId(requestUser);

    const clientProfile =
      clientUser.clientProfile ??
      (await this.prisma.clientProfile.create({
        data: { userId: clientUser.id },
      }));

    const startDate = options.startDate ? new Date(options.startDate) : null;
    const durationWeeks = options.durationWeeks ?? program.durationWeeks;

    return this.prisma.$transaction(async (tx) => {
      // End any other active assignments so the admin assignment becomes
      // the client's current relationship.
      await tx.coachClientAssignment.updateMany({
        where: { clientId: clientProfile.id, status: "ACTIVE" },
        data: { status: "COMPLETED", endedAt: new Date() },
      });

      await tx.coachClientAssignment.upsert({
        where: {
          coachId_clientId: {
            coachId: adminCoachProfileId,
            clientId: clientProfile.id,
          },
        },
        create: {
          coachId: adminCoachProfileId,
          clientId: clientProfile.id,
          status: "ACTIVE",
        },
        update: {
          status: "ACTIVE",
          startedAt: new Date(),
          endedAt: null,
        },
      });

      // Authoritative state: write the new column. Invitation row below is
      // still created for audit history and to keep legacy readers happy
      // until the transition is complete.
      await tx.clientProfile.update({
        where: { id: clientProfile.id },
        data: {
          activeProgramId: program.id,
          activeProgramStartedAt: startDate ?? new Date(),
        },
      });

      const token = randomBytes(32).toString("hex");
      const now = new Date();
      const invitation = await tx.invitation.create({
        data: {
          token,
          coachId: adminCoachProfileId,
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

      return {
        clientUserId: clientUser.id,
        programId: program.id,
        invitationId: invitation.id,
      };
    });
  }

  /**
   * Assign a client (within the org) to a coach (within the org).
   * Creates or reactivates a CoachClientAssignment.
   */
  async assignClientToCoach(
    clientUserId: string,
    coachUserId: string,
    requestUser: RequestUser,
  ) {
    const organization = await this.getRequestOrganization(requestUser);

    // Validate both users belong to this org.
    const [clientUser, coachUser] = await Promise.all([
      this.prisma.user.findFirst({
        where: {
          id: clientUserId,
          organizationId: organization.id,
          role: UserRole.CLIENT,
          deletedAt: null,
        },
        include: { clientProfile: true },
      }),
      this.prisma.user.findFirst({
        where: {
          id: coachUserId,
          organizationId: organization.id,
          role: UserRole.COACH,
          deletedAt: null,
        },
        include: { coachProfile: true },
      }),
    ]);

    if (!clientUser) {
      throw new NotFoundException("Client not found in this organization");
    }
    if (!coachUser) {
      throw new NotFoundException("Coach not found in this organization");
    }

    // Ensure profiles exist.
    const clientProfile =
      clientUser.clientProfile ??
      (await this.prisma.clientProfile.create({ data: { userId: clientUser.id } }));
    const coachProfile =
      coachUser.coachProfile ??
      (await this.prisma.coachProfile.create({ data: { userId: coachUser.id } }));

    return this.prisma.$transaction(async (tx) => {
      await tx.coachClientAssignment.updateMany({
        where: { clientId: clientProfile.id, status: "ACTIVE" },
        data: { status: "COMPLETED", endedAt: new Date() },
      });

      return tx.coachClientAssignment.upsert({
        where: {
          coachId_clientId: {
            coachId: coachProfile.id,
            clientId: clientProfile.id,
          },
        },
        create: {
          coachId: coachProfile.id,
          clientId: clientProfile.id,
          status: "ACTIVE",
        },
        update: {
          status: "ACTIVE",
          startedAt: new Date(),
          endedAt: null,
        },
      });
    });
  }

  async updateTeamMemberRole(
    userId: string,
    role: UserRole,
    requestUser: RequestUser,
  ) {
    const organization = await this.getRequestOrganization(requestUser);
    if (!ORGANIZATION_TEAM_ROLES.has(role)) {
      throw new BadRequestException("Organization admins cannot assign this role");
    }

    const target = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: organization.id,
        deletedAt: null,
      },
    });
    if (!target) throw new NotFoundException("Team member not found");
    if (target.id === organization.ownerId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("Organization owner must remain an admin");
    }

    return this.prisma.user.update({
      where: { id: target.id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        updatedAt: true,
      },
    });
  }

  private async getRequestOrganization(requestUser: RequestUser) {
    if (requestUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Organization admin role required");
    }
    if (!requestUser.organizationId) {
      throw new ForbiddenException("Admin is not assigned to an organization");
    }

    const organization = await this.prisma.organization.findFirst({
      where: { id: requestUser.organizationId, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
    });
    if (!organization) throw new NotFoundException("Organization not found");
    return organization;
  }

  private async getOrganizationSummary(id: string, ownerTemporaryPassword?: string) {
    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        _count: {
          select: {
            users: true,
            programs: true,
          },
        },
        users: {
          where: { deletedAt: null },
          select: { role: true },
        },
      },
    });
    if (!organization) throw new NotFoundException("Organization not found");

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      contactEmail: organization.contactEmail,
      phone: organization.phone,
      website: organization.website,
      addressLine1: organization.addressLine1,
      addressLine2: organization.addressLine2,
      city: organization.city,
      state: organization.state,
      postalCode: organization.postalCode,
      country: organization.country,
      notes: organization.notes,
      owner: organization.owner,
      userCount: organization.users.length,
      adminCount: organization.users.filter((u) => u.role === UserRole.ADMIN).length,
      coachCount: organization.users.filter((u) => u.role === UserRole.COACH).length,
      clientCount: organization.users.filter((u) => u.role === UserRole.CLIENT).length,
      programCount: organization._count.programs,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      ownerTemporaryPassword,
    };
  }
}
