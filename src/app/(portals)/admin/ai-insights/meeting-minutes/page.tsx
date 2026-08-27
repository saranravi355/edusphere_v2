"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { FileSearch } from "lucide-react";

export default function MeetingMinutesPage() {
  return (
    <AIDemoPage
      title="Meeting Minutes Intelligence"
      description="Searches across staff meeting minutes by meaning rather than keyword, and tracks what was decided and whether it happened."
      icon={FileSearch}
      accent="amber"
      panelTitle="Minutes Search"
      panelDescription="Indexes minutes semantically, so a question about workload finds the discussion even when that word was never used."
      runLabel="Search Minutes"
      runningLabel="Indexing Minutes..."
      completeLabel="Search Complete"
      completeSubLabel="46 meetings · 3 threads found"
      emptyTitle="Nothing Searched"
      emptySubtitle="Search the minutes to trace a decision and what followed it."
      result={{
        kind: "findings",
        heading: "Threads across 46 meetings",
        items: [
          {
            title: "Assessment calendar congestion",
            meta: "Raised in 7 meetings",
            tone: "high",
            badgeLabel: "Unresolved",
            body: "Raised each term since last September under four different descriptions. An action was minuted twice, and neither has a completion recorded.",
          },
          {
            title: "Timetable change for DP2 study periods",
            meta: "Decided 14 weeks ago",
            tone: "low",
            badgeLabel: "Done",
            body: "Decision minuted, owner named, and implementation confirmed in the following meeting.",
          },
          {
            title: "Marking workload",
            meta: "Raised in 5 meetings",
            tone: "medium",
            badgeLabel: "Open",
            body: "Discussed under 'turnaround times', 'feedback expectations' and 'staff wellbeing' — a keyword search for workload would find none of them.",
          },
          {
            title: "Actions without a recorded outcome",
            meta: "Across the year",
            tone: "medium",
            badgeLabel: "Follow up",
            body: "11 minuted actions have an owner and a date but no completion note. Listed so they can be closed or carried forward deliberately.",
          },
        ],
      }}
    />
  );
}
