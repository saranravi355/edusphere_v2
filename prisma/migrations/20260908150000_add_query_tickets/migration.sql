-- CreateTable
CREATE TABLE "QueryTicket" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueryTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueryTicket_studentId_idx" ON "QueryTicket"("studentId");

-- CreateIndex
CREATE INDEX "QueryTicket_teacherId_idx" ON "QueryTicket"("teacherId");

-- CreateIndex
CREATE INDEX "QueryTicketMessage_ticketId_idx" ON "QueryTicketMessage"("ticketId");

-- AddForeignKey
ALTER TABLE "QueryTicket" ADD CONSTRAINT "QueryTicket_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryTicket" ADD CONSTRAINT "QueryTicket_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryTicketMessage" ADD CONSTRAINT "QueryTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "QueryTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
