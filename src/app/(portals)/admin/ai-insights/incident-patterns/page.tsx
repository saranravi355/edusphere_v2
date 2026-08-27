"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { ShieldAlert } from "lucide-react";

export default function IncidentPatternsPage() {
  return (
    <AIDemoPage
      title="Incident Pattern Intelligence"
      description="Looks across behaviour and safeguarding records for patterns that no single incident report would show."
      icon={ShieldAlert}
      accent="rose"
      panelTitle="Pattern Detection"
      panelDescription="Clusters incidents by time, place, year group and staff present, and reports only clusters unlikely to be chance."
      runLabel="Detect Patterns"
      runningLabel="Clustering Incidents..."
      completeLabel="Detection Complete"
      completeSubLabel="4 patterns above threshold"
      emptyTitle="No Patterns Detected"
      emptySubtitle="Run detection to surface recurring patterns across incident records."
      result={{
        kind: "findings",
        heading: "Patterns detected",
        items: [
          {
            title: "Corridor outside the science block",
            meta: "Between 11:20 and 11:35",
            tone: "high",
            badgeLabel: "Place and time",
            body: "Nine incidents in eleven weeks, all in the same fifteen-minute window. Break ends at 11:30 and this corridor is the single route between two blocks.",
          },
          {
            title: "MYP4 — same three students",
            meta: "Six incidents",
            tone: "critical",
            badgeLabel: "Repeat group",
            body: "All six involve at least two of the same three students. Individually each report reads as minor; together the pattern is worth a pastoral conversation.",
          },
          {
            title: "Reporting drop on Fridays",
            meta: "Twelve weeks",
            tone: "medium",
            badgeLabel: "Reporting gap",
            body: "Friday incident reports run 40% below other weekdays with no matching change in attendance. More likely a reporting habit than a genuine calm.",
          },
          {
            title: "Post-examination weeks",
            meta: "Two exam periods",
            tone: "medium",
            badgeLabel: "Seasonal",
            body: "Incidents rise in the week after each exam period across all year groups, then return to baseline.",
          },
        ],
      }}
    />
  );
}
