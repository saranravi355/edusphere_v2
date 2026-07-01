import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import SchoolSnapshot from "@/components/dashboard/SchoolSnapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MessageSquare, DollarSign } from "lucide-react";
import Link from "next/link";

async function payFee(invoiceId: string) {
  "use server";
  await prisma.feeInvoice.update({ where: { id: invoiceId }, data: { status: 'PAID', paidAt: new Date() } });
  revalidatePath("/parent");
}

async function sendMessage(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) return;
  const content = formData.get("content") as string;
  const receiverId = formData.get("receiverId") as string;
  await prisma.message.create({
    data: { senderId: session.user.id, receiverId, content, subject: "Message from Parent Portal", isRead: false }
  });
  revalidatePath("/parent");
}

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
        title={`Welcome back, ${session.user.name?.split(' ')[0] || 'Parent'}`}
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
                <Link href={`/admin/users/${child.id}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <Clock size={12} /> View Activity
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
