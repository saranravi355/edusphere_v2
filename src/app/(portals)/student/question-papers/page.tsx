"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { FileQuestion } from "lucide-react";

export default function QuestionPaperPage() {
  return (
    <AIDemoPage
      title="Question Paper Generator"
      description="Produces IB-style practice papers from the syllabus, with a mark scheme, so you can sit one under timed conditions."
      icon={FileQuestion}
      accent="indigo"
      panelTitle="Paper Builder"
      panelDescription="Selects questions matching the command terms, mark weightings and topic spread of a real paper for your subject and level."
      runLabel="Generate Practice Paper"
      runningLabel="Assembling Questions..."
      completeLabel="Paper Generated"
      completeSubLabel="Section A and B · 45 marks · 1 hour"
      emptyTitle="No Paper Generated"
      emptySubtitle="Run the builder to assemble a timed practice paper from your syllabus."
      result={{
        kind: "document",
        heading: "Practice Paper — Chemistry SL, Paper 2",
        sections: [
          {
            heading: "Section A — Data response (18 marks)",
            lines: [
              "1 (a) State the trend in first ionisation energy across period 3. [1]",
              "1 (b) Explain the trend you stated in part (a). [3]",
              "1 (c) Deduce why the value for aluminium departs from the trend. [2]",
              "2 (a) Calculate the enthalpy change for the reaction using the bond enthalpies provided. [4]",
            ],
          },
          {
            heading: "Section B — Extended response (27 marks)",
            lines: [
              "3 (a) Outline the difference between a strong and a weak acid in terms of dissociation. [2]",
              "3 (b) Determine the pH of a 0.10 mol dm-3 solution of ethanoic acid, Ka = 1.8 x 10-5. [4]",
              "3 (c) Discuss how the pH would change on dilution, and justify your answer. [5]",
            ],
          },
          {
            heading: "Mark scheme notes",
            lines: [
              "Command term 'explain' expects a reason, not a restatement — one mark is for the cause.",
              "Working must be shown for calculation marks; a correct answer alone scores 1 of 4.",
            ],
          },
        ],
      }}
    />
  );
}
