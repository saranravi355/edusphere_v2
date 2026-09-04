import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { presenceByStudent } from "@/lib/attendance";
import StudentProfileClient from "./StudentProfileClient";
import type { StudentProfile } from "./types";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      classroom: { select: { name: true, gradeLevel: true } },
      parent: { include: { user: { select: { name: true } } } },
      user: { select: { email: true } },
      ibSubjects: { orderBy: { subjectGroup: "asc" } },
      ibCore: true,
      assessmentResults: { orderBy: { date: "desc" }, take: 8 },
      grades: { include: { subject: { select: { name: true } } }, orderBy: { date: "desc" }, take: 8 },
    },
  });
  if (!student) notFound();

  const presence = (await presenceByStudent([student.id])).get(student.id);

  const profile: StudentProfile = {
    id: student.id,
    photoUrl: student.photoUrl,
    registrationNo: student.registrationNo,
    rollNumber: student.rollNumber,
    name: student.name,
    dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
    gender: student.gender,
    curriculum: student.curriculum,
    className: student.classroom?.name ?? null,
    gradeLevel: student.classroom?.gradeLevel ?? null,
    section: student.section,
    academicYear: student.academicYear,
    isActive: student.isActive,

    email: student.user?.email ?? null,
    phone: student.phone,
    address: student.address,
    city: student.city,
    state: student.state,
    country: student.country,

    fatherName: student.fatherName,
    fatherPhone: student.fatherPhone,
    fatherEmail: student.fatherEmail,
    motherName: student.motherName,
    motherPhone: student.motherPhone,
    motherEmail: student.motherEmail,
    motherOccupation: student.motherOccupation,
    guardianName: student.parent?.user?.name ?? null,
    guardianPhone: student.parent?.phone ?? null,
    emergencyContactName: student.emergencyContactName,
    emergencyContactPhone: student.emergencyContactPhone,

    previousSchool: student.previousSchool,
    admissionDate: student.enrollmentDate.toISOString(),
    bloodGroup: student.bloodGroup,
    learningNeeds: student.learningNeeds,
    allergies: student.allergies,

    attendancePresent: presence?.present ?? 0,
    attendanceTotal: presence?.total ?? 0,
    attendanceRatio: presence?.ratio ?? null,

    ibSubjects: student.ibSubjects.map((s) => ({
      id: s.id,
      subjectName: s.subjectName,
      level: s.level,
      currentGrade: s.currentGrade,
      predictedGrade: s.predictedGrade,
    })),
    ibCore: student.ibCore.map((c) => ({ id: c.id, element: c.element, status: c.status, grade: c.grade })),
    recentAssessments: student.assessmentResults.map((a) => ({
      id: a.id,
      title: a.title,
      subjectName: a.subjectName,
      grade: a.grade,
      date: a.date.toISOString(),
    })),
    recentGrades: student.grades.map((g) => ({
      id: g.id,
      subjectName: g.subject.name,
      examName: g.examName,
      score: g.score,
      maxScore: g.maxScore,
    })),
  };

  return <StudentProfileClient student={profile} />;
}
