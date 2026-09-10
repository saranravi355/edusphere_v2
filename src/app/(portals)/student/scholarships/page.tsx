"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { Award } from "lucide-react";

// Awards a school-leaver can actually hold. The old list led with the
// Commonwealth Shared Scholarship (a master's award) and a UWC bursary (for a
// place at a UWC school, not university), and credited "90 CAS hours" — CAS is
// not measured in hours, as the IB Policy Assistant preview itself says.
export default function ScholarshipsPage() {
  return (
    <AIDemoPage
      title="Scholarship Matcher"
      description="Matches your predicted grades, service record and interests against scholarships you would actually be eligible for."
      icon={Award}
      accent="emerald"
      panelTitle="Eligibility Matcher"
      panelDescription="Screens open scholarships against predicted grades, service record, subject combination and citizenship, and drops the ones you cannot apply for."
      runLabel="Find Scholarships"
      runningLabel="Screening Eligibility..."
      completeLabel="Matching Complete"
      completeSubLabel="4 eligible · 1 closing within a month"
      emptyTitle="No Matches Yet"
      emptySubtitle="Run the matcher to see scholarships you are eligible for right now."
      result={{
        kind: "findings",
        heading: "Scholarships you are eligible for",
        items: [
          {
            title: "Lester B. Pearson International Scholarship — University of Toronto",
            meta: "Needs school nomination · closes in 26 days",
            tone: "low",
            badgeLabel: "Strong match",
            body: "For international students in their final year of school who show leadership and service. The school nominates candidates, and your predicted 38 and 18-month service project fit the profile.",
          },
          {
            title: "Reliance Foundation Undergraduate Scholarship",
            meta: "Closes in 41 days",
            tone: "low",
            badgeLabel: "Strong match",
            body: "Merit-cum-means support for first-year undergraduates at Indian universities. Applies if you accept an Indian offer such as Ashoka.",
          },
          {
            title: "Tata Scholarship for Cornell University",
            meta: "Follows an offer",
            tone: "medium",
            badgeLabel: "Possible",
            body: "Need-based aid for Indian citizens admitted to Cornell. It is awarded after admission, so it only matters if Cornell is on your list.",
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
