import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { UserRole } from "@fitrix/types";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { SchedulesService } from "./schedules.service";

class CreateScheduleDto {
  @IsString()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  clientUserId!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

class SetDayDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  workoutSessionId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

class DuplicateScheduleDto {
  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  clientUserId?: string;
}

@Roles(UserRole.COACH, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller("schedules")
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.schedules.listMine(user);
  }

  @Post()
  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: RequestUser) {
    return this.schedules.create(dto, user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.schedules.findOne(id, user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateScheduleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.schedules.update(id, dto, user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.schedules.remove(id, user);
  }

  @Post(":id/duplicate")
  duplicate(
    @Param("id") id: string,
    @Body() dto: DuplicateScheduleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.schedules.duplicate(
      id,
      {
        startDate: dto.startDate,
        name: dto.name,
        clientUserId: dto.clientUserId,
      },
      user,
    );
  }

  @Put(":id/days")
  setDay(
    @Param("id") id: string,
    @Body() dto: SetDayDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.schedules.setDay(
      id,
      {
        date: dto.date,
        workoutSessionId: dto.workoutSessionId ?? null,
        notes: dto.notes,
      },
      user,
    );
  }

  @Delete(":id/days")
  clearDay(
    @Param("id") id: string,
    @Query("date") date: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.schedules.clearDay(id, date, user);
  }
}
