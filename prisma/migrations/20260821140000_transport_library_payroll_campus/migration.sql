-- Give five more screens somewhere to write.
--
-- Additive only: new tables, one new nullable column on Classroom and one on
-- Teacher. Nothing is dropped or renamed, so this applies to a live database
-- without touching existing rows.

--------------------------------------------------------------------------
-- Campuses
--
-- /admin/schools listed two campuses with 1,250 and 840 students, both marked
-- Active, from a hardcoded array in the page — next to an "+ Add Campus" and a
-- "Manage Settings" button, neither of which had a handler. There was no School
-- model at all. Classrooms belong to a campus now, so the enrolment number on a
-- campus card is a count rather than a figure somebody typed.
--------------------------------------------------------------------------
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campusCode" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "principalName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "School_campusCode_key" ON "School"("campusCode");

ALTER TABLE "Classroom" ADD COLUMN "schoolId" TEXT;

ALTER TABLE "Classroom"
  ADD CONSTRAINT "Classroom_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the campus that already exists in real life, and put every current class
-- on it, so the page is true the moment it loads rather than starting empty.
INSERT INTO "School" ("id", "name", "campusCode", "isActive", "createdAt")
VALUES ('campus_main', 'Main Campus', 'MAIN', true, CURRENT_TIMESTAMP);

UPDATE "Classroom" SET "schoolId" = 'campus_main' WHERE "schoolId" IS NULL;

--------------------------------------------------------------------------
-- Transport
--
-- /admin/transport reported "24/26 active vehicles", 24 drivers and one alert
-- above three named routes with ETAs — a literal array in the page, with a
-- "Track" button that had no handler. /parent/transport/live animated a bus
-- along a CSS road, counting an ETA down from a hardcoded 12 minutes with
-- setInterval, and named a driver and a vehicle that do not exist.
--------------------------------------------------------------------------
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransportRoute_name_key" ON "TransportRoute"("name");

CREATE TABLE "TransportStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pickupTime" TEXT NOT NULL,
    "dropTime" TEXT,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "TransportStop_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransportStop_routeId_sequence_key" ON "TransportStop"("routeId", "sequence");

CREATE TABLE "StudentTransport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentTransport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentTransport_studentId_key" ON "StudentTransport"("studentId");
CREATE INDEX "StudentTransport_routeId_idx" ON "StudentTransport"("routeId");

ALTER TABLE "TransportStop"
  ADD CONSTRAINT "TransportStop_routeId_fkey"
  FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentTransport"
  ADD CONSTRAINT "StudentTransport_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentTransport"
  ADD CONSTRAINT "StudentTransport_routeId_fkey"
  FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentTransport"
  ADD CONSTRAINT "StudentTransport_stopId_fkey"
  FOREIGN KEY ("stopId") REFERENCES "TransportStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

--------------------------------------------------------------------------
-- Library
--
-- /student/library listed four hardcoded books with a dead search box, a dead
-- subject filter and a download button with no href. The admin side was
-- replaced earlier in this project with an honest "not built yet" notice
-- precisely because there was no model behind it. This is that model.
--------------------------------------------------------------------------
CREATE TABLE "LibraryBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "subjectName" TEXT,
    "copiesTotal" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryBook_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LibraryBook_isbn_key" ON "LibraryBook"("isbn");
CREATE INDEX "LibraryBook_title_idx" ON "LibraryBook"("title");

CREATE TABLE "BookLoan" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "BookLoan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookLoan_bookId_status_idx" ON "BookLoan"("bookId", "status");
CREATE INDEX "BookLoan_userId_status_idx" ON "BookLoan"("userId", "status");

ALTER TABLE "BookLoan"
  ADD CONSTRAINT "BookLoan_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "LibraryBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookLoan"
  ADD CONSTRAINT "BookLoan_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

--------------------------------------------------------------------------
-- Payroll
--
-- The payroll screen's cycle dropdown had no name and no handler; "Run Payroll
-- Batch" was a 2.5-second setTimeout followed by three hardcoded staff rows and
-- a hardcoded "₹2,45,600 across 85 Staff Members"; "Disburse Funds" and
-- "Export CSV" had no onClick. A banner said it was "Syncing with Leave Module
-- to calculate UTO deductions" — nothing read the leave module. There was no
-- payroll model and no salary on Teacher.
--------------------------------------------------------------------------
ALTER TABLE "Teacher" ADD COLUMN "baseSalary" DOUBLE PRECISION;

CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalNet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disbursedAt" TIMESTAMP(3),

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayrollRun_period_key" ON "PayrollRun"("period");

CREATE TABLE "PayrollLine" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "unpaidDays" INTEGER NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPay" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PayrollLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayrollLine_runId_teacherId_key" ON "PayrollLine"("runId", "teacherId");

ALTER TABLE "PayrollLine"
  ADD CONSTRAINT "PayrollLine_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PayrollLine"
  ADD CONSTRAINT "PayrollLine_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

--------------------------------------------------------------------------
-- PYP units of inquiry
--
-- /admin/programmes drew six transdisciplinary theme bars with done/total
-- counts taken from a PYP_THEMES literal, and a "units of inquiry completed"
-- stat to match — sitting beside real DP and MYP figures read from the database.
--------------------------------------------------------------------------
CREATE TABLE "PYPUnit" (
    "id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PYPUnit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PYPUnit_theme_idx" ON "PYPUnit"("theme");
