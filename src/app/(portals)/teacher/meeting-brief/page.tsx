"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { ClipboardList } from "lucide-react";

export default function MeetingBriefPage() {
  return (
    <AIDemoPage
      title="Parent Meeting Brief"
      description="Pulls the record together into a one-page brief before a parent meeting, so you are not opening six screens."
      icon={ClipboardList}
      accent="emerald"
      panelTitle="Brief Builder"
      panelDescription="Collects grades, attendance, behaviour notes and recent teacher comments for one student, and summarises what changed since the last meeting."
      runLabel="Build Brief"
      runningLabel="Collecting Records..."
      completeLabel="Brief Ready"
      completeSubLabel="Covering the period since the last meeting"
      emptyTitle="No Brief Built"
      emptySubtitle="Build a one-page brief before your next parent meeting."
      result={{
        kind: "document",
        heading: "Meeting brief — DP1 student, 15-minute slot",
        sections: [
          {
            heading: "Since the last meeting (14 weeks ago)",
            lines: [
              "Predicted grade in Chemistry moved from 4 to 5; Mathematics steady at 6.",
              "Attendance 94%, up from 88%.",
              "Two merits recorded, no demerits.",
            ],
          },
          {
            heading: "What is going well",
            lines: [
              "Practical work is consistently strong — three criterion B scores at level 7-8.",
              "Has started submitting drafts ahead of the deadline rather than on it.",
            ],
          },
          {
            heading: "What to raise",
            lines: [
              "Written evaluation remains the weakest criterion across subjects.",
              "IA topic is not yet confirmed and the deadline is in five weeks.",
            ],
          },
          {
            heading: "Suggested actions to agree",
            lines: [
              "Confirm the IA topic by the end of next week.",
              "One weekly evaluation-writing exercise, reviewed in the following lesson.",
            ],
          },
        ],
      }}
    />
  );
}
