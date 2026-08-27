"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { BarChart3 } from "lucide-react";

export default function AssessmentDifficultyPage() {
  return (
    <AIDemoPage
      title="Assessment Difficulty Analyzer"
      description="Estimates how hard an assessment turned out to be, question by question, and shows where the grade distribution came from."
      icon={BarChart3}
      accent="amber"
      panelTitle="Item Analysis"
      panelDescription="Compares the mark earned on each question against the cohort, and flags items that behaved differently from the rest of the paper."
      runLabel="Analyse Assessment"
      runningLabel="Comparing Item Scores..."
      completeLabel="Analysis Complete"
      completeSubLabel="12 questions · 2 flagged"
      emptyTitle="Nothing Analysed"
      emptySubtitle="Analyse an assessment to see which questions carried the grade distribution."
      result={{
        kind: "findings",
        heading: "Item analysis",
        items: [
          {
            title: "Question 7 — Energetics calculation",
            meta: "Mean 1.8 of 6",
            tone: "high",
            badgeLabel: "Too hard",
            body: "Only 4 of 28 students scored above half marks, including students who scored well everywhere else. That pattern usually means the question, not the cohort.",
          },
          {
            title: "Question 3 — Define enthalpy",
            meta: "Mean 1.9 of 2",
            tone: "medium",
            badgeLabel: "Too easy",
            body: "Almost everyone scored full marks, so this item did not separate the class at all.",
          },
          {
            title: "Questions 1, 2, 4-6, 8-12",
            meta: "Mean 62%",
            tone: "low",
            badgeLabel: "Behaving",
            body: "Score spread on these items tracks overall performance closely, which is what you want from an assessment.",
          },
          {
            title: "Grade distribution",
            meta: "28 students",
            tone: "low",
            badgeLabel: "Summary",
            body: "Median 5, range 2-7. Removing question 7 would move the median to 6 — worth knowing before comparing this cohort with last year's.",
          },
        ],
      }}
    />
  );
}
