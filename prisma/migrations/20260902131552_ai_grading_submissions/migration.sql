-- CreateTable
CREATE TABLE "AIGradingSubmission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "courseworkType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "ocrText" TEXT,
    "ocrPages" JSONB,
    "ocrConfidence" DOUBLE PRECISION,
    "result" JSONB NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "maxTotal" INTEGER NOT NULL,
    "providerUsed" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EVALUATED',
    "errorMessage" TEXT,
    "teacherOverrideScore" INTEGER,
    "teacherOverrideQuestionScores" JSONB,
    "teacherFeedback" TEXT,
    "assessmentResultId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIGradingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIGradingSubmission_assessmentResultId_key" ON "AIGradingSubmission"("assessmentResultId");

-- CreateIndex
CREATE INDEX "AIGradingSubmission_teacherId_classroomId_idx" ON "AIGradingSubmission"("teacherId", "classroomId");

-- CreateIndex
CREATE INDEX "AIGradingSubmission_studentId_idx" ON "AIGradingSubmission"("studentId");

-- AddForeignKey
ALTER TABLE "AIGradingSubmission" ADD CONSTRAINT "AIGradingSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGradingSubmission" ADD CONSTRAINT "AIGradingSubmission_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGradingSubmission" ADD CONSTRAINT "AIGradingSubmission_assessmentResultId_fkey" FOREIGN KEY ("assessmentResultId") REFERENCES "AssessmentResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
