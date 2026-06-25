import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, QrCode } from "lucide-react";
import { getSession } from "@/lib/session";

export default async function WalletPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') return null;

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return null;

  const transactions = await prisma.walletTransaction.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 10
  });

  // Calculate mock balance
  let balance = 150.50; // Mock starting balance

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Digital Wallet" 
        description="Manage your cafeteria funds and digital payments."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-900 to-navy-900 text-white dark:border-indigo-500/30 col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <Wallet size={120} />
          </div>
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">Available Balance</p>
            <h2 className="text-4xl font-bold tracking-tight">${balance.toFixed(2)}</h2>
          </div>
          <div className="mt-8 flex gap-4">
            <Modal title="Top Up Wallet" buttonText="Top Up" buttonIcon={<Wallet size={16} />}>
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                  <input type="number" defaultValue="50.00" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    <option>Credit Card ending in 4242</option>
                    <option>Apple Pay</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
              </div>
            </Modal>
            <button className="px-4 py-2 bg-indigo-800 text-white border border-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2">
              <QrCode size={16} /> Pay with QR
            </button>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-700 dark:text-slate-300">
            <CreditCard size={32} />
          </div>
          <h3 className="font-bold text-navy-900 dark:text-white">Auto-Reload</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">Your account will top-up when balance falls below ₹20.00</p>
          <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full">
            Active
          </span>
        </div>
      </div>

      <div className="glass-card mt-4">
        <div className="p-6 border-b border-ui-border dark:border-slate-800">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Wallet className="mx-auto mb-3 opacity-50" size={32} />
              <p>No recent transactions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map(t => (
                <div key={t.id} className="flex justify-between items-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-ui-border dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'TOP_UP' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                      {t.type === 'TOP_UP' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-navy-900 dark:text-slate-200">{t.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.date.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'TOP_UP' ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {t.type === 'TOP_UP' ? '+' : '-'}${t.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
