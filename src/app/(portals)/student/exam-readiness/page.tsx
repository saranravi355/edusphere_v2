"use client";

import AIDemoPage, { type AIDemoPageProps } from "@/components/ai/AIDemoPage";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { GaugeCircle } from "lucide-react";

type Content = Omit<AIDemoPageProps, "icon">;

const SHARED = {
  title: "Exam Readiness Index",
  description: "Predicts how prepared you are for each upcoming exam from submitted work, attendance and how recently you revised each topic.",
  accent: "sky",
  panelTitle: "Readiness Model",
  panelDescription: "Weighs assignment completion, formative scores, attendance in each subject and the gap since you last revised each unit.",
  runLabel: "Calculate Readiness",
  runningLabel: "Reading Your Record...",
  completeLabel: "Readiness Calculated",
  completeSubLabel: "4 subjects scored · 1 needs attention",
  emptyTitle: "Not Calculated Yet",
  emptySubtitle: "Run the model to see how ready you are for each exam, subject by subject.",
} as const;

// One DP student, taking the subjects most DP students here take.
const DP: Content = {
  ...SHARED,
  result: {
    kind: "findings",
    heading: "Readiness by subject — November mock",
    items: [
      { title: "Mathematics: Analysis & Approaches HL", meta: "Paper 1 in 12 days", tone: "high", badgeLabel: "62% ready", body: "Calculus practice is strong, but you have not revised Vectors since Unit 4 and scored below your average on the last two formatives covering it.", footnote: "Suggested: two 40-minute Vectors sessions before the mock." },
      { title: "Physics HL", meta: "Paper 2 in 15 days", tone: "medium", badgeLabel: "74% ready", body: "Mechanics is secure. Questions on gravitational fields are being left unfinished, which usually means timing rather than understanding." },
      { title: "English A: Language & Literature SL", meta: "Paper 1 in 19 days", tone: "low", badgeLabel: "88% ready", body: "Guided textual analysis practice is consistent and recent. Both practice responses this term reached the top band for criterion B." },
      { title: "Economics HL", meta: "Paper 2 in 21 days", tone: "low", badgeLabel: "85% ready", body: "Data-response practice is on track and your diagrams are accurate. The 15-mark evaluation part is where the remaining marks are." },
    ],
  },
};

// An MYP5 student: criterion-marked unit assessments now, and the on-screen
// examinations of the May eAssessment session the school is registered for.
const MYP: Content = {
  ...SHARED,
  result: {
    kind: "findings",
    heading: "Readiness — unit assessments and the May eAssessment",
    items: [
      { title: "Sciences", meta: "On-screen exam practice · May 2027", tone: "high", badgeLabel: "58% ready", body: "Criterion A recall is secure, but most lost marks are in criterion C — processing data and evaluating the method. Two of your last three practicals had no evaluation.", footnote: "Suggested: one past on-screen task on data processing each week." },
      { title: "Language & Literature", meta: "On-screen exam practice · May 2027", tone: "medium", badgeLabel: "71% ready", body: "Your analysis is strong (criterion B). Criterion D, using language, is losing marks to long sentences written under time pressure." },
      { title: "Individuals & Societies", meta: "Criterion D essay in 12 days", tone: "low", badgeLabel: "80% ready", body: "Research notes and sources are ready. The essay plan needs a clearer counter-argument." },
      { title: "Mathematics", meta: "Criterion A unit test in 3 days", tone: "low", badgeLabel: "86% ready", body: "Linear and simultaneous equations are secure. Probability is your weakest recent topic, though still above your average." },
    ],
  },
};

export default function ExamReadinessPage() {
  const content = useProgramme() === "MYP" ? MYP : DP;
  return <AIDemoPage icon={GaugeCircle} {...content} />;
}
