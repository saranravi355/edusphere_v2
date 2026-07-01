import PageHeader from "@/components/ui/PageHeader";
import AIToolCard from "@/components/ai/AIToolCard";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  AlertTriangle, ScanLine, Scale, UserCheck, UserMinus, LogOut,
  HeartPulse, HeartHandshake, BookCheck, Route, Wallet, LineChart,
  UtensilsCrossed, BrainCircuit, PackageOpen,
} from "lucide-react";

type Audience = "both" | "admin";

const tools: { href: string; icon: React.ReactNode; title: string; description: string; badge?: string; audience: Audience }[] = [
  { href: "/admin/ai-insights/early-warning", icon: <AlertTriangle size={18} />, title: "Early Academic Risk Detection", description: "Flags DP/MYP students drifting off predicted-grade trajectory.", audience: "both" },
  { href: "/admin/ai-insights/attendance-anomaly", icon: <ScanLine size={18} />, title: "Attendance Anomaly Detector", description: "Surfaces unusual attendance patterns beyond simple thresholds.", audience: "both" },
  { href: "/admin/ai-insights/workload-balancer", icon: <Scale size={18} />, title: "Teacher Workload Balancer", description: "Normalizes teaching, IA marking and CAS supervision load.", audience: "both" },
  { href: "/admin/ai-insights/substitute-recommender", icon: <UserCheck size={18} />, title: "Substitute Recommender", description: "Suggests the best-fit cover teacher for an open period.", audience: "both" },
  { href: "/admin/ai-insights/attrition-risk", icon: <UserMinus size={18} />, title: "Staff Attrition Risk", description: "Predicts teachers at risk of leaving using HR and survey signals.", audience: "both" },
  { href: "/admin/ai-insights/enrolment-risk", icon: <LogOut size={18} />, title: "Enrolment Drop-Out Predictor", description: "Flags students likely to withdraw from the DP or the school.", audience: "both" },
  { href: "/admin/ai-insights/school-health-score", icon: <HeartPulse size={18} />, title: "School Health Score", description: "Composite KPI across academics, attendance, staff and finance.", audience: "both" },
  { href: "/admin/ai-insights/parent-engagement", icon: <HeartHandshake size={18} />, title: "Parent Engagement Score", description: "Scores family engagement across portal, events and messaging.", audience: "both" },
  { href: "/admin/ai-insights/curriculum-coverage", icon: <BookCheck size={18} />, title: "Curriculum Coverage Tracker", description: "Checks unit-plan pacing against the IB syllabus guide.", audience: "both" },
  { href: "/admin/students/sentiment-ai", icon: <BrainCircuit size={18} />, title: "Behavioral Sentiment AI", description: "Scans teacher notes to flag early signs of student distress.", badge: "Existing", audience: "both" },
  { href: "/admin/ai-insights/route-optimiser", icon: <Route size={18} />, title: "Transport Route Optimiser", description: "Re-sequences bus stops to cut commute time and fuel cost.", audience: "admin" },
  { href: "/admin/finance/payment-predictor", icon: <Wallet size={18} />, title: "Fee Payment Predictor", description: "Predicts which families are likely to pay the next invoice late.", audience: "admin" },
  { href: "/admin/finance/cashflow-forecast", icon: <LineChart size={18} />, title: "AI Cash Flow Forecast", description: "Projects 6-month cash position against the payroll calendar.", audience: "admin" },
  { href: "/admin/canteen", icon: <UtensilsCrossed size={18} />, title: "Nutrition Demand Forecaster", description: "Predicts daily canteen demand per menu item.", audience: "admin" },
  { href: "/admin/resources/predictive-ai", icon: <PackageOpen size={18} />, title: "Predictive Resource Allocation", description: "Forecasts inventory depletion and drafts purchase orders.", badge: "Existing", audience: "admin" },
];

export default async function AdminAIInsightsHub() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) redirect('/');

  const isPrincipal = session.user.role === 'PRINCIPAL';
  const visibleTools = isPrincipal ? tools.filter(t => t.audience === 'both') : tools;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="AI Insights"
        description={
          isPrincipal
            ? "Predictive and assistive AI tools for academic leadership and student wellbeing."
            : "Every predictive and assistive AI tool available to school leadership, in one place."
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleTools.map((t, i) => <AIToolCard key={i} {...t} />)}
      </div>
    </div>
  );
}
