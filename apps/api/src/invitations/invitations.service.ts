import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { RequestUser } from "../auth/decorators/current-user.decorator";

const INVITE_TTL_DAYS = 7;

interface CreateInvitationInput {
  email: string;
  firstName?: string;
  lastName?: string;
  programId?: string;
  startDate?: string;
  durationWeeks?: number;
  videoCallingEnabled?: boolean;
}

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  private async getCoachProfile(clerkId: string) {
    const user = await this.prisma.user.findFirst({
      where: { clerkId, deletedAt: null },
      include: { coachProfile: true },
    });
    if (!user?.coachProfile) {
      throw new ForbiddenException("Coach profile not found for this user");
    }
    return { user, coachProfile: user.coachProfile };
  }

  /**
   * Like getCoachProfile but lazily creates a CoachProfile for ADMIN users so
   * a gym owner can invite a client directly. Used by the create() path; the
   * read paths still use the strict getCoachProfile().
   */
  private async getOrCreateCoachProfile(requestUser: RequestUser) {
    const user = await this.prisma.user.findFirst({
      where: { clerkId: requestUser.clerkId, deletedAt: null },
      include: { coachProfile: true },
    });
    if (!user) {
      throw new ForbiddenException("User not found");
    }
    if (user.coachProfile) return { user, coachProfile: user.coachProfile };

    if (requestUser.role !== "ADMIN" && requestUser.role !== "SUPER_ADMIN") {
      throw new ForbiddenException("Coach profile not found for this user");
    }

    const created = await this.prisma.coachProfile.create({
      data: { userId: user.id },
    });
    return { user, coachProfile: created };
  }

  private coachDisplayName(user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): string {
    const joined = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return joined || user.email;
  }

  async create(
    input: CreateInvitationInput,
    requestUser: RequestUser,
  ) {
    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new BadRequestException("Invalid email address");
    }

    const { user, coachProfile } = await this.getOrCreateCoachProfile(
      requestUser,
    );

    if (requestUser.role === "COACH" && user.organizationId) {
      throw new ForbiddenException(
        "Organization coaches cannot invite clients. Ask an organization admin to add the client and assign them to you.",
      );
    }

    // Refuse if an ACTIVE client already exists under this coach with this email.
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { clientProfile: true },
    });
    if (existingUser?.clientProfile) {
      const active = await this.prisma.coachClientAssignment.findFirst({
        where: {
          coachId: coachProfile.id,
          clientId: existingUser.clientProfile.id,
          status: "ACTIVE",
        },
      });
      if (active) {
        throw new ConflictException(
          "This email is already on your active roster.",
        );
      }
    }

    // Refuse if there's already a PENDING invitation for this email from this coach.
    const pending = await this.prisma.invitation.findFirst({
      where: {
        coachId: coachProfile.id,
        email,
        status: "PENDING",
      },
    });
    if (pending) {
      throw new ConflictException(
        "You already have a pending invitation for this email.",
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    const invitation = await this.prisma.invitation.create({
      data: {
        token,
        coachId: coachProfile.id,
        email,
        firstName: input.firstName?.trim() || null,
        lastName: input.lastName?.trim() || null,
        expiresAt,
        programId: input.programId || null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        durationWeeks: input.durationWeeks || null,
        videoCallingEnabled: input.videoCallingEnabled ?? false,
      },
    });

    const appUrl =
      this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    const activationUrl = `${appUrl.replace(/\/$/, "")}/activate?token=${token}`;

    try {
      await this.email.sendInvitationEmail({
        to: email,
        firstName: invitation.firstName,
        coachName: this.coachDisplayName(user),
        activationUrl,
      });
    } catch (err) {
      // If the email fails, roll back the invitation so the coach can retry.
      await this.prisma.invitation.delete({ where: { id: invitation.id } });
      throw err;
    }

    return {
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      ...(this.config.get<string>("NODE_ENV") !== "production"
        ? { activationUrl }
        : {}),
    };
  }

  async listForCoach(requestUser: RequestUser) {
    const { coachProfile } = await this.getCoachProfile(requestUser.clerkId);
    const invitations = await this.prisma.invitation.findMany({
      where: { coachId: coachProfile.id },
      orderBy: { createdAt: "desc" },
    });
    const now = new Date();
    const includeActivationUrl =
      this.config.get<string>("NODE_ENV") !== "production";
    const appUrl =
      this.config.get<string>("APP_URL") ?? "http://localhost:3000";

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
      ...(includeActivationUrl && i.status === "PENDING"
        ? {
            activationUrl: `${appUrl.replace(/\/$/, "")}/activate?token=${i.token}`,
          }
        : {}),
    }));
  }

  async cancel(id: string, requestUser: RequestUser) {
    const { coachProfile } = await this.getCoachProfile(requestUser.clerkId);
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
    });
    if (!invitation || invitation.coachId !== coachProfile.id) {
      throw new NotFoundException("Invitation not found");
    }
    if (invitation.status !== "PENDING") {
      throw new BadRequestException(
        `Cannot cancel an invitation with status ${invitation.status}`,
      );
    }
    return this.prisma.invitation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  /**
   * Public lookup by token — used by the /activate page before the client
   * has signed up. Returns just enough to render "{Coach} invited you".
   */
  async getByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        coach: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    const now = new Date();
    let status = invitation.status;
    if (status === "PENDING" && invitation.expiresAt < now) {
      status = "EXPIRED";
    }

    return {
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      status,
      expiresAt: invitation.expiresAt,
      coachName: this.coachDisplayName(invitation.coach.user),
    };
  }

  /**
   * Called by the Clerk user.created webhook. If a PENDING invitation exists
   * for this email, activate it: create a ClientProfile (if missing), create
   * a CoachClientAssignment, mark the invitation ACCEPTED.
   */
  async acceptByEmailForNewUser(
    email: string,
    newUserId: string,
  ): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        email: normalized,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });
    if (!invitation) return;

    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const profile = await tx.clientProfile.upsert({
        where: { userId: newUserId },
        update: {},
        create: { userId: newUserId },
      });

      // Promote the invitation's programId onto the new authoritative column.
      // We only overwrite when the invitation actually carries a program, so
      // a "no programme" invite doesn't blank out an existing assignment.
      if (invitation.programId) {
        await tx.clientProfile.update({
          where: { id: profile.id },
          data: {
            activeProgramId: invitation.programId,
            activeProgramStartedAt: invitation.startDate ?? new Date(),
          },
        });
      }

      const invitingCoach = await tx.coachProfile.findUnique({
        where: { id: invitation.coachId },
        select: { user: { select: { organizationId: true } } },
      });

      if (invitingCoach?.user.organizationId) {
        await tx.user.update({
          where: { id: newUserId },
          data: { organizationId: invitingCoach.user.organizationId },
        });
      }

      const existingAssignment = await tx.coachClientAssignment.findFirst({
        where: { coachId: invitation.coachId, clientId: profile.id },
      });
      if (!existingAssignment) {
        await tx.coachClientAssignment.create({
          data: {
            coachId: invitation.coachId,
            clientId: profile.id,
            status: "ACTIVE",
          },
        });
      } else if (existingAssignment.status !== "ACTIVE") {
        await tx.coachClientAssignment.update({
          where: { id: existingAssignment.id },
          data: { status: "ACTIVE", endedAt: null },
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          acceptedByUserId: newUserId,
        },
      });
    });

    this.logger.log(
      `Invitation ${invitation.id} accepted by new user ${newUserId}`,
    );
  }
}
