import PageHeader from "@/components/ui/PageHeader";
import { BookOpen } from "lucide-react";

export default function StudentGrades() {
  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader 
        title="My Grades" 
        description="View your current academic performance across all subjects."
      />
      
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen size={18} className="text-blue-500" />
            Current Semester
          </h3>
        </div>
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-slate-500">
          <BookOpen size={64} className="mb-4 opacity-20" />
          <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">No Grades Published Yet</p>
          <p className="text-sm mt-2 text-center max-w-sm">
            Your teachers have not published the final grades for this semester yet. Check back soon!
          </p>
        </div>
      </div>
    </div>
  );
}
