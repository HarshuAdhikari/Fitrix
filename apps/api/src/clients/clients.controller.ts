import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@fitrix/types";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from "class-validator";

class AssignClientDto {
  @IsString()
  @IsNotEmpty()
  clientUserId!: string;
}

class AssignProgramDto {
  @IsString()
  @IsNotEmpty()
  programId!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationWeeks?: number;
}

@Roles(UserRole.COACH, UserRole.ADMIN)
@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.clientsService.findAll(user);
  }

  @Get("plans-to-assign")
  plansToAssign(@CurrentUser() user: RequestUser) {
    return this.clientsService.plansToAssign(user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.clientsService.findOne(id, user);
  }

  @Get(":id/logs")
  findLogs(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser,
    @Query("limit") limit?: string,
  ) {
    const parsed = limit ? Math.max(1, Math.min(50, parseInt(limit, 10))) : 10;
    return this.clientsService.findLogs(id, user, parsed);
  }

  @Post("assign")
  assignClient(@Body() dto: AssignClientDto, @CurrentUser() user: RequestUser) {
    return this.clientsService.assignClient(dto.clientUserId, user);
  }

  @Post(":id/assign-program")
  assignProgram(
    @Param("id") clientUserId: string,
    @Body() dto: AssignProgramDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.clientsService.assignProgramToClient(
      clientUserId,
      dto.programId,
      user,
      { startDate: dto.startDate, durationWeeks: dto.durationWeeks },
    );
  }

  @Delete(":id")
  removeClient(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.clientsService.removeClient(id, user);
  }
}
