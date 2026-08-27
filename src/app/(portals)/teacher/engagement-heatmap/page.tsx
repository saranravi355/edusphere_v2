"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { Activity } from "lucide-react";

export default function EngagementHeatmapPage() {
  return (
    <AIDemoPage
      title="Class Engagement Heatmap"
      description="Surfaces students whose participation has dropped, across every class you teach, before it shows up in a grade."
      icon={Activity}
      accent="rose"
      panelTitle="Engagement Signals"
      panelDescription="Combines attendance, submission timing, formative participation and library or resource access into one trend per student."
      runLabel="Scan My Classes"
      runningLabel="Reading Signals..."
      completeLabel="Scan Complete"
      completeSubLabel="4 classes · 5 students flagged"
      emptyTitle="No Scan Run"
      emptySubtitle="Scan your classes to see whose engagement has changed recently."
      result={{
        kind: "findings",
        heading: "Students whose engagement has dropped",
        items: [
          {
            title: "DP1 Chemistry — 3 students",
            meta: "Sharpest change this term",
            tone: "high",
            badgeLabel: "Falling",
            body: "All three moved from submitting early to submitting on the deadline over four weeks, with attendance unchanged. That combination usually precedes a missed submission.",
          },
          {
            title: "MYP5 Sciences — 1 student",
            meta: "Two weeks",
            tone: "medium",
            badgeLabel: "Watch",
            body: "Participation in practical groups has fallen while written work is unchanged. Possibly a group dynamic rather than the subject.",
          },
          {
            title: "DP2 Chemistry — 1 student",
            meta: "Six weeks",
            tone: "critical",
            badgeLabel: "Act now",
            body: "Attendance down to 71%, no formative submitted in three weeks, and no contact logged with the tutor.",
          },
          {
            title: "MYP4 Sciences",
            meta: "No change",
            tone: "low",
            badgeLabel: "Steady",
            body: "Nothing to flag: engagement is flat across the class.",
          },
        ],
      }}
    />
  );
}
