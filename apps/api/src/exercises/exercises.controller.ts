import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ExercisesService } from "./exercises.service";
import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@fitrix/types";

@Controller("exercises")
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateExerciseDto, @CurrentUser() user: RequestUser) {
    return this.exercisesService.create(dto, user);
  }

  // Returns system exercises + the caller's own exercises.
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.exercisesService.findAll(pagination, user);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.exercisesService.findOne(id);
  }

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateExerciseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.exercisesService.update(id, dto, user);
  }

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.exercisesService.remove(id, user);
  }

  // Duplicates an exercise (usually a system one) and gives the copy to the
  // requesting coach. The copy is immediately editable and deletable.
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Post(":id/duplicate")
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.exercisesService.duplicate(id, user);
  }
}
