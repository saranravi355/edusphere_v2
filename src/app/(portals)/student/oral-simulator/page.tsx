"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { Mic } from "lucide-react";

export default function OralSimulatorPage() {
  return (
    <AIDemoPage
      title="Oral Exam Simulator"
      description="Runs a mock individual oral, asks follow-up questions the way an examiner would, and scores the response against the criteria."
      icon={Mic}
      accent="amber"
      panelTitle="Mock Examiner"
      panelDescription="Puts the stimulus in front of you, times the response, and asks the follow-ups an examiner would ask on what you actually said."
      runLabel="Start Mock Oral"
      runningLabel="Preparing Stimulus..."
      completeLabel="Mock Complete"
      completeSubLabel="10 minutes · scored against 4 criteria"
      emptyTitle="No Session Yet"
      emptySubtitle="Start a mock oral to practise under timed conditions and get scored feedback."
      result={{
        kind: "findings",
        heading: "Session feedback",
        items: [
          {
            title: "Criterion A — Knowledge and understanding",
            meta: "8 of 10",
            tone: "low",
            badgeLabel: "Strong",
            body: "You linked the extract to the wider work confidently and used two well-chosen references.",
          },
          {
            title: "Criterion B — Analysis and evaluation",
            meta: "6 of 10",
            tone: "medium",
            badgeLabel: "Developing",
            body: "Techniques were identified but their effect on the reader was asserted rather than argued. The examiner followed up twice on this.",
          },
          {
            title: "Criterion C — Focus and organisation",
            meta: "7 of 10",
            tone: "medium",
            badgeLabel: "Developing",
            body: "Clear structure for the first six minutes; the final section returned to a point already made.",
          },
          {
            title: "Criterion D — Language",
            meta: "8 of 10",
            tone: "low",
            badgeLabel: "Strong",
            body: "Register was appropriate throughout. Two filler-heavy stretches at 3:10 and 7:45.",
          },
        ],
      }}
    />
  );
}
