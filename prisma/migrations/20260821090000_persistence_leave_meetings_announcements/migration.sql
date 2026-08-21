-- Persistence pass: give three screens somewhere to write.
--
-- Every change here is additive — new nullable columns, new columns with
-- defaults, and new tables. Nothing is dropped or renamed, so this is safe to
-- run against a database that is already serving, and it applies to the
-- existing 10,660 rows without touching any of them.

--------------------------------------------------------------------------
-- Teacher leave requests
--
-- /teacher/leave presented a full form — leave type, dates, reason, a
-- substitute teacher — and its submit handler called preventDefault() and set
-- a "sent to the Principal for approval" banner. Nothing was written, and the
-- Principal's queue at /admin/staff/leave reads LeaveRequest, so a request
-- could never arrive. The table existed; two of the four fields the form
-- collects had nowhere to go, which is what these columns are for.
--------------------------------------------------------------------------
ALTER TABLE "LeaveRequest" ADD COLUMN     "leaveType" TEXT NOT NULL DEFAULT 'CASUAL';
ALTER TABLE "LeaveRequest" ADD COLUMN     "substituteTeacherId" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN     "decidedAt" TIMESTAMP(3);
ALTER TABLE "LeaveRequest" ADD COLUMN     "decidedById" TEXT;

ALTER TABLE "LeaveRequest"
  ADD CONSTRAINT "LeaveRequest_substituteTeacherId_fkey"
  FOREIGN KEY ("substituteTeacherId") REFERENCES "Teacher"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

--------------------------------------------------------------------------
-- Exam integrity
--
-- The exam lockdown counted full-screen breaches and told the student they
-- were being recorded; the count lived in React state and was thrown away on
-- submit. And answers were only ever sent in one final payload, so a crash or
-- a flat battery mid-paper lost the whole script — the unique index is what
-- lets each answer be saved as it is typed.
--------------------------------------------------------------------------
ALTER TABLE "QuizAttempt" ADD COLUMN     "violations" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "QuizResponse_attemptId_questionId_key"
  ON "QuizResponse"("attemptId", "questionId");

--------------------------------------------------------------------------
-- School-wide announcements
--
-- The admin dashboard's announcement dialog slept for one second and returned
-- success. The title and body were discarded and the audience checkboxes had
-- no name attribute, so they never reached the server at all.
--------------------------------------------------------------------------
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "authorId" TEXT NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

ALTER TABLE "Announcement"
  ADD CONSTRAINT "Announcement_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

--------------------------------------------------------------------------
-- Parent-teacher meetings
--
-- /parent/meetings drew a booking flow with a teacher list, a date picker and
-- four time slots, one struck through as already taken. None of the five
-- controls had a handler, and the "upcoming meeting" above them — a named
-- teacher, a date, a generated Zoom link — was hardcoded markup.
--
-- The unique index is deliberate: the database, not the UI, is what stops two
-- parents booking the same fifteen minutes with the same teacher.
--------------------------------------------------------------------------
CREATE TABLE "ParentTeacherMeeting" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentTeacherMeeting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ParentTeacherMeeting_teacherId_scheduledAt_key"
  ON "ParentTeacherMeeting"("teacherId", "scheduledAt");

CREATE INDEX "ParentTeacherMeeting_parentId_idx" ON "ParentTeacherMeeting"("parentId");

ALTER TABLE "ParentTeacherMeeting"
  ADD CONSTRAINT "ParentTeacherMeeting_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParentTeacherMeeting"
  ADD CONSTRAINT "ParentTeacherMeeting_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParentTeacherMeeting"
  ADD CONSTRAINT "ParentTeacherMeeting_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
