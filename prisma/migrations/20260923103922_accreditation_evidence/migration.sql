-- CreateTable
CREATE TABLE "EvidenceTag" (
    "id" TEXT NOT NULL,
    "standardKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "note" TEXT,
    "taggedById" TEXT NOT NULL,
    "taggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "lessonPlanId" TEXT,
    "portfolioItemId" TEXT,
    "assessmentResultId" TEXT,
    "observationId" TEXT,
    "documentId" TEXT,

    CONSTRAINT "EvidenceTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "academicYear" TEXT,
    "reviewedOn" TIMESTAMP(3),
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceTag_standardKey_lessonPlanId_key" ON "EvidenceTag"("standardKey", "lessonPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceTag_standardKey_portfolioItemId_key" ON "EvidenceTag"("standardKey", "portfolioItemId");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceTag_standardKey_assessmentResultId_key" ON "EvidenceTag"("standardKey", "assessmentResultId");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceTag_standardKey_observationId_key" ON "EvidenceTag"("standardKey", "observationId");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceTag_standardKey_documentId_key" ON "EvidenceTag"("standardKey", "documentId");

-- CreateIndex
CREATE INDEX "EvidenceTag_standardKey_status_idx" ON "EvidenceTag"("standardKey", "status");

-- CreateIndex
CREATE INDEX "EvidenceTag_status_taggedAt_idx" ON "EvidenceTag"("status", "taggedAt");

-- CreateIndex
CREATE INDEX "EvidenceDocument_kind_idx" ON "EvidenceDocument"("kind");

-- AddForeignKey
ALTER TABLE "EvidenceTag" ADD CONSTRAINT "EvidenceTag_taggedById_fkey" FOREIGN KEY ("taggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceTag" ADD CONSTRAINT "EvidenceTag_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceTag" ADD CONSTRAINT "EvidenceTag_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceTag" ADD CONSTRAINT "EvidenceTag_portfolioItemId_fkey" FOREIGN KEY ("portfolioItemId") REFERENCES "PortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceTag" ADD CONSTRAINT "EvidenceTag_assessmentResultId_fkey" FOREIGN KEY ("assessmentResultId") REFERENCES "AssessmentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceTag" ADD CONSTRAINT "EvidenceTag_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceTag" ADD CONSTRAINT "EvidenceTag_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "EvidenceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceDocument" ADD CONSTRAINT "EvidenceDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one source per tag. Prisma cannot express this, and without it a
-- bug could write a tag pointing at two records, which sourceOf() then throws
-- on and which would already have corrupted the coverage figures.
ALTER TABLE "EvidenceTag"
  ADD CONSTRAINT "EvidenceTag_exactly_one_source" CHECK (
    (
      ("lessonPlanId"       IS NOT NULL)::int +
      ("portfolioItemId"    IS NOT NULL)::int +
      ("assessmentResultId" IS NOT NULL)::int +
      ("observationId"      IS NOT NULL)::int +
      ("documentId"         IS NOT NULL)::int
    ) = 1
  );
