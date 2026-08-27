"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { Award } from "lucide-react";

export default function ScholarshipsPage() {
  return (
    <AIDemoPage
      title="Scholarship Matcher"
      description="Matches your predicted grades, service record and interests against scholarships you would actually be eligible for."
      icon={Award}
      accent="emerald"
      panelTitle="Eligibility Matcher"
      panelDescription="Screens open scholarships against predicted grades, CAS hours, subject combination and citizenship, and drops the ones you cannot apply for."
      runLabel="Find Scholarships"
      runningLabel="Screening Eligibility..."
      completeLabel="Matching Complete"
      completeSubLabel="4 eligible · 2 closing within a month"
      emptyTitle="No Matches Yet"
      emptySubtitle="Run the matcher to see scholarships you are eligible for right now."
      result={{
        kind: "findings",
        heading: "Scholarships you are eligible for",
        items: [
          {
            title: "Commonwealth Shared Scholarship",
            meta: "Closes in 24 days",
            tone: "low",
            badgeLabel: "Strong match",
            body: "Predicted 38 points clears the 36-point threshold. Your 90 CAS hours in community service map directly onto the selection criteria.",
          },
          {
            title: "Reliance Foundation Undergraduate Scholarship",
            meta: "Closes in 41 days",
            tone: "low",
            badgeLabel: "Strong match",
            body: "Open to Indian nationals with strong STEM predictions. Your Mathematics HL and Chemistry SL combination fits the stated profile.",
          },
          {
            title: "United World Colleges Bursary",
            meta: "Closes in 12 days",
            tone: "medium",
            badgeLabel: "Possible",
            body: "Financial-need assessment required, and the deadline is close. The academic bar is comfortably met.",
          },
          {
            title: "Local Rotary Merit Award",
            meta: "Closes in 60 days",
            tone: "medium",
            badgeLabel: "Possible",
            body: "Needs two references from outside school; you have one on file.",
          },
        ],
      }}
    />
  );
}
