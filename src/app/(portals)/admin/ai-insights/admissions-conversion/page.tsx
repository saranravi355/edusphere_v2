"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { UserPlus } from "lucide-react";

export default function AdmissionsConversionPage() {
  return (
    <AIDemoPage
      title="Admissions Conversion Predictor"
      description="Estimates which applicants are most likely to accept a place, so follow-up effort goes where it changes the outcome."
      icon={UserPlus}
      accent="emerald"
      panelTitle="Conversion Model"
      panelDescription="Weighs enquiry-to-application time, sibling links, distance, visit attendance and how quickly the family responds."
      runLabel="Predict Conversion"
      runningLabel="Scoring Applicants..."
      completeLabel="Scoring Complete"
      completeSubLabel="46 open applications scored"
      emptyTitle="Not Scored Yet"
      emptySubtitle="Score the open applications to see where follow-up would matter most."
      result={{
        kind: "findings",
        heading: "Open applications by likelihood",
        items: [
          {
            title: "14 applications",
            meta: "Grade 6 and Grade 9 intake",
            tone: "low",
            badgeLabel: "Likely to accept",
            body: "Sibling already enrolled, campus visit attended, and replies within a day. This group converts at 85% historically and needs no chasing.",
          },
          {
            title: "19 applications",
            meta: "Mixed year groups",
            tone: "medium",
            badgeLabel: "Undecided",
            body: "Applied but have not visited. The single strongest predictor in this cohort is a completed visit, so an invitation is the highest-value action.",
          },
          {
            title: "9 applications",
            meta: "DP1 entry",
            tone: "high",
            badgeLabel: "At risk",
            body: "Enquiry-to-application took over six weeks and no response to the last two contacts. Historically this pattern converts below 20%.",
          },
          {
            title: "4 applications",
            meta: "Awaiting documents",
            tone: "medium",
            badgeLabel: "Blocked",
            body: "Not a persuasion problem: transcripts are outstanding and the file cannot progress until they arrive.",
          },
        ],
      }}
    />
  );
}
