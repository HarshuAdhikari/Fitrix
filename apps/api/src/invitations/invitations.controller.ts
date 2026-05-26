import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { InvitationsService } from "./invitations.service";
import {
  CurrentUser,
  RequestUser,
} from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { UserRole } from "@fitrix/types";

class CreateInvitationDto {
  @IsEmail()
  email!: string;

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
  programId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationWeeks?: number;

  @IsOptional()
  @IsBoolean()
  videoCallingEnabled?: boolean;
}

@Controller("invitations")
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.invitations.create(dto, user);
  }

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.invitations.listForCoach(user);
  }

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Patch(":id/cancel")
  cancel(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.invitations.cancel(id, user);
  }

  @Public()
  @Get("token/:token")
  lookup(@Param("token") token: string) {
    return this.invitations.getByToken(token);
  }
}
