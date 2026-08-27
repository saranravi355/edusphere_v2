"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { Layers } from "lucide-react";

export default function DifferentiationPage() {
  return (
    <AIDemoPage
      title="Differentiation Assistant"
      description="Suggests how to adapt one lesson for the range of attainment actually sitting in the room."
      icon={Layers}
      accent="sky"
      panelTitle="Grouping Model"
      panelDescription="Groups the class by their most recent assessed performance on this topic and proposes a variant of the task for each group."
      runLabel="Suggest Adaptations"
      runningLabel="Grouping The Class..."
      completeLabel="Suggestions Ready"
      completeSubLabel="3 groups from 28 students"
      emptyTitle="No Suggestions Yet"
      emptySubtitle="Generate adapted versions of a task for the range in your class."
      result={{
        kind: "findings",
        heading: "Suggested adaptations",
        items: [
          {
            title: "Group A — 7 students",
            meta: "Secure on the prerequisite",
            tone: "low",
            badgeLabel: "Extend",
            body: "Give the unknowns without the results table, so they design the recording method themselves. Adds criterion B without extra preparation.",
          },
          {
            title: "Group B — 15 students",
            meta: "At the expected level",
            tone: "low",
            badgeLabel: "Core task",
            body: "Run the task as planned. The prepared table gives enough scaffold without doing the thinking for them.",
          },
          {
            title: "Group C — 6 students",
            meta: "Prerequisite not yet secure",
            tone: "medium",
            badgeLabel: "Scaffold",
            body: "Two of the four metals pre-identified, and a worked example of one comparison. The goal is the pattern, not the procedure.",
          },
          {
            title: "Shared plenary",
            meta: "Whole class",
            tone: "low",
            badgeLabel: "Together",
            body: "All three groups can answer the exit ticket, so the class ends on common ground rather than visibly split.",
          },
        ],
      }}
    />
  );
}
