import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserPlus } from "lucide-react";

async function registerStudent(formData: FormData) {
  "use server";

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const curriculum = (formData.get("curriculum") as string) || "MYP";
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const fatherName = formData.get("fatherName") as string;
  const motherName = formData.get("motherName") as string;
  const motherOccupation = formData.get("motherOccupation") as string;
  const motherMonthlyIncome = formData.get("motherIncome") as string;
  const address = formData.get("address") as string;

  const user = email
    ? await prisma.user.create({
        data: {
          name,
          email,
          password: "changeme123",
          role: "STUDENT",
        }
      })
    : null;

  await prisma.student.create({
    data: {
      registrationNo: `STU-${Date.now()}`,
      name,
      curriculum,
      userId: user?.id,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
      fatherName,
      motherName,
      motherOccupation,
      motherMonthlyIncome,
      address,
    }
  });

  revalidatePath("/admin/students/register");
  revalidatePath("/admin/users");
}

export default async function RegisterStudentPage() {
  const session = await getSession();
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL')) {
    redirect("/");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Register New Student"
        description="Add a new student record and create their portal account."
      />

      <form action={registerStudent} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
            <input required name="name" type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
            <input required name="email" type="email" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">IB Programme</label>
            <select required name="curriculum" defaultValue="MYP" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500">
              <option value="PYP">PYP (Primary Years Programme)</option>
              <option value="MYP">MYP (Middle Years Programme)</option>
              <option value="DP">DP (Diploma Programme)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Date of Birth</label>
            <input required name="dateOfBirth" type="date" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        <h3 className="font-bold text-slate-800 dark:text-slate-200">Guardian Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Father&apos;s Name</label>
            <input name="fatherName" type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mother&apos;s Name</label>
            <input name="motherName" type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mother&apos;s Occupation</label>
            <input name="motherOccupation" type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mother&apos;s Monthly Income</label>
            <input name="motherIncome" type="number" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Address</label>
          <textarea name="address" rows={3} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 resize-none" />
        </div>

        <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm">
          <UserPlus size={16} /> Re