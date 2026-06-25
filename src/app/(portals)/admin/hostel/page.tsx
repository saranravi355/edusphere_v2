import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { Bed, Users, DoorOpen, Plus } from "lucide-react";

export default async function HostelPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Hostel & Dormitory Management" 
        description="Manage room allocations, blocks, and boarding students."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
          <Bed className="text-indigo-600 dark:text-indigo-400 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">120</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Rooms</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30">
          <Users className="text-teal-600 dark:text-teal-400 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">342</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Boarding Students</p>
        </div>
        <div className="glass-card flex items-center justify-center bg-primary-600 border-none shadow-lg shadow-primary-600/30">
          <Modal title="Allocate Room" buttonText="Allocate Room" buttonIcon={<DoorOpen size={24} />}>
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student</label>
                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="Search student by name or ID..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Block / Wing</label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    <option>North Block (Boys)</option>
                    <option>South Block (Girls)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room Number</label>
                  <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="e.g. N-204" />
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Room Allocations</h2>
          <Modal title="Add New Room" buttonText="Add Room" buttonIcon={<Plus size={16} />}>
             <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room Number</label>
                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="e.g. N-101" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
                  <input type="number" defaultValue="4" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    <option>Non-AC</option>
                    <option>AC</option>
                  </select>
                </div>
              </div>
            </div>
          </Modal>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Room No.</th>
                <th className="p-4 font-medium">Block</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Occupancy</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">N-101</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">North Block</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">Non-AC</td>
                <td className="p-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">4 / 4</span>
                </td>
                <td className="p-4 text-blue-600 dark:text-blue-400 font-medium cursor-pointer">View Occupants</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">N-102</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">North Block</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">Non-AC</td>
                <td className="p-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "50%" }}></div>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">2 / 4</span>
                </td>
                <td className="p-4 text-blue-600 dark:text-blue-400 font-medium cursor-pointer">View Occupants</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">N-103</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">North Block</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">AC</td>
                <td className="p-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">1 / 4</span>
                </td>
                <td className="p-4 text-blue-600 dark:text-blue-400 font-medium cursor-pointer">View Occupants</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">S-201</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">South Block</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">Non-AC</td>
                <td className="p-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                    <div className="bg-slate-400 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">0 / 4</span>
                </td>
                <td className="p-4 text-blue-600 dark:text-blue-400 font-medium cursor-pointer">View Occupants</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
