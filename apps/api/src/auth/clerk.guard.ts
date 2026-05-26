import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { UserRole } from "@prisma/client";
import { IS_PUBLIC_KEY } from "./decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { RedisCacheService } from "../cache/redis-cache.service";

interface CachedUser {
  id: string;
  email: string;
  role: string;
  organizationId: string | null;
  isDeleted: boolean;
}

// User row cached for 60 seconds — short enough that role changes propagate quickly
const USER_CACHE_TTL = 60;

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly clerk;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {
    this.clerk = createClerkClient({
      secretKey: this.config.get<string>("CLERK_SECRET_KEY") ?? "",
    });
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const request = ctx.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
    if (!secretKey) throw new UnauthorizedException("Clerk not configured");

    let payload: Awaited<ReturnType<typeof verifyToken>>;
    try {
      payload = await verifyToken(token, {
        secretKey,
        authorizedParties: ["http://localhost:3000"],
      });
    } catch (err) {
      this.logger.warn(`Token verify failed: ${(err as Error).message}`);
      throw new UnauthorizedException("Invalid token");
    }

    const clerkId = payload.sub;
    if (!clerkId) {
      throw new UnauthorizedException("Token missing subject");
    }

    const cacheKey = `user:clerkId:${clerkId}`;
    let cached = await this.cache.get<CachedUser>(cacheKey);

    if (!cached) {
      let dbUser: Awaited<ReturnType<PrismaService["user"]["findUnique"]>> =
        null;
      try {
        dbUser = await this.prisma.user.findUnique({ where: { clerkId } });
      } catch (err) {
        this.logger.error(
          `DB lookup for clerkId=${clerkId} failed: ${(err as Error).message}`,
        );
      }

      if (!dbUser) {
        dbUser = await this.bootstrapUserFromClerk(clerkId);
      }

      if (dbUser) {
        cached = {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          organizationId: dbUser.organizationId,
          isDeleted: !!dbUser.deletedAt,
        };
        await this.cache.set(cacheKey, cached, USER_CACHE_TTL);
      }
    }

    if (cached?.isDeleted) {
      throw new UnauthorizedException("Account disabled");
    }

    request.user = {
      clerkId,
      email: cached?.email ?? (payload as any).email ?? null,
      role: cached?.role ?? "CLIENT",
      userId: cached?.id ?? null,
      organizationId: cached?.organizationId ?? null,
    };

    return true;
  }

  private async bootstrapUserFromClerk(clerkId: string) {
    try {
      const clerkUser = await this.clerk.users.getUser(clerkId);
      const email =
        clerkUser.emailAddresses.find(
          (address) => address.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        "";

      if (!email) {
        this.logger.warn(`Cannot bootstrap clerkId=${clerkId}: no email`);
        return null;
      }

      const metadata = clerkUser.publicMetadata as Record<string, unknown>;
      const metaRole = metadata?.role as UserRole | undefined;
      const metaOrgId = metadata?.organizationId as string | undefined;
      let role = metaRole;

      if (!role) {
        const pendingInvite = await this.prisma.invitation.findFirst({
          where: { email: email.trim().toLowerCase(), status: "PENDING" },
          select: { id: true },
        });
        role = pendingInvite ? UserRole.CLIENT : UserRole.COACH;
      }

      const user = await this.prisma.user.upsert({
        where: { clerkId },
        create: {
          clerkId,
          email: email.trim().toLowerCase(),
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role,
          organizationId: metaOrgId ?? null,
        },
        update: {
          email: email.trim().toLowerCase(),
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role,
          ...(metaOrgId ? { organizationId: metaOrgId } : {}),
          deletedAt: null,
        },
      });

      if (role === UserRole.COACH) {
        await this.prisma.coachProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
      }
      if (role === UserRole.CLIENT) {
        await this.prisma.clientProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
      }

      this.logger.log(
        `Bootstrapped missing local user ${email} from Clerk with role=${role}`,
      );
      return user;
    } catch (err) {
      this.logger.error(
        `Failed to bootstrap clerkId=${clerkId}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
