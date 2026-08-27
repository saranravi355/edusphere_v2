"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { Users } from "lucide-react";

export default function HiringMatchPage() {
  return (
    <AIDemoPage
      title="Teacher Hiring Match"
      description="Ranks applicants against what the role actually needs, including IB experience, and says why each one ranked where it did."
      icon={Users}
      accent="sky"
      panelTitle="Candidate Ranking"
      panelDescription="Reads applications against the role description: subject and level taught, IB experience, examiner status and safeguarding record."
      runLabel="Rank Candidates"
      runningLabel="Reading Applications..."
      completeLabel="Ranking Complete"
      completeSubLabel="23 applicants for DP Chemistry"
      emptyTitle="Nothing Ranked"
      emptySubtitle="Rank the applicants for an open role against its requirements."
      result={{
        kind: "findings",
        heading: "DP Chemistry teacher — ranked applicants",
        items: [
          {
            title: "Candidate 07",
            meta: "9 years, 6 in IB",
            tone: "low",
            badgeLabel: "Strong match",
            body: "Has taught Chemistry HL through two full DP cycles and is a current IA moderator. Meets every stated requirement.",
          },
          {
            title: "Candidate 15",
            meta: "12 years, 2 in IB",
            tone: "low",
            badgeLabel: "Strong match",
            body: "Deep subject experience but only one DP cycle completed. Would likely need support on internal assessment standardisation.",
          },
          {
            title: "Candidate 02",
            meta: "5 years, no IB",
            tone: "medium",
            badgeLabel: "Possible",
            body: "Strong national-curriculum record and a Chemistry master's. No IB experience, which the role lists as essential rather than desirable.",
          },
          {
            title: "6 applicants",
            meta: "Screened out",
            tone: "high",
            badgeLabel: "Below bar",
            body: "Do not hold a qualification in the subject, which is a hard requirement. Listed so the decision is visible rather than silent.",
          },
        ],
      }}
    />
  );
}
