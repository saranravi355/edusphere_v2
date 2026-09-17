-- Bulk upload support: a batch of scanned sheets is OCR'd and graded before a student is
-- necessarily known for every sheet (grading only needs subject/level/programme), so studentId
-- must accept NULL until a teacher assigns or confirms a match. originalFileName and batchId
-- support filename-based matching and scoping the class-summary export to one upload batch.
--
-- Hand-written rather than `prisma migrate dev` output: this database carries four manual
-- backup tables from past incidents (AssessmentResult_future_dated_backup,
-- IBCoreRecord_myp_removed_backup, IBSubjectRecord_myp_grade_backup,
-- IBSubjectRecord_wrong_programme_backup) that are not declared in schema.prisma - a full
-- `migrate dev` diff against the live database wants to DROP all four. This migration touches
-- only AIGradingSubmission.

-- AlterTable
ALTER TABLE "AIGradingSubmission" ALTER COLUMN "studentId" DROP NOT NULL;
ALTER TABLE "AIGradingSubmission" ADD COLUMN "originalFileName" TEXT;
ALTER TABLE "AIGradingSubmission" ADD COLUMN "batchId" TEXT;

-- CreateIndex
CREATE INDEX "AIGradingSubmission_batchId_idx" ON "AIGradingSubmission"("batchId");
