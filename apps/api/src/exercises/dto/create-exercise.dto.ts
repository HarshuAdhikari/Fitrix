import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsUrl,
} from "class-validator";
import {
  Difficulty,
  Equipment,
  ExerciseType,
  TargetArea,
  TrackingField,
} from "@prisma/client";

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  primaryMuscle!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryMuscles?: string[];

  @IsString()
  @IsNotEmpty()
  equipment!: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Equipment, { each: true })
  equipmentTypes?: Equipment[];

  @IsOptional()
  @IsEnum(ExerciseType)
  exerciseType?: ExerciseType;

  @IsOptional()
  @IsArray()
  @IsEnum(TrackingField, { each: true })
  trackingFields?: TrackingField[];

  @IsOptional()
  @IsArray()
  @IsEnum(TargetArea, { each: true })
  targetAreas?: TargetArea[];

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
