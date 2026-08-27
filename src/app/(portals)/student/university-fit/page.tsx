"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { Landmark } from "lucide-react";

export default function UniversityFitPage() {
  return (
    <AIDemoPage
      title="University Fit Analyzer"
      description="Maps your predicted grades onto the courses that would realistically make you an offer, and the ones that would not."
      icon={Landmark}
      accent="sky"
      panelTitle="Offer Model"
      panelDescription="Compares your predicted points and subject-specific requirements against published entry requirements and recent offer patterns."
      runLabel="Analyse My Options"
      runningLabel="Comparing Requirements..."
      completeLabel="Analysis Complete"
      completeSubLabel="Predicted 38 points · 12 courses screened"
      emptyTitle="Nothing Analysed Yet"
      emptySubtitle="Run the analyser to see which courses your predicted grades would reach."
      result={{
        kind: "findings",
        heading: "Course options by likelihood",
        items: [
          {
            title: "BSc Chemistry — University of Edinburgh",
            meta: "Requires 37 points, Chemistry HL",
            tone: "high",
            badgeLabel: "Reach",
            body: "Your predicted 38 clears the total, but this course requires Chemistry at Higher Level and yours is Standard Level.",
          },
          {
            title: "BEng Chemical Engineering — University of Manchester",
            meta: "Requires 36 points, Maths HL 6",
            tone: "low",
            badgeLabel: "Likely",
            body: "Both the total and the Mathematics HL requirement are met with a point to spare.",
          },
          {
            title: "BSc Biochemistry — Trinity College Dublin",
            meta: "Requires 35 points",
            tone: "low",
            badgeLabel: "Likely",
            body: "Comfortably within range; no subject-specific barrier.",
          },
          {
            title: "BA Natural Sciences — University of Cambridge",
            meta: "Requires 40-42 points",
            tone: "critical",
            badgeLabel: "Unlikely",
            body: "Four points below the typical offer, and the course expects two science subjects at Higher Level.",
          },
        ],
      }}
    />
  );
}
