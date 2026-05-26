import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsUrl,
  MaxLength,
  Min,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { UserRole } from "@fitrix/types";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { OrganizationsService, CreateOrgMemberInput } from "./organizations.service";

class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(["GYM_OR_CHAIN", "INDIVIDUAL_COACH"])
  type?: "GYM_OR_CHAIN" | "INDIVIDUAL_COACH";

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  ownerPassword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  ownerFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  ownerLastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  ownerPhone?: string;
}

class UpdateOrganizationDto extends CreateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  declare name: string;
}

class UpdateTeamRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

class AssignProgramDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationWeeks?: number;
}

class CreateOrgMemberDto implements CreateOrgMemberInput {
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

  @IsEnum(["COACH", "CLIENT"])
  role!: "COACH" | "CLIENT";
}

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  listOrganizations() {
    return this.organizationsService.listOrganizations();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.createOrganization(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get("me")
  getMyOrganization(@CurrentUser() user: RequestUser) {
    return this.organizationsService.getMyOrganization(user);
  }

  @Roles(UserRole.ADMIN)
  @Get("me/team")
  getMyTeam(@CurrentUser() user: RequestUser) {
    return this.organizationsService.getMyTeam(user);
  }

  @Roles(UserRole.ADMIN)
  @Post("me/members")
  createOrgMember(
    @Body() dto: CreateOrgMemberDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organizationsService.createOrgMember(dto, user);
  }

  @Roles(UserRole.ADMIN)
  @Get("me/programs")
  getMyPrograms(@CurrentUser() user: RequestUser) {
    return this.organizationsService.listMyPrograms(user);
  }

  @Roles(UserRole.ADMIN)
  @Get("me/clients")
  getMyClients(@CurrentUser() user: RequestUser) {
    return this.organizationsService.listMyClients(user);
  }

  @Roles(UserRole.ADMIN)
  @Get("me/clients/:clientUserId")
  getMyClientDetail(
    @Param("clientUserId") clientUserId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organizationsService.getMyClientDetail(clientUserId, user);
  }

  @Roles(UserRole.ADMIN)
  @Get("me/clients/:clientUserId/logs")
  getMyClientLogs(
    @Param("clientUserId") clientUserId: string,
    @CurrentUser() user: RequestUser,
    @Query("limit") limit?: string,
  ) {
    const parsed = limit ? Math.max(1, Math.min(50, parseInt(limit, 10))) : 10;
    return this.organizationsService.getMyClientLogs(
      clientUserId,
      user,
      parsed,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get("me/invitations")
  getMyInvitations(@CurrentUser() user: RequestUser) {
    return this.organizationsService.listMyInvitations(user);
  }

  @Roles(UserRole.ADMIN)
  @Post("me/clients/:clientUserId/assign-program/:programId")
  assignProgramToClient(
    @Param("clientUserId") clientUserId: string,
    @Param("programId") programId: string,
    @Body() dto: AssignProgramDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organizationsService.assignProgramToClient(
      clientUserId,
      programId,
      user,
      dto,
    );
  }

  @Roles(UserRole.ADMIN)
  @Post("me/clients/:clientUserId/assign/:coachUserId")
  assignClientToCoach(
    @Param("clientUserId") clientUserId: string,
    @Param("coachUserId") coachUserId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organizationsService.assignClientToCoach(
      clientUserId,
      coachUserId,
      user,
    );
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get(":id")
  getOrganization(@Param("id") id: string) {
    return this.organizationsService.getOrganizationDetail(id);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(":id")
  updateOrganization(
    @Param("id") id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(":id")
  deleteOrganization(@Param("id") id: string) {
    return this.organizationsService.deleteOrganization(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch("me/team/:userId/role")
  updateTeamMemberRole(
    @Param("userId") userId: string,
    @Body() dto: UpdateTeamRoleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organizationsService.updateTeamMemberRole(userId, dto.role as any, user);
  }
}
