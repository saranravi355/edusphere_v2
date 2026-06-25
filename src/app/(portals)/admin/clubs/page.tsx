import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { Users, Tent, Trophy } from "lucide-react";

export default async function ClubsPage() {
  const clubs = await prisma.club.findMany({
    include: { teacher: { include: { user: true } }, members: true }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Clubs & Extracurriculars" 
        description="Manage after-school programs, teams, and activities."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Tent className="mx-auto mb-4 text-slate-400" size={48} />
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">No Clubs Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't created any extracurricular activities yet.</p>
            <Modal title="Create New Club" buttonText="Create First Club">
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Club Name</label>
                  <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="e.g. Robotics Club" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Teacher</label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    <option>Select a teacher...</option>
                    <option>Mr. Anderson (Science)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea rows={3} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="What does this club do?"></textarea>
                </div>
              </div>
            </Modal>
          </div>
        ) : (
          clubs.map(club => (
            <div key={club.id} className="glass-card flex flex-col h-full">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
                  <Trophy className="text-purple-500" size={24} />
                </div>
              </div>
              <div className="p-6 pt-10 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-navy-900 dark:text-white">{club.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex-1">{club.description}</p>
                
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                      {club.teacher.user.name[0]}
                    </div>
                    {club.teacher.user.name}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400">
                    <Users size={16} />
                    {club.members.length} Members
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
