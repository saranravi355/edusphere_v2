import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SchoolSnapshot from "@/components/dashboard/SchoolSnapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import Link from "next/link";
import { firstName } from "@/lib/utils";

/*
 * `sendMessage` used to live here: a second copy of the parent messaging action
 * with no caller — this page renders no form — that checked only that someone
 * was signed in and then wrote a message to whatever receiverId arrived. A
 * "use server" export is an addressable endpoint whether or not a page calls it,
 * so an unused copy is still a way for any account to post into any inbox under
 * its own name. The live one is in parent/actions.ts, which now checks the
 * sender is a parent of a child the recipient actually teaches.
 */

export default async function ParentDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect("/");
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: { include: { classroom: true } } }
  });

  const children = parent?.students || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Welcome back, ${firstName(session.user.name, "Parent")}`}
        description="Stay up to date with your children's school activities."
      />

      <SchoolSnapshot />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <CardTitle>{child.name}&apos;s Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">Grade {child.classroom?.gradeLevel ?? "—"} • {child.classroom?.name || "Unassigned"}</p>
              <div className="flex gap-3">
                {/*
                  This linked to /admin/users/<studentId>: an admin route that
                  bounces every parent straight back to /, and a Student id in a
                  route that expects a User id. These go where a parent can
                  actually go.
                */}
                <Link href="/parent/attendance" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <Clock size={12} aria-hidden /> Attendance
                </Link>
                <Link href="/parent/grades" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <Clock size={12} aria-hidden /> Grades
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {children.length === 0 && (
          <p className="text-sm text-slate-400 py-6 col-span-2 text-center">No children linked to this account.</p>
        )}
      </div>
    </div>
  );
}
