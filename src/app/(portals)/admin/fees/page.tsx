import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { Plus, DollarSign, Edit, Trash2 } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function FeesPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) redirect('/');

  const feeStructures = await prisma.feeStructure.findMany({
    orderBy: { createdAt: 'desc' }
  });

  async function createFeeStructure(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const gradeLevel = formData.get("gradeLevel") as string;
    const academicYear = formData.get("academicYear") as string;

    if (!name || isNaN(amount) || !academicYear) return;

    await prisma.feeStructure.create({
      data: { name, amount, gradeLevel, academicYear }
    });
    revalidatePath("/admin/fees");
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Fee Structures & Plans" 
        description="Define and manage global fee templates for tuition, transport, and extracurriculars."
        action={
          <Modal
            title="Create Fee Structure"
            buttonText="New Fee Plan"
            buttonIcon={<Plus size={16} />}
          >
            <form action={createFeeStructure} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plan Name</label>
                <input required type="text" name="name" placeholder="e.g. Grade 10 Annual Tuition" className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                  <input required type="number" step="0.01" name="amount" placeholder="5000.00" className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                  <input required type="text" name="academicYear" defaultValue="2026-2027" className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Applicable Grade (Optional)</label>
                <select name="gradeLevel" className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                  <option value="">All Grades (Global Fee)</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mt-4">
                Save Fee Plan
              </button>
            </form>
          </Modal>
        }
      />

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Active Fee Templates</h2>
        </div>
        
        {feeStructures.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {feeStructures.map((fee) => (
              <div key={fee.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500 rounded-xl flex items-center justify-center">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{fee.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {fee.academicYear} &bull; {fee.gradeLevel ? `Applies to ${fee.gradeLevel}` : "Global Fee"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-extrabold text-2xl text-slate-800 dark:text-slate-100">${fee.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Per student</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-900/20 rounded-lg">
                      <Edit size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <DollarSign className="mx-auto mb-4 opacity-20" size={48} />
            <p className="text-lg font-medium text-slate-800 dark:text-slate-200">No Fee Plans Configured</p>
            <p className="mt-1 max-w-sm mx-auto">Create a fee structure plan to start assigning invoices to student cohorts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
