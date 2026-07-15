import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function StudentImportPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const classrooms = await prisma.classroom.findMany({
    select: { name: true, gradeLevel: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Bulk Import Students"
        description="Upload a spreadsheet (Excel or CSV), map the columns, review every row, then commit — creates student records, portal logins and linked parents in one pass."
      />
      <ImportClient classrooms={classrooms.map((c) => c.name)} />
    </div>
  );
}
