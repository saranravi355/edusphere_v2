"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { ClipboardCheck } from "lucide-react";

export default function IAFeedbackPage() {
  return (
    <AIDemoPage
      title="IA Feedback Assistant"
      description="Reads your internal assessment draft against the IB criteria and returns formative feedback, criterion by criterion."
      icon={ClipboardCheck}
      accent="indigo"
      panelTitle="Rubric Reader"
      panelDescription="Matches your draft against the published IB criteria for the subject, and points at the sentences that earn or lose marks."
      runLabel="Review My Draft"
      runningLabel="Reading Against Criteria..."
      completeLabel="Feedback Ready"
      completeSubLabel="4 criteria assessed"
      emptyTitle="No Draft Reviewed"
      emptySubtitle="Run the assistant to get criterion-by-criterion feedback on your IA draft."
      result={{
        kind: "findings",
        heading: "Criterion-by-criterion feedback",
        items: [
          {
            title: "Criterion A — Personal engagement",
            meta: "2 of 2",
            tone: "low",
            badgeLabel: "Meeting",
            body: "Your opening paragraph gives a specific personal reason for the research question, which is what this criterion is looking for.",
          },
          {
            title: "Criterion B — Exploration",
            meta: "4 of 6",
            tone: "medium",
            badgeLabel: "Partly",
            body: "Background theory is sound, but two of the controlled variables are named without saying how they were controlled.",
            footnote: "Add one sentence per variable describing the method of control.",
          },
          {
            title: "Criterion C — Analysis",
            meta: "4 of 6",
            tone: "medium",
            badgeLabel: "Partly",
            body: "Raw data is complete and uncertainties are propagated. The graph is missing error bars, which the criterion expects where uncertainty is quantified.",
          },
          {
            title: "Criterion D — Evaluation",
            meta: "2 of 6",
            tone: "high",
            badgeLabel: "Needs work",
            body: "Weaknesses are listed but not weighted. The criterion asks which limitation most affected the result, and no improvement is proposed for it.",
          },
        ],
      }}
    />
  );
}
