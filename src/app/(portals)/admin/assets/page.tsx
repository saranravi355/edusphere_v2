import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { Monitor, Laptop, Plus, CheckCircle2 } from "lucide-react";

export default async function AssetsPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="IT Asset Management" 
        description="Track school devices, laptops, and lab equipment checkouts."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800">
          <Monitor className="text-slate-600 dark:text-slate-400 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">450</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Assets</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <CheckCircle2 className="text-green-600 dark:text-green-400 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">412</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Available</p>
        </div>
        <div className="glass-card flex items-center justify-center bg-primary-600 border-none shadow-lg shadow-primary-600/30">
          <Modal title="Add New Asset" buttonText="Add Asset" buttonIcon={<Plus size={24} />}>
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Device Name</label>
                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="e.g. MacBook Air M2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    <option>Laptop</option>
                    <option>Tablet / iPad</option>
                    <option>Lab Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Serial Number</label>
                  <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="e.g. C02X..." />
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Active Checkouts</h2>
          <Modal title="Checkout Asset" buttonText="New Checkout" buttonIcon={<Laptop size={16} />}>
             <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Serial Number</label>
                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="Scan barcode or type serial..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign To (User ID/Email)</label>
                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="Search user..." />
              </div>
            </div>
          </Modal>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Device Name</th>
                <th className="p-4 font-medium">Serial No</th>
                <th className="p-4 font-medium">Assigned To</th>
                <th className="p-4 font-medium">Checkout Date</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                <td className="p-4 font-medium text-slate-800 dark:text-slate-200">MacBook Air M2</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs">C02X87B9</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">Mr. Anderson (Teacher)</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">Sep 1, 2026</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-semibold">
                    Checked Out
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
