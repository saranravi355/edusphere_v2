import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import PortfolioClient from "./PortfolioClient";

export const dynamic = "force-dynamic";

export default async function StudentPortfolioPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!student) redirect("/student");

  const items = await prisma.portfolioItem.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Portfolio"
        description="Keep pieces of your work across the years — useful for university applications, CAS evidence, or just looking back on your progress."
      />
      <PortfolioClient
        items={items.map((i) => ({
          id: i.id,
          title: i.title,
          description: i.description,
          subject: i.subject,
          academicYear: i.academicYear,
          fileUrl: i.fileUrl,
          fileType: i.fileType,
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
