import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export const dynamic = "force-dynamic";
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

async function topUp(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") return;
  const amount = parseFloat(String(formData.get("amount") || ""));
  if (isNaN(amount) || amount <= 0) return;
  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return;
  await prisma.walletTransaction.create({
    data: { studentId: student.id, type: "TOP_UP", amount, description: "Parent Top-up", date: new Date() },
  });
  revalidatePath("/student/wallet");
}

export default async function StudentWalletPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  const txns = student
    ? await prisma.walletTransaction.findMany({ where: { studentId: student.id }, orderBy: { date: "desc" }, take: 30 })
    : [];
  // Balance across all transactions (not just the 30 most recent shown below).
  const allForBalance = student ? await prisma.walletTransaction.findMany({ where: { studentId: student.id } }) : [];
  const trueBalance = allForBalance.reduce((b, t) => (t.type === "TOP_UP" ? b + t.amount : b - t.amount), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader title="My Wallet" description="Your canteen and campus spending balance." />

      <div className="bg-primary rounded-lg p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={150} /></div>
        <div className="relative z-10">
          <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">Available Balance</p>
          <h2 className="text-4xl font-bold mb-6">{inr(trueBalance)}</h2>
          <form action={topUp} className="flex items-center gap-2">
            <input name="amount" type="number" min="1" step="1" placeholder="Amount (₹)"
              className="px-4 py-2.5 rounded-lg text-slate-900 text-sm w-40 outline-none" />
            <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary font-bold rounded-lg shadow hover:bg-slate-50 transition-colors text-sm">
              <Plus size={16} /> Top Up
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-heading text-base text-slate-800 dark:text-slate-100">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {txns.length === 0 && <p className="px-6 py-8 text-center text-sm text-slate-400">No transactions yet.</p>}
          {txns.map((tx) => {
            const credit = tx.type === "TOP_UP";
            return (
              <div key={tx.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${credit ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {credit ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tx.description || (credit ? "Top-up" : "Purchase")}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${credit ? "text-green-600 dark:text-green-400" : "text-slate-800 dark:text-slate-200"}`}>
                  {credit ? "+" : "−"}{inr(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
