"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { BookOpenCheck } from "lucide-react";

export default function LessonCopilotPage() {
  return (
    <AIDemoPage
      title="Lesson Plan Co-Pilot"
      description="Drafts an IB-aligned lesson plan from the unit guide, with inquiry questions, activities and the ATL skills each one develops."
      icon={BookOpenCheck}
      accent="indigo"
      panelTitle="Plan Drafter"
      panelDescription="Reads the subject guide and your unit outline, then drafts a lesson with a stated inquiry, timings and assessment opportunities."
      runLabel="Draft Lesson Plan"
      runningLabel="Reading Unit Guide..."
      completeLabel="Draft Ready"
      completeSubLabel="60-minute lesson · 3 activities"
      emptyTitle="No Plan Drafted"
      emptySubtitle="Draft a lesson plan from the unit guide to review and adapt."
      result={{
        kind: "document",
        heading: "Lesson plan — MYP4 Sciences, Unit 3",
        sections: [
          {
            heading: "Statement of inquiry",
            lines: [
              "Patterns in the behaviour of matter allow us to predict how substances will interact.",
              "Key concept: Relationships. Related concepts: Patterns, Evidence.",
            ],
          },
          {
            heading: "Sequence (60 minutes)",
            lines: [
              "0-10 Retrieval starter: six questions on last week's reactivity series, answered on whiteboards.",
              "10-30 Guided practical: displacement reactions, students record observations against a prepared table.",
              "30-50 Group analysis: order four unknown metals by reactivity from the evidence collected.",
              "50-60 Exit ticket: predict one reaction not tested, and justify the prediction.",
            ],
          },
          {
            heading: "ATL skills developed",
            lines: [
              "Thinking — transfer: applying a known pattern to an untested case.",
              "Communication: recording observations precisely enough for another group to use.",
            ],
          },
          {
            heading: "Assessment opportunities",
            lines: [
              "Criterion B (inquiring and designing) through the group ordering task.",
              "Exit ticket gives a quick read on criterion C before the summative.",
            ],
          },
        ],
      }}
    />
  );
}
