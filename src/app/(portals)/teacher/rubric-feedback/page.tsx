"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { ListChecks } from "lucide-react";

export default function RubricFeedbackPage() {
  return (
    <AIDemoPage
      title="Rubric Auto-Feedback"
      description="Drafts criterion-wise feedback for a set of submissions, grounded in the IB descriptors rather than general comment."
      icon={ListChecks}
      accent="indigo"
      panelTitle="Descriptor Matcher"
      panelDescription="Matches each submission against the published criterion descriptors and drafts comments that quote the level actually achieved."
      runLabel="Draft Feedback"
      runningLabel="Reading Submissions..."
      completeLabel="Feedback Drafted"
      completeSubLabel="28 submissions · ready to review"
      emptyTitle="No Feedback Drafted"
      emptySubtitle="Draft criterion-wise feedback for the class, then edit before releasing."
      result={{
        kind: "findings",
        heading: "Drafted feedback — sample of the class",
        items: [
          {
            title: "Submission 14",
            meta: "Criterion B: 5 of 8",
            tone: "medium",
            badgeLabel: "Level 5-6",
            body: "Method is reproducible and variables are identified. To reach 7-8 the write-up needs to justify why each control was chosen, not only that it was applied.",
          },
          {
            title: "Submission 22",
            meta: "Criterion C: 7 of 8",
            tone: "low",
            badgeLabel: "Level 7-8",
            body: "Processing is complete and uncertainty is carried through correctly. The interpretation goes beyond the data and is well argued.",
          },
          {
            title: "Submission 03",
            meta: "Criterion B: 2 of 8",
            tone: "high",
            badgeLabel: "Level 1-2",
            body: "A method is present but the research question is not stated, which caps this criterion. Worth a conversation before the next submission.",
          },
          {
            title: "Class pattern",
            meta: "28 submissions",
            tone: "medium",
            badgeLabel: "Whole class",
            body: "Criterion D is the weakest across the set: 19 of 28 list limitations without weighting them. Consider a modelled example before the next assessment.",
          },
        ],
      }}
    />
  );
}
