import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ProgressReportForm from "./ProgressReportForm";
import { emptyProgressReportData, type ProgressReportData } from "@/lib/progressReport";

export const dynamic = "force-dynamic";

export default async function EditProgressReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true, classes: { select: { id: true } } },
  });
  if (!teacher) redirect("/teacher");

  const report = await prisma.progressReport.findUnique({
    where: { id },
    include: { student: { select: { name: true, registrationNo: true, classroomId: true } } },
  });
  if (!report) notFound();

  const classroomIds = new Set(teacher.classes.map((c) => c.id));
  if (!report.student.classroomId || !classroomIds.has(report.student.classroomId) || report.teacherId !== teacher.id) {
    redirect("/teacher/progress-reports");
  }

  const data = { ...emptyProgressReportData(), ...(report.data as Partial<ProgressReportData>) };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <PageHeader
        title={`Progress Report — ${report.student.name}`}
        description={`${report.term} · ${report.academicYear}${report.grade ? ` · ${report.grade}` : ""} · ${report.status === "GENERATED" ? "Generated" : "Draft"}`}
      />
      <ProgressReportForm reportId={report.id} data={data} pdfUrl={report.pdfUrl} status={report.status} />
    </div>
  );
}
