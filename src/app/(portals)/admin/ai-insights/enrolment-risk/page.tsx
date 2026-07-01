"use client";

import PageHeader from "@/components/ui/PageHeader";
import AIControlPanel from "@/components/ai/AIControlPanel";
import AIEmptyState from "@/components/ai/AIEmptyState";
import RiskBadge from "@/components/ai/RiskBadge";
import { useAIScan } from "@/lib/useAIScan";
import { LogOut, MessageSquareWarning } from "lucide-react";

const students = [
  { name: "Vikram Choudhary", grade: "DP1", risk: "high" as const, reason: "Parent fee-payment delays (2 cycles) + predicted grades down in 3 of 6 subjects; comparable profile pattern matches past withdrawals." },
  { name: "Meera Krishnan", grade: "MYP5", risk: "medium" as const, reason: "Family relocation flagged in front-office notes; siblings' enquiry to other schools logged via support ticket." },
  { name: "Arjun Desai", grade: "DP2", risk: "medium" as const, reason: "Considering dropping to Diploma Course route after EE/IA stress; subject-change request submitted." },
];

export default function EnrolmentRiskPage() {
  const { running, complete, run } = useAIScan(2400);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Enrolment Drop-Out Predictor"
        description="Flags students likely to withdraw from the Diploma Programme or the school entirely, using fee, academic, communication and historical withdrawal-pattern signals."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIControlPanel
            icon={LogOut}
            title="Withdrawal Risk Model"
            description="Trained on past withdrawal cases; scores active students against fee delinquency, academic decline and engagement-drop patterns."
            runLabel="Run Dropout Scan"
            runningLabel="Scoring Cohort..."
            completeLabel="Scan Complete"
            completeSubLabel="3 students flagged for outreach"
            running={running}
            complete={complete}
            onRun={run}
            accent="rose"
          />
        </div>
        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {students.map((s, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{s.name} <span className="text-slate-400 font-normal text-sm">· {s.grade}</span></p>
                    <RiskBadge level={s.risk} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                    <MessageSquareWarning size={14} className="inline mr-1 text-rose-500" /> {s.reason}
                  </p>
                  <button className="mt-3 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg">Schedule Parent Outreach</button>
                </div>
              ))}
            </div>
          ) : (
            <AIEmptyState icon={LogOut} title="Awaiting Scan" subtitle="Run the model to flag enrolment risk across the student body." />
          )}
        </div>
      </div>
    </div>
  );
}
