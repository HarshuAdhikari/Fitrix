-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "description" TEXT,
ADD COLUMN     "difficulty" "Difficulty",
ADD COLUMN     "targetAreas" "TargetArea"[] DEFAULT ARRAY[]::"TargetArea"[];
