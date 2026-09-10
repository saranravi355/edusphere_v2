"use client";

import AIDemoPage, { type AIDemoPageProps } from "@/components/ai/AIDemoPage";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { Award } from "lucide-react";

type Content = Omit<AIDemoPageProps, "icon">;

// DP: awards a school-leaver can actually hold.
const DP: Content = {
  title: "Scholarship Matcher",
  description: "Matches your predicted grades, service record and interests against scholarships you would actually be eligible for.",
  accent: "emerald",
  panelTitle: "Eligibility Matcher",
  panelDescription: "Screens open scholarships against predicted grades, service record, subject combination and citizenship, and drops the ones you cannot apply for.",
  runLabel: "Find Scholarships",
  runningLabel: "Screening Eligibility...",
  completeLabel: "Matching Complete",
  completeSubLabel: "4 eligible · 1 closing within a month",
  emptyTitle: "No Matches Yet",
  emptySubtitle: "Run the matcher to see scholarships you are eligible for right now.",
  result: {
    kind: "findings",
    heading: "Scholarships you are eligible for",
    items: [
      { title: "Lester B. Pearson International Scholarship — University of Toronto", meta: "Needs school nomination · closes in 26 days", tone: "low", badgeLabel: "Strong match", body: "For international students in their final year of school who show leadership and service. The school nominates candidates, and your predicted 38 and 18-month service project fit the profile." },
      { title: "Reliance Foundation Undergraduate Scholarship", meta: "Closes in 41 days", tone: "low", badgeLabel: "Strong match", body: "Merit-cum-means support for first-year undergraduates at Indian universities. Applies if you accept an Indian offer such as Ashoka." },
      { title: "Tata Scholarship for Cornell University", meta: "Follows an offer", tone: "medium", badgeLabel: "Possible", body: "Need-based aid for Indian citizens admitted to Cornell. It is awarded after admission, so it only matters if Cornell is on your list." },
      { title: "Local Rotary Merit Award", meta: "Closes in 60 days", tone: "medium", badgeLabel: "Possible", body: "Needs two references from outside school; you have one on file." },
    ],
  },
};

// MYP: an MYP student is years from a university scholarship. What is open to
// them now are competitions and programmes — the record scholarship panels
// later read.
const MYP: Content = {
  title: "Opportunity Matcher",
  description: "Matches your strengths and interests against competitions and programmes open to MYP students — the record scholarships look for later.",
  accent: "emerald",
  panelTitle: "Eligibility Matcher",
  panelDescription: "Screens open competitions and programmes against your year group, subject strengths and interests, and drops the ones you cannot enter yet.",
  runLabel: "Find Opportunities",
  runningLabel: "Screening Eligibility...",
  completeLabel: "Matching Complete",
  completeSubLabel: "4 open to you · 1 closing within a month",
  emptyTitle: "No Matches Yet",
  emptySubtitle: "Run the matcher to see competitions and programmes you can enter now.",
  result: {
    kind: "findings",
    heading: "Opportunities open to you",
    items: [
      { title: "Indian Olympiad Qualifier in Mathematics (IOQM)", meta: "Registration closes in 19 days", tone: "low", badgeLabel: "Strong match", body: "Open from class 8 upwards, and the first step towards the International Mathematical Olympiad. Your Mathematics criterion A levels suggest the problems are within reach with practice." },
      { title: "IRIS National Fair", meta: "Project entries open", tone: "low", badgeLabel: "Strong match", body: "A national science and engineering fair for students aged 10 to 17. A tested Personal Project product could become an entry." },
      { title: "National Science Olympiad (SOF)", meta: "Entered through the school", tone: "medium", badgeLabel: "Possible", body: "Sciences is not yet your strongest subject, so treat it as practice for the May eAssessment rather than a target." },
      { title: "Robotics Club — inter-school competition", meta: "Team chosen in October", tone: "medium", badgeLabel: "Possible", body: "The club picks its competition team from members' builds; joining this term puts you in the running." },
    ],
  },
};

export default function ScholarshipsPage() {
  const content = useProgramme() === "MYP" ? MYP : DP;
  return <AIDemoPage icon={Award} {...content} />;
}
