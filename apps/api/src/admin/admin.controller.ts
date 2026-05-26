import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { AdminService, CreateCoachInput, UpdateCoachInput } from "./admin.service";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@fitrix/types";

class UpdateRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

class UpdateEmailDto {
  @IsEmail()
  email!: string;
}

class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 50;
}

class CreateCoachDto implements CreateCoachInput {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;
}

class UpdateCoachDto implements UpdateCoachInput {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;
}

@Roles(UserRole.SUPER_ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get("coaches")
  getCoaches() {
    return this.adminService.getCoaches();
  }

  @Post("coaches")
  createCoach(@Body() dto: CreateCoachDto) {
    return this.adminService.createCoach(dto);
  }

  @Get("coaches/:id")
  getCoach(@Param("id") id: string) {
    return this.adminService.getCoachDetail(id);
  }

  @Patch("coaches/:id")
  updateCoach(@Param("id") id: string, @Body() dto: UpdateCoachDto) {
    return this.adminService.updateCoach(id, dto);
  }

  @Delete("coaches/:id")
  deleteCoach(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.adminService.deleteCoach(id, user.userId!);
  }

  @Get("users")
  getUsers(@Query() query: PaginationQuery) {
    return this.adminService.getAllUsers(query.page, query.pageSize);
  }

  @Get("users/:id")
  getUser(@Param("id") id: string) {
    return this.adminService.getUserSupportDetail(id);
  }

  @Get("invitations")
  getInvitations(@Query() query: PaginationQuery) {
    return this.adminService.getInvitations(query.page, query.pageSize);
  }

  @Get("billing")
  getBilling() {
    return this.adminService.getBillingOverview();
  }

  @Get("audit-log")
  getAuditLog() {
    return this.adminService.getAuditLog();
  }

  @Get("settings")
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch("users/:id/role")
  updateRole(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.adminService.updateUserRole(id, dto.role as any, user.userId!);
  }

  @Delete("users/:id")
  deleteUser(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.adminService.deleteUser(id, user.userId!);
  }

  @Patch("coaches/:id/email")
  updateCoachEmail(
    @Param("id") id: string,
    @Body() dto: UpdateEmailDto,
  ) {
    return this.adminService.updateCoachEmail(id, dto.email);
  }

  @Post("coaches/:id/reset-password")
  resetCoachPassword(@Param("id") id: string) {
    return this.adminService.resetCoachPassword(id);
  }

  @Patch("coaches/:id/suspend")
  suspendCoach(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.adminService.suspendCoach(id, user.userId!);
  }
}
