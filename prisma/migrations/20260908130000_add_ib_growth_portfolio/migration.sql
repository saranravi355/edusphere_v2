-- CreateTable
CREATE TABLE "IBCoreEntry" (
    "id" TEXT NOT NULL,
    "coreRecordId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "strand" TEXT,
    "hours" INTEGER,
    "text" TEXT NOT NULL,
    "approved" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IBCoreEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerProfileEvidence" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnerProfileEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ATLSkillRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "note" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ATLSkillRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "academicYear" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IBCoreEntry_coreRecordId_idx" ON "IBCoreEntry"("coreRecordId");

-- CreateIndex
CREATE INDEX "LearnerProfileEvidence_studentId_idx" ON "LearnerProfileEvidence"("studentId");

-- CreateIndex
CREATE INDEX "LearnerProfileEvidence_recordedById_idx" ON "LearnerProfileEvidence"("recordedById");

-- CreateIndex
CREATE INDEX "ATLSkillRecord_studentId_idx" ON "ATLSkillRecord"("studentId");

-- CreateIndex
CREATE INDEX "ATLSkillRecord_recordedById_idx" ON "ATLSkillRecord"("recordedById");

-- CreateIndex
CREATE INDEX "PortfolioItem_studentId_idx" ON "PortfolioItem"("studentId");

-- AddForeignKey
ALTER TABLE "IBCoreEntry" ADD CONSTRAINT "IBCoreEntry_coreRecordId_fkey" FOREIGN KEY ("coreRecordId") REFERENCES "IBCoreRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerProfileEvidence" ADD CONSTRAINT "LearnerProfileEvidence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerProfileEvidence" ADD CONSTRAINT "LearnerProfileEvidence_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ATLSkillRecord" ADD CONSTRAINT "ATLSkillRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ATLSkillRecord" ADD CONSTRAINT "ATLSkillRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
