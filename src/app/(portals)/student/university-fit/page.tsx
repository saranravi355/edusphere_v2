"use client";

import AIDemoPage, { type AIDemoPageProps } from "@/components/ai/AIDemoPage";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { Landmark } from "lucide-react";

type Content = Omit<AIDemoPageProps, "icon">;

// DP: the same student as the grade forecast — 38 points, Economics, Physics
// and Mathematics AA at Higher Level, Mathematics predicted to slip to a 5.
const DP: Content = {
  title: "University Fit Analyzer",
  description: "Maps your predicted grades onto the courses that would realistically make you an offer, and the ones that would not.",
  accent: "sky",
  panelTitle: "Offer Model",
  panelDescription: "Compares your predicted points and subject-specific requirements against published entry requirements and recent offer patterns.",
  runLabel: "Analyse My Options",
  runningLabel: "Comparing Requirements...",
  completeLabel: "Analysis Complete",
  completeSubLabel: "Predicted 38 points · 12 courses screened",
  emptyTitle: "Nothing Analysed Yet",
  emptySubtitle: "Run the analyser to see which courses your predicted grades would reach.",
  result: {
    kind: "findings",
    heading: "Course options by likelihood",
    items: [
      { title: "BEng Mechanical Engineering — University of Manchester", meta: "Typical offer around 36–37 points, 6 in Mathematics HL", tone: "high", badgeLabel: "Reach", body: "Your predicted 38 clears the total and Physics HL is predicted 6, but Mathematics AA HL is predicted 5 against the 6 the course asks for." },
      { title: "BA (Hons) Economics — Ashoka University", meta: "Holistic admission", tone: "low", badgeLabel: "Likely", body: "Ashoka accepts IB predicted grades and reads the whole application. A 38 with Economics at Higher Level sits comfortably inside recent admits." },
      { title: "BSc Physics — Trinity College Dublin", meta: "Typical requirement about 35 points", tone: "low", badgeLabel: "Likely", body: "Comfortably within range, and Physics at Higher Level is the subject it looks for." },
      { title: "BA Natural Sciences — University of Cambridge", meta: "Typical offer 40–42 points", tone: "critical", badgeLabel: "Unlikely", body: "Two to four points below the typical offer, and Cambridge usually expects a 7 in Mathematics at Higher Level." },
    ],
  },
};

// MYP: university is two years off, but the decision that shapes it — which DP
// subjects to take — comes at the end of MYP5. So the MYP version plans those
// choices, using only the DP subjects and levels this school offers.
const MYP: Content = {
  title: "DP Subject Planner",
  description: "Maps your MYP strengths and interests onto the DP subject packages this school offers, and the university pathways each one keeps open.",
  accent: "sky",
  panelTitle: "Pathway Model",
  panelDescription: "Compares your MYP grades and interests with the DP subjects offered here and the subject requirements of courses you might want later.",
  runLabel: "Plan My DP Subjects",
  runningLabel: "Comparing Pathways...",
  completeLabel: "Plan Ready",
  completeSubLabel: "4 packages compared · DP choices due in Term 2",
  emptyTitle: "Nothing Planned Yet",
  emptySubtitle: "Run the planner to see which DP subject choices keep your options open.",
  result: {
    kind: "findings",
    heading: "DP packages, and what they keep open",
    items: [
      { title: "Architecture and design", meta: "Visual Arts SL · Mathematics AA · Physics HL", tone: "low", badgeLabel: "Good fit", body: "Arts and Mathematics are your strongest subjects (6 and 6), and most architecture courses look for Mathematics and a portfolio. Physics HL keeps engineering open as well." },
      { title: "Engineering", meta: "Mathematics AA HL · Physics HL", tone: "medium", badgeLabel: "Possible", body: "Engineering courses ask for both at Higher Level. Sciences is the grade to lift (5) — criterion C is where the marks are going." },
      { title: "Economics and business", meta: "Economics HL · Mathematics AA", tone: "low", badgeLabel: "Good fit", body: "Your Individuals & Societies work fits, and choosing Mathematics AA rather than AI keeps the more mathematical economics courses open." },
      { title: "What Mathematics AI would close", meta: "Worth knowing now", tone: "high", badgeLabel: "Check", body: "Mathematics: Applications & Interpretation SL suits social sciences and design, but most engineering and many economics courses expect Analysis & Approaches." },
    ],
  },
};

export default function UniversityFitPage() {
  const content = useProgramme() === "MYP" ? MYP : DP;
  return <AIDemoPage icon={Landmark} {...content} />;
}
