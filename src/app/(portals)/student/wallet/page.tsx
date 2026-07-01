"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";

const mockTransactions = [
  { id: 1, label: "Canteen Lunch", amount: -12.50, date: "2026-06-28", type: "debit" },
  { id: 2, label: "Top Up via Card", amount: 50.00, date: "2026-06-25", type: "credit" },
  { id: 3, label: "Library Fine", amount: -2.00, date: "2026-06-20", type: "debit" },
  { id: 4, label: "Canteen Snacks", amount: -5.00, date: "2026-06-19", type: "debit" },
  { id: 5, label: "Top Up via UPI", amount: 30.00, date: "2026-06-10", type: "credit" },
];

function Modal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold mb-4 dark:text-white">Top Up Wallet</h3>
        <div className="space-y-4">
          <input type="number" placeholder="Amount ($)" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-3 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors">
            Confirm Top Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentWalletPage() {
  const [showModal, setShowModal] = useState(false);
  const balance = 150.50; // Mock starting balance

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="My Wallet"
        description="Manage your canteen and campus spending balance."
      />

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet size={150} />
        </div>
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-2">Available Balance</p>
          <h2 className="text-4xl font-black mb-6">${balance.toFixed(2)}</h2>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-colors"
          >
            <Plus size={16} /> Top Up Wallet
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {mockTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {tx.type === 'credit' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tx.label}</p>
                  <p className="text-xs text-slate-500">{tx.date}</p>
                </div>
              </div>
              <span className={`font-bold text-sm ${tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {tx.type === 'credit' ? '+' : ''}{tx.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
}
