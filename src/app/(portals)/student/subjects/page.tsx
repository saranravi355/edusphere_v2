import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SubjectsClient from "./SubjectsClient";

export const dynamic = "force-dynamic";

export default async function MySubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { ibSubjects: { orderBy: { subjectGroup: "asc" } } },
  });
  if (!student) redirect("/student");

  const subjectNames = student.ibSubjects.map((s) => s.subjectName);

  // Resolve an incoming ?subject= param (e.g. from the timetable) to the closest
  // real IB subject so the page opens on that subject's card. Falls back to the
  // full "All subjects" overview when there's no confident match.
  const { subject: subjectParam } = await searchParams;
  let initialSubject: string | undefined;
  if (subjectParam) {
    const q = subjectParam.trim().toLowerCase();
    initialSubject =
      subjectNames.find((n) => n.toLowerCase() === q) ??
      subjectNames.find((n) => n.toLowerCase().includes(q) || q.includes(n.toLowerCase()));
  }

  const [results, resources] = await Promise.all([
    prisma.assessmentResult.findMany({
      where: { studentId: student.id },
      orderBy: { date: "asc" },
    }),
    prisma.subjectResource.findMany({
      where: { subjectName: { in: subjectNames } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="My Subjects"
        description="Everything for each of your subjects in one place — resources, complete grade history and every assessment result."
      />
      <SubjectsClient
        initialSubject={initialSubject}
        subjects={student.ibSubjects.map((s) => ({
          subjectName: s.subjectName,
          subjectGroup: s.subjectGroup,
          level: s.level,
          currentGrade: s.currentGrade,
          predictedGrade: s.predictedGrade,
          critA: s.critA,
          critB: s.critB,
          critC: s.critC,
          critD: s.critD,
          teacherComment: s.teacherComment,
        }))}
        results={results.map((r) => ({
          id: r.id,
          subjectName: r.subjectName,
          title: r.title,
          type: r.type,
          date: r.date.toISOString(),
          grade: r.grade,
          maxGrade: r.maxGrade,
          comment: r.comment,
          term: r.term,
        }))}
        resources={resources.map((r) => ({
          id: r.id,
          subjectName: r.subjectName,
          title: r.title,
          type: r.type,
          description: r.description,
          url: r.url,
          addedBy: r.addedBy,
        }))}
      />
    </div>
  );
}
