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
        items: [
          {
            title: "Split DP1 Chemistry into two sections",
            meta: "31 students",
            tone: "high",
            badgeLabel: "Recommended",
            body: "One section of 31 exceeds the practical-room capacity of 24, so a third of the class currently cannot do a full practical at once. Two sections of 15 and 16 both fit.",
          },
          {
            title: "Move MYP4 Individuals & Societies to Room 12",
            meta: "Currently Room 4",
            tone: "medium",
            badgeLabel: "Worth doing",
            body: "Room 4 seats 34 for a class of 18 while Room 12 seats 20 and sits empty in that period. Frees the larger room for the split above.",
          },
          {
            title: "Merge two MYP5 Arts sections",
            meta: "9 and 11 students",
            tone: "medium",
            badgeLabel: "Consider",
            body: "Combined, they fit one room and release a teaching period. Worth checking against option-block clashes before acting.",
          },
          {
            title: "Utilisation after these changes",
            meta: "Whole timetable",
            tone: "low",
            badgeLabel: "Result",
            body: "Room utilisation rises from 61% to 74% and no class exceeds its room's capacity.",
          },
        ],
      }}
    />
  );
}
