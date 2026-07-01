"use client";

import PageHeader from "@/components/ui/PageHeader";
import AIControlPanel from "@/components/ai/AIControlPanel";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { useAIScan } from "@/lib/useAIScan";
import { Scale, Users } from "lucide-react";

const teachers = [
  { name: "Ms. R. Sharma", role: "DP Mathematics HL/SL", load: 92, ia: 38, cas: 2 },
  { name: "Mr. D. Clark", role: "MYP Individuals & Societies", load: 88, ia: 0, cas: 1 },
  { name: "Mrs. A. Davis", role: "DP English A Lit, TOK Coordinator", load: 95, ia: 31, cas: 3 },
  { name: "Mr. K. Iyer", role: "MYP Sciences", load: 61, ia: 0, cas: 0 },
  { name: "Ms. P. Menon", role: "DP Visual Arts", load: 58, ia: 22, cas: 1 },
];

export default function WorkloadBalancerPage() {
  const { running, complete, run } = useAIScan(2500);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Teacher Workload Balancer"
        description="Weighs teaching periods, IA/EE marking load, CAS supervision and pastoral duties to flag uneven distribution across the staff body."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIControlPanel
            icon={Scale}
            title="Load Balancer"
            description="Combines timetable hours, IA/EE marking counts, CAS supervision slots and duty roster data into a normalized workload index per teacher."
            runLabel="Run Balance Check"
            runningLabel="Calculating Load Index..."
            completeLabel="Analysis Complete"
            completeSubLabel="2 teachers above 90% capacity"
            running={running}
            complete={complete}
            onRun={run}
            accent="amber"
          />
        </div>
        <div className="lg:col-span-2">
          {complete ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Users size={18} className="text-amber-500" /> Workload Index by Teacher</h3>
              <div className="space-y-4">
                {teachers.map((t, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{t.name}</span>
                      <span className={`font-mono font-bold ${t.load > 85 ? "text-rose-500" : t.load > 70 ? "text-amber-500" : "text-emerald-500"}`}>{t.load}%</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{t.role} · {t.ia} IAs to mark · {t.cas} CAS groups</p>
                    <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${t.load > 85 ? "bg-rose-500" : t.load > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${t.load}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <AIEmptyState icon={Scale} title="Awaiting Analysis" subtitle="Run the balancer to see workload distribution across teaching staff." />
          )}
        </div>
      </div>
    </div>
  );
}
