-- Hand-written for the same reason as 20260917070000_ai_grading_bulk_upload_support: this
-- database carries manual backup tables outside schema.prisma that a full `prisma migrate dev`
-- diff wants to drop. This migration only adds the new MarkingScheme table.

-- CreateTable
CREATE TABLE "MarkingScheme" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "courseworkType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkingScheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarkingScheme_teacherId_idx" ON "MarkingScheme"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "MarkingScheme_classroomId_subjectName_title_term_key" ON "MarkingScheme"("classroomId", "subjectName", "title", "term");

-- AddForeignKey
ALTER TABLE "MarkingScheme" ADD CONSTRAINT "MarkingScheme_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
