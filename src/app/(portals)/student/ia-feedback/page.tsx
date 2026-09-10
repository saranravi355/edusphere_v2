"use client";

import AIDemoPage, { type AIDemoPageProps } from "@/components/ai/AIDemoPage";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { ClipboardCheck } from "lucide-react";

type Content = Omit<AIDemoPageProps, "icon">;

// DP: the sciences internal assessment (first assessment 2025) — four criteria,
// 6 marks each, 24 in all.
const DP: Content = {
  title: "IA Feedback Assistant",
  description: "Reads your internal assessment draft against the IB criteria and returns formative feedback, criterion by criterion.",
  accent: "indigo",
  panelTitle: "Rubric Reader",
  panelDescription: "Matches your draft against the IB criteria for the scientific investigation, and points at the sentences that earn or lose marks.",
  runLabel: "Review My Draft",
  runningLabel: "Reading Against Criteria...",
  completeLabel: "Feedback Ready",
  completeSubLabel: "4 criteria · 14 of 24",
  emptyTitle: "No Draft Reviewed",
  emptySubtitle: "Run the assistant to get criterion-by-criterion feedback on your IA draft.",
  result: {
    kind: "findings",
    heading: "Criterion-by-criterion feedback — Physics HL IA draft",
    items: [
      { title: "Research design", meta: "5 of 6", tone: "low", badgeLabel: "Meeting", body: "Your research question is focused, and the method says how pendulum length was varied and measured. Add why you timed ten oscillations rather than one." },
      { title: "Data analysis", meta: "4 of 6", tone: "medium", badgeLabel: "Partly", body: "Raw data is complete and uncertainties are propagated. The graph is missing error bars, which the criterion expects where uncertainty is quantified." },
      { title: "Conclusion", meta: "3 of 6", tone: "medium", badgeLabel: "Partly", body: "The conclusion states the relationship but does not compare your value of g with the accepted value, or say whether the difference falls within your uncertainty.", footnote: "Add one sentence comparing your g with 9.81 m s⁻², and whether it sits inside your error range." },
      { title: "Evaluation", meta: "2 of 6", tone: "high", badgeLabel: "Needs work", body: "Weaknesses are listed but not weighted. The criterion asks which limitation most affected the result, and for a realistic improvement to it." },
    ],
  },
};

// MYP: there is no internal assessment. The nearest thing an MYP5 student
// submits is the Personal Project report, marked on three criteria — Planning,
// Applying skills and Reflecting — each out of 8.
const MYP: Content = {
  title: "Personal Project Feedback",
  description: "Reads your Personal Project report against the MYP project criteria and returns formative feedback, criterion by criterion.",
  accent: "indigo",
  panelTitle: "Rubric Reader",
  panelDescription: "Matches your report draft against the Personal Project criteria — planning, applying skills and reflecting — and points at the sentences that earn or lose marks.",
  runLabel: "Review My Report",
  runningLabel: "Reading Against Criteria...",
  completeLabel: "Feedback Ready",
  completeSubLabel: "3 criteria · 16 of 24",
  emptyTitle: "No Report Reviewed",
  emptySubtitle: "Run the assistant to get criterion-by-criterion feedback on your Personal Project report.",
  result: {
    kind: "findings",
    heading: "Criterion-by-criterion feedback — Personal Project report draft",
    items: [
      { title: "Criterion A — Planning", meta: "6 of 8", tone: "low", badgeLabel: "Meeting", body: "Your learning goal and product goal are clear, and the success criteria for the product are specific enough to test. Show how your plan changed after the week-4 setback." },
      { title: "Criterion B — Applying skills", meta: "6 of 8", tone: "medium", badgeLabel: "Partly", body: "Research and self-management skills are well evidenced from your process journal. Name the ATL skill each extract shows, rather than leaving the reader to infer it." },
      { title: "Criterion C — Reflecting", meta: "4 of 8", tone: "high", badgeLabel: "Needs work", body: "The report describes what you did but not what you learned. The criterion asks how the project extended your knowledge and your development as a learner.", footnote: "Add a paragraph on one thing you would now do differently, and why." },
    ],
  },
};

export default function IAFeedbackPage() {
  const content = useProgramme() === "MYP" ? MYP : DP;
  return <AIDemoPage icon={ClipboardCheck} {...content} />;
}
