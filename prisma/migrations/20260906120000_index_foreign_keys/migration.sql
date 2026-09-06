-- Index the foreign keys the application actually filters and joins on.
--
-- PostgreSQL creates an index for a PRIMARY KEY and for a UNIQUE constraint, but
-- NOT for a foreign key. Sixty-one models had eighteen indexes between them, so
-- almost every lookup in the app -- a student's attendance, a teacher's classes,
-- a parent's inbox -- was a sequential scan, and every ON DELETE CASCADE had to
-- scan the referencing table to find its children.
--
-- At the current size (about 10,000 rows) none of this is visible. It stops being
-- invisible somewhere around a full school's worth of history, and adding indexes
-- to a table is far cheaper now than it will be then.
--
-- Every statement is IF NOT EXISTS so this is safe to re-run, and the names follow
-- Prisma's own convention (<Table>_<columns>_idx) so a later `prisma migrate diff`
-- sees them as already satisfied rather than proposing them again.
--
-- These are plain CREATE INDEX statements, which take a lock that blocks writes on
-- the table while the index builds. On this data that is milliseconds. If this is
-- ever re-run against a school with years of attendance in it, build them with
-- CREATE INDEX CONCURRENTLY instead -- outside a migration, since Prisma wraps each
-- migration in a transaction and CONCURRENTLY cannot run inside one.

