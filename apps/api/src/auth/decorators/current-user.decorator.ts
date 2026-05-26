import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  clerkId: string;
  email: string | null;
  role: string;
  userId: string | null;
  organizationId: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser | undefined;
  },
);
