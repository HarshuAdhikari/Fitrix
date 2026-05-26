import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@fitrix/types";
import { ROLES_KEY } from "./decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException("No authenticated user on request");
    if (
      user.role === UserRole.SUPER_ADMIN &&
      required.includes(UserRole.ADMIN)
    ) {
      return true;
    }
    if (!required.includes(user.role as UserRole)) {
      throw new ForbiddenException("Insufficient role");
    }
    return true;
  }
}
