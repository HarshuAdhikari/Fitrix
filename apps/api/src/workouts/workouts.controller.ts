import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Difficulty, TargetArea } from "@prisma/client";
import { UserRole } from "@fitrix/types";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { WorkoutsService } from "./workouts.service";

class CreateWorkoutDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDurationMin?: number;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsEnum(TargetArea, { each: true })
  targetAreas?: TargetArea[];
}

class UpdateWorkoutDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDurationMin?: number | null;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty | null;

  @IsOptional()
  @IsArray()
  @IsEnum(TargetArea, { each: true })
  targetAreas?: TargetArea[];
}

class AddExerciseDto {
  @IsString()
  exerciseId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  reps?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  rest?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

class UpdateExerciseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  reps?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  rest?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

@Roles(UserRole.COACH, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller("workouts")
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.workouts.list(user);
  }

  @Post()
  create(@Body() dto: CreateWorkoutDto, @CurrentUser() user: RequestUser) {
    return this.workouts.create(dto, user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.workouts.findOne(id, user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateWorkoutDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workouts.update(id, dto, user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.workouts.remove(id, user);
  }

  @Post(":id/exercises")
  addExercise(
    @Param("id") id: string,
    @Body() dto: AddExerciseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workouts.addExercise(id, dto, user);
  }

  @Patch(":id/exercises/:exerciseLinkId")
  updateExercise(
    @Param("id") id: string,
    @Param("exerciseLinkId") exerciseLinkId: string,
    @Body() dto: UpdateExerciseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workouts.updateExercise(id, exerciseLinkId, dto, user);
  }

  @Delete(":id/exercises/:exerciseLinkId")
  removeExercise(
    @Param("id") id: string,
    @Param("exerciseLinkId") exerciseLinkId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workouts.removeExercise(id, exerciseLinkId, user);
  }
}
