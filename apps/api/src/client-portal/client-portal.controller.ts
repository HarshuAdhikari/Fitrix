import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ClientPortalService } from "./client-portal.service";
import {
  CurrentUser,
  RequestUser,
} from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@fitrix/types";

class LogSetDto {
  @IsString() exerciseId!: string;
  @IsInt() @Min(1) setNumber!: number;
  @IsOptional() @IsInt() @Min(0) reps?: number;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsNumber() rpe?: number;
  @IsOptional() @IsString() notes?: string;
}

class LogSessionDto {
  @IsOptional() @IsString() notes?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogSetDto)
  sets?: LogSetDto[];
}

@Roles(UserRole.CLIENT)
@Controller("client")
export class ClientPortalController {
  constructor(private readonly service: ClientPortalService) {}

  @Get("me")
  getMe(@CurrentUser() user: RequestUser) {
    return this.service.getMe(user);
  }

  @Get("program")
  getActiveProgram(@CurrentUser() user: RequestUser) {
    return this.service.getActiveProgram(user);
  }

  @Get("sessions/:id")
  getSession(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.service.getSession(id, user);
  }

  @Post("sessions/:id/log")
  logSession(
    @Param("id") id: string,
    @Body() dto: LogSessionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.logSession(id, dto, user);
  }

  @Get("history")
  getHistory(
    @CurrentUser() user: RequestUser,
    @Query("limit") limit?: string,
  ) {
    const parsed = limit ? Math.max(1, Math.min(100, parseInt(limit, 10))) : 20;
    return this.service.getHistory(user, parsed);
  }
}
