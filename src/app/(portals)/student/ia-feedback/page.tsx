"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { ClipboardCheck } from "lucide-react";

// The sciences internal assessment as the current guides define it (first
// assessment 2025): four criteria, 6 marks each, 24 in all. The old page used
// the retired criteria — Personal engagement out of 2, Exploration, Analysis,
// Evaluation — and left out Communication, so "4 criteria" matched neither the
// old scheme nor the new one.
export default function IAFeedbackPage() {
  return (
    <AIDemoPage
      title="IA Feedback Assistant"
      description="Reads your internal assessment draft against the IB criteria and returns formative feedback, criterion by criterion."
      icon={ClipboardCheck}
      accent="indigo"
      panelTitle="Rubric Reader"
      panelDescription="Matches your draft against the IB criteria for the scientific investigation, and points at the sentences that earn or lose marks."
      runLabel="Review My Draft"
      runningLabel="Reading Against Criteria..."
      completeLabel="Feedback Ready"
      completeSubLabel="4 criteria · 14 of 24"
      emptyTitle="No Draft Reviewed"
      emptySubtitle="Run the assistant to get criterion-by-criterion feedback on your IA draft."
      result={{
        kind: "findings",
        heading: "Criterion-by-criterion feedback — Physics HL IA draft",
        items: [
          {
            title: "Research design",
            meta: "5 of 6",
            tone: "low",
            badgeLabel: "Meeting",
            body: "Your research question is focused, and the method says how pendulum length was varied and measured. Add why you timed ten oscillations rather than one.",
          },
          {
            title: "Data analysis",
            meta: "4 of 6",
            tone: "medium",
            badgeLabel: "Partly",
            body: "Raw data is complete and uncertainties are propagated. The graph is missing error bars, which the criterion expects where uncertainty is quantified.",
          },
          {
            title: "Conclusion",
            meta: "3 of 6",
            tone: "medium",
            badgeLabel: "Partly",
            body: "The conclusion states the relationship but does not compare your value of g with the accepted value, or say whether the difference falls within your uncertainty.",
            footnote: "Add one sentence comparing your g with 9.81 m s⁻², and whether it sits inside your error range.",
          },
          {
            title: "Evaluation",
            meta: "2 of 6",
            tone: "high",
            badgeLabel: "Needs work",
            body: "Weaknesses are listed but not weighted. The criterion asks which limitation most affected the result, and for a realistic improvement to it.",
          },
        ],
      }}
    />
  );
}
