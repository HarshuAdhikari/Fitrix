import { Controller, Get, Param, Patch, Body } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@fitrix/types";
import { IsEnum } from "class-validator";

class UpdateRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.getMe(user);
  }

  @Get("me/stats")
  getDashboardStats(@CurrentUser() user: RequestUser) {
    return this.usersService.getDashboardStats(user);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.usersService.findAll(user);
  }

  @Roles(UserRole.ADMIN)
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.usersService.findOne(id, user);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id/role")
  updateRole(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.updateRole(id, dto.role as any, user);
  }
}
