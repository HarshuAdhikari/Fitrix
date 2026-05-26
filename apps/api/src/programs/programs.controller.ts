import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ProgramsService } from "./programs.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@fitrix/types";

@Controller("programs")
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateProgramDto, @CurrentUser() user: RequestUser) {
    return this.programsService.create(dto, user);
  }

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Get()
  findAll(@Query() pagination: PaginationDto, @CurrentUser() user: RequestUser) {
    return this.programsService.findAll(pagination, user);
  }

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.programsService.findOne(id, user);
  }

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProgramDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.programsService.update(id, dto, user);
  }

  @Roles(UserRole.COACH, UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.programsService.remove(id, user);
  }
}
