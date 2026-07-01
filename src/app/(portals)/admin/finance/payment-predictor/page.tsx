"use client";

import PageHeader from "@/components/ui/PageHeader";
import AIControlPanel from "@/components/ai/AIControlPanel";
import AIEmptyState from "@/components/ai/AIEmptyState";
import RiskBadge from "@/components/ai/RiskBadge";
import { useAIScan } from "@/lib/useAIScan";
import { Wallet, CalendarClock } from "lucide-react";

const invoices = [
  { family: "Choudhary Family", child: "Vikram Choudhary · DP1", amount: "₹2,85,000", due: "Jul 10", risk: "high" as const, reason: "Last 2 cycles paid 18+ days late; auto-pay mandate failed twice" },
  { family: "Fernandes Family", child: "Ethan Fernandes · MYP4", amount: "₹1,95,000", due: "Jul 10", risk: "medium" as const, reason: "Requested installment split last term" },
  { family: "Nair Family", child: "Priya Nair · DP2", amount: "₹2,85,000", due: "Jul 10", risk: "low" as const, reason: "100% on-time payment history over 6 terms" },
];

export default function PaymentPredictorPage() {
  const { running, complete, run } = useAIScan(2400);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Fee Payment Predictor"
        description="Predicts which families are likely to pay late or default on the upcoming term fee invoice, based on historical payment behaviour."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIControlPanel
            icon={Wallet}
            title="Payment Risk Model"
            description="Scores every open invoice for the upcoming due date against each family's payment history and communication responsiveness."
            runLabel="Run Payment Forecast"
            runningLabel="Scoring Invoices..."
            completeLabel="Forecast Ready"
            completeSubLabel="1 invoice flagged High Risk of late payment"
            running={running}
            complete={complete}
            onRun={run}
            accent="amber"
          />
        </div>
        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {invoices.map((inv, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{inv.family}</p>
                      <p className="text-xs text-slate-500">{inv.child}</p>
                    </div>
                    <RiskBadge level={inv.risk} label={inv.risk === "high" ? "Likely Late" : inv.risk === "medium" ? "Watch" : "On Track"} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{inv.reason}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{inv.amount}</span>
                    <span className="flex items-center gap-1"><CalendarClock size={12} /> Due {inv.due}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AIEmptyState icon={Wallet} title="No Forecast Yet" subtitle="Run the model to predict which families may pay late this cycle." />
          )}
        </div>
      </div>
    </div>
  );
}
