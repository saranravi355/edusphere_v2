"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { Landmark } from "lucide-react";

// The same student as the grade forecast: 38 points, Economics, Physics and
// Mathematics AA at Higher Level, with Mathematics predicted to slip to a 5.
// The old list was built around Chemistry SL, which this school does not
// offer, and named no option outside the UK and Ireland for a school in India.
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
            title: "BEng Mechanical Engineering — University of Manchester",
            meta: "Typical offer around 36–37 points, 6 in Mathematics HL",
            tone: "high",
            badgeLabel: "Reach",
            body: "Your predicted 38 clears the total and Physics HL is predicted 6, but Mathematics AA HL is predicted 5 against the 6 the course asks for.",
          },
          {
            title: "BA (Hons) Economics — Ashoka University",
            meta: "Holistic admission",
            tone: "low",
            badgeLabel: "Likely",
            body: "Ashoka accepts IB predicted grades and reads the whole application. A 38 with Economics at Higher Level sits comfortably inside recent admits.",
          },
          {
            title: "BSc Physics — Trinity College Dublin",
            meta: "Typical requirement about 35 points",
            tone: "low",
            badgeLabel: "Likely",
            body: "Comfortably within range, and Physics at Higher Level is the subject it looks for.",
          },
          {
            title: "BA Natural Sciences — University of Cambridge",
            meta: "Typical offer 40–42 points",
            tone: "critical",
            badgeLabel: "Unlikely",
            body: "Two to four points below the typical offer, and Cambridge usually expects a 7 in Mathematics at Higher Level.",
          },
        ],
      }}
    />
  );
}
