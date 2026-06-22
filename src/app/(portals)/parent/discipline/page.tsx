import PageHeader from "@/components/ui/PageHeader";
import { ShieldAlert, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export default function ParentDisciplineView() {
  const currentPoints = 85;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader 
        title="Behavior & Conduct" 
        description="Monitor your child's behavior points and teacher logs."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Point Score */}
        <div className="md:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full border-8 border-green-500 flex items-center justify-center mb-4">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{currentPoints}</span>
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Behavior Score</h3>
          <p className="text-sm text-slate-500 mt-1">Excellent Standing</p>
        </div>

        {/* Recent Alerts */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl flex gap-4 items-start">
            <TrendingUp className="text-green-600 mt-1" size={20} />
            <div>
              <h4 className="font-bold text-green-800 dark:text-green-400">Positive Incident Logged</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">"Jane showed outstanding leadership during the group science project today."</p>
              <div className="flex gap-4 mt-2 text-xs font-medium text-green-600 dark:text-green-500">
                <span>+5 Points</span>
                <span>Mrs. Clark</span>
                <span>Today</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-xl flex gap-4 items-start">
            <TrendingDown className="text-slate-400 mt-1" size={20} />
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Minor Incident Logged</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">"Talking out of turn during silent reading time."</p>
              <div className="flex gap-4 mt-2 text-xs font-medium text-slate-500">
                <span className="text-red-500">-1 Point</span>
                <span>Mr. Smith</span>
                <span>Oct 12</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
