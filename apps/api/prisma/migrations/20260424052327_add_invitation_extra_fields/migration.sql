-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "durationWeeks" INTEGER,
ADD COLUMN     "programId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "videoCallingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
