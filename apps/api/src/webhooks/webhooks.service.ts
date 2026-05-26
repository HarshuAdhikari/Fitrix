import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";
import { InvitationsService } from "../invitations/invitations.service";

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserPayload {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name: string | null;
  last_name: string | null;
  public_metadata: Record<string, unknown>;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invitations: InvitationsService,
  ) {}

  async handleUserCreated(data: ClerkUserPayload): Promise<void> {
    const email = data.email_addresses[0]?.email_address ?? "";
    const metaRole = data.public_metadata?.role as UserRole | undefined;

    // Role resolution:
    //  1. Explicit role in Clerk public_metadata → use it
    //  2. Pending invitation exists for this email → CLIENT (invited by a coach)
    //  3. No invitation → COACH (direct sign-up through the coach portal)
    let role: UserRole;
    if (metaRole) {
      role = metaRole;
    } else if (email) {
      const pending = await this.prisma.invitation.findFirst({
        where: { email: email.trim().toLowerCase(), status: "PENDING" },
      });
      role = pending ? UserRole.CLIENT : UserRole.COACH;
    } else {
      role = UserRole.COACH;
    }

    // Read org assignment from metadata (set when admin creates an org member).
    const metaOrgId = data.public_metadata?.organizationId as string | undefined;

    const user = await this.prisma.user.upsert({
      where: { clerkId: data.id },
      create: {
        clerkId: data.id,
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        role,
        organizationId: metaOrgId ?? null,
      },
      update: {
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        role,
        // Only set org if metadata carries one (don't wipe on re-sync).
        ...(metaOrgId ? { organizationId: metaOrgId } : {}),
      },
    });

    this.logger.log(`User created/upserted: ${data.id} (${email}) role=${role} org=${metaOrgId ?? "none"}`);

    // Auto-create profile so the portal works immediately.
    if (role === UserRole.COACH) {
      await this.prisma.coachProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      this.logger.log(`CoachProfile ensured for ${email}`);
    }

    if (role === UserRole.CLIENT) {
      await this.prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      this.logger.log(`ClientProfile ensured for ${email}`);
    }

    if (email) {
      try {
        await this.invitations.acceptByEmailForNewUser(email, user.id);
      } catch (err) {
        this.logger.error(
          `Failed to auto-accept invitation for ${email}: ${(err as Error).message}`,
        );
      }
    }
  }

  async handleUserUpdated(data: ClerkUserPayload): Promise<void> {
    const email = data.email_addresses[0]?.email_address ?? "";
    const role = (data.public_metadata?.role as UserRole) ?? undefined;

    const user = await this.prisma.user.upsert({
      where: { clerkId: data.id },
      create: {
        clerkId: data.id,
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: role ?? UserRole.CLIENT,
      },
      update: {
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        ...(role ? { role } : {}),
      },
    });

    this.logger.log(`User updated: ${data.id}`);

    // Clerk often fires user.created BEFORE the primary email is verified —
    // when that happens, the email field is empty and handleUserCreated cannot
    // match the pending invitation. The email arrives later in user.updated,
    // so retry the accept here. Idempotent: returns early if no PENDING invite
    // is found for this email.
    if (email) {
      // Make sure CLIENT bootstrap happened — first sign-up may have skipped
      // ClientProfile creation if the role was unknown at user.created time.
      if (user.role === UserRole.CLIENT) {
        await this.prisma.clientProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
      }
      try {
        await this.invitations.acceptByEmailForNewUser(email, user.id);
      } catch (err) {
        this.logger.error(
          `Failed to auto-accept invitation on user.updated for ${email}: ${(err as Error).message}`,
        );
      }
    }
  }

  async handleUserDeleted(data: { id: string }): Promise<void> {
    await this.prisma.user.updateMany({
      where: { clerkId: data.id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`User soft-deleted: ${data.id}`);
  }
}
