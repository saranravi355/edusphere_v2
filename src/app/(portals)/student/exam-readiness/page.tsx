"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { GaugeCircle } from "lucide-react";

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
        heading: "Readiness by subject",
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
            title: "Chemistry SL",
            meta: "Paper 2 in 15 days",
            tone: "medium",
            badgeLabel: "74% ready",
            body: "Organic chemistry is secure. Energetics questions are being left unfinished, which usually means timing rather than understanding.",
          },
          {
            title: "English A: Literature HL",
            meta: "Paper 1 in 19 days",
            tone: "low",
            badgeLabel: "88% ready",
            body: "Unseen commentary practice is consistent and recent. Both practice responses this term hit criterion B.",
          },
          {
            title: "Individuals & Societies",
            meta: "Paper 1 in 21 days",
            tone: "low",
            badgeLabel: "85% ready",
            body: "Source analysis is on track. No gaps detected across the three assessed units.",
          },
        ],
      }}
    />
  );
}