CREATE INDEX IF NOT EXISTS "Student_classroomId_idx" ON "Student"("classroomId");
CREATE INDEX IF NOT EXISTS "Student_parentId_idx" ON "Student"("parentId");
CREATE INDEX IF NOT EXISTS "Classroom_teacherId_idx" ON "Classroom"("teacherId");
CREATE INDEX IF NOT EXISTS "Classroom_schoolId_idx" ON "Classroom"("schoolId");
CREATE INDEX IF NOT EXISTS "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX IF NOT EXISTS "Grade_studentId_date_idx" ON "Grade"("studentId", "date");
CREATE INDEX IF NOT EXISTS "Grade_subjectId_idx" ON "Grade"("subjectId");
CREATE INDEX IF NOT EXISTS "Homework_classroomId_dueDate_idx" ON "Homework"("classroomId", "dueDate");
CREATE INDEX IF NOT EXISTS "Homework_teacherId_idx" ON "Homework"("teacherId");
CREATE INDEX IF NOT EXISTS "Homework_subjectId_idx" ON "Homework"("subjectId");
CREATE INDEX IF NOT EXISTS "HomeworkSubmission_homeworkId_idx" ON "HomeworkSubmission"("homeworkId");
CREATE INDEX IF NOT EXISTS "HomeworkSubmission_studentId_idx" ON "HomeworkSubmission"("studentId");
CREATE INDEX IF NOT EXISTS "Message_receiverId_isRead_idx" ON "Message"("receiverId", "isRead");
CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS "BehaviorIncident_studentId_date_idx" ON "BehaviorIncident"("studentId", "date");
CREATE INDEX IF NOT EXISTS "BehaviorIncident_teacherId_idx" ON "BehaviorIncident"("teacherId");
CREATE INDEX IF NOT EXISTS "WalletTransaction_studentId_idx" ON "WalletTransaction"("studentId");
CREATE INDEX IF NOT EXISTS "Club_teacherId_idx" ON "Club"("teacherId");
CREATE INDEX IF NOT EXISTS "ClubActivity_clubId_idx" ON "ClubActivity"("clubId");
CREATE INDEX IF NOT EXISTS "ClubMembership_studentId_idx" ON "ClubMembership"("studentId");
CREATE INDEX IF NOT EXISTS "ClubMembership_clubId_idx" ON "ClubMembership"("clubId");
CREATE INDEX IF NOT EXISTS "ClinicVisit_studentId_idx" ON "ClinicVisit"("studentId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_teacherId_status_idx" ON "LeaveRequest"("teacherId", "status");
CREATE INDEX IF NOT EXISTS "LeaveRequest_substituteTeacherId_idx" ON "LeaveRequest"("substituteTeacherId");
CREATE INDEX IF NOT EXISTS "TimetableEntry_classroomId_idx" ON "TimetableEntry"("classroomId");
CREATE INDEX IF NOT EXISTS "TimetableEntry_teacherId_idx" ON "TimetableEntry"("teacherId");
CREATE INDEX IF NOT EXISTS "FeeInvoice_studentId_status_idx" ON "FeeInvoice"("studentId", "status");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_invoiceId_idx" ON "PaymentTransaction"("invoiceId");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Quiz_classroomId_status_idx" ON "Quiz"("classroomId", "status");
CREATE INDEX IF NOT EXISTS "Quiz_teacherId_idx" ON "Quiz"("teacherId");
CREATE INDEX IF NOT EXISTS "Question_quizId_idx" ON "Question"("quizId");
CREATE INDEX IF NOT EXISTS "QuizAttempt_quizId_studentId_idx" ON "QuizAttempt"("quizId", "studentId");
CREATE INDEX IF NOT EXISTS "QuizAttempt_studentId_idx" ON "QuizAttempt"("studentId");
CREATE INDEX IF NOT EXISTS "AssetCheckout_assetId_idx" ON "AssetCheckout"("assetId");
CREATE INDEX IF NOT EXISTS "AssetCheckout_userId_idx" ON "AssetCheckout"("userId");
CREATE INDEX IF NOT EXISTS "HostelStudent_roomId_idx" ON "HostelStudent"("roomId");
CREATE INDEX IF NOT EXISTS "ResourceBooking_resourceId_idx" ON "ResourceBooking"("resourceId");
CREATE INDEX IF NOT EXISTS "ResourceBooking_userId_idx" ON "ResourceBooking"("userId");
CREATE INDEX IF NOT EXISTS "IEPPlan_studentId_idx" ON "IEPPlan"("studentId");
CREATE INDEX IF NOT EXISTS "IEPPlan_caseManagerId_idx" ON "IEPPlan"("caseManagerId");
CREATE INDEX IF NOT EXISTS "IEPGoal_planId_idx" ON "IEPGoal"("planId");
CREATE INDEX IF NOT EXISTS "PDRecord_teacherId_idx" ON "PDRecord"("teacherId");
CREATE INDEX IF NOT EXISTS "Observation_teacherId_idx" ON "Observation"("teacherId");
CREATE INDEX IF NOT EXISTS "IBSubjectRecord_studentId_idx" ON "IBSubjectRecord"("studentId");
CREATE INDEX IF NOT EXISTS "IBCoreRecord_studentId_idx" ON "IBCoreRecord"("studentId");
CREATE INDEX IF NOT EXISTS "LessonPlan_teacherId_date_idx" ON "LessonPlan"("teacherId", "date");
CREATE INDEX IF NOT EXISTS "AcademicEvent_startDate_idx" ON "AcademicEvent"("startDate");
CREATE INDEX IF NOT EXISTS "AssessmentResult_studentId_date_idx" ON "AssessmentResult"("studentId", "date");
CREATE INDEX IF NOT EXISTS "HostelLeave_studentId_idx" ON "HostelLeave"("studentId");
CREATE INDEX IF NOT EXISTS "Announcement_authorId_idx" ON "Announcement"("authorId");
CREATE INDEX IF NOT EXISTS "ParentTeacherMeeting_studentId_idx" ON "ParentTeacherMeeting"("studentId");
CREATE INDEX IF NOT EXISTS "StudentTransport_stopId_idx" ON "StudentTransport"("stopId");
CREATE INDEX IF NOT EXISTS "PayrollLine_teacherId_idx" ON "PayrollLine"("teacherId");
CREATE INDEX IF NOT EXISTS "SubjectResource_subjectName_programme_idx" ON "SubjectResource"("subjectName", "programme");
CREATE INDEX IF NOT EXISTS "IBExamSession_date_idx" ON "IBExamSession"("date");
