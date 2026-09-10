"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { GaugeCircle } from "lucide-react";

// One DP student, taking the subjects most DP students here take. The old list
// gave them Chemistry SL (Chemistry is HL-only at this school) and an MYP
// Individuals & Societies "Paper 1" — a Diploma student does not sit MYP exams.
export default function ExamReadinessPage() {
  return (
    <AIDemoPage
      title="Exam Readiness Index"
      description="Predicts how prepared you are for each upcoming exam from submitted work, attendance and how recently you revised each topic."
      icon={GaugeCircle}
      accent="sky"
      panelTitle="Readiness Model"
      panelDescription="Weighs assignment completion, formative scores, attendance in each subject and the gap since you last revised each unit."
      runLabel="Calculate Readiness"
      runningLabel="Reading Your Record..."
      completeLabel="Readiness Calculated"
      completeSubLabel="4 subjects scored · 1 needs attention"
      emptyTitle="Not Calculated Yet"
      emptySubtitle="Run the model to see how ready you are for each exam, subject by subject."
      result={{
        kind: "findings",
        heading: "Readiness by subject — November mock",
        items: [
          {
            title: "Mathematics: Analysis & Approaches HL",
            meta: "Paper 1 in 12 days",
            tone: "high",
            badgeLabel: "62% ready",
            body: "Calculus practice is strong, but you have not revised Vectors since Unit 4 and scored below your average on the last two formatives covering it.",
            footnote: "Suggested: two 40-minute Vectors sessions before the mock.",
          },
          {
            title: "Physics HL",
            meta: "Paper 2 in 15 days",
            tone: "medium",
            badgeLabel: "74% ready",
            body: "Mechanics is secure. Questions on gravitational fields are being left unfinished, which usually means timing rather than understanding.",
          },
          {
            title: "English A: Language & Literature SL",
            meta: "Paper 1 in 19 days",
            tone: "low",
            badgeLabel: "88% ready",
            body: "Guided textual analysis practice is consistent and recent. Both practice responses this term reached the top band for criterion B.",
          },
          {
            title: "Economics HL",
            meta: "Paper 2 in 21 days",
            tone: "low",
            badgeLabel: "85% ready",
            body: "Data-response practice is on track and your diagrams are accurate. The 15-mark evaluation part is where the remaining marks are.",
          },
        ],
      }}
    />
  );
}
