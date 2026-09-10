"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { LayoutGrid } from "lucide-react";

export default function CapacityOptimizerPage() {
  return (
    <AIDemoPage
      title="Class Capacity Optimizer"
      description="Proposes how to split sections and assign rooms so classes are balanced and rooms are not sitting empty."
      icon={LayoutGrid}
      accent="indigo"
      panelTitle="Allocation Model"
      panelDescription="Balances section sizes against room capacity, subject requirements and the existing timetable, and reports what each change would cost."
      runLabel="Optimise Allocation"
      runningLabel="Testing Arrangements..."
      completeLabel="Proposal Ready"
      completeSubLabel="15 classrooms · 3 changes proposed"
      emptyTitle="No Proposal Yet"
      emptySubtitle="Run the optimiser to see how sections and rooms could be rebalanced."
      result={{
        kind: "findings",
        heading: "Proposed changes",
        // Built on the school's real section sizes. The previous first finding
        // split a "DP1 Chemistry" class of 31; the school's DP1 Chemistry group
        // has 8, and its sections hold 11 or 12.
        items: [
          {
            title: "Fold DP1C into DP1A and DP1B",
            meta: "2 students",
            tone: "high",
            badgeLabel: "Recommended",
            body: "DP1C has 2 students against 12 and 11 in the other two DP1 sections. It holds a homeroom and a tutor period for a group that fits in either neighbour, and both would stay at 13 or under.",
          },
          {
            title: "Share DP2 teaching for the six smallest groups",
            meta: "3 students each",
            tone: "medium",
            badgeLabel: "Consider",
            body: "Chemistry HL, Biology HL, English A: Literature HL, French B, Business Management and Mathematics: Applications & Interpretation each run in DP2 with 3 students. Worth checking which can share a block before next year's option blocks are set.",
          },
          {
            title: "Move MYP4 Individuals & Societies to Room 209",
            meta: "Currently Room 204",
            tone: "medium",
            badgeLabel: "Worth doing",
            body: "Room 204 seats 34 for a class of 11 while Room 209 seats 20 and sits empty in that period. Frees the larger room for whole-year MYP4 sessions.",
          },
          {
            title: "Utilisation after these changes",
            meta: "Whole timetable",
            tone: "low",
            badgeLabel: "Result",
            body: "Room utilisation rises from 61% to 70%, and every class sits in a room sized for it.",
          },
        ],
      }}
    />
  );
}
