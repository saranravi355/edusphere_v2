"use client";

import AIDemoPage, { type AIDemoPageProps } from "@/components/ai/AIDemoPage";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { AlarmClock } from "lucide-react";

type Content = Omit<AIDemoPageProps, "icon">;

const SHARED = {
  title: "Deadline Risk Monitor",
  description: "Looks at what is due, what you have started and how you worked before, and flags the deadlines you are most likely to miss.",
  accent: "rose",
  panelTitle: "Deadline Model",
  panelDescription: "Compares each upcoming due date against how much of the work exists, and against how long similar tasks took you previously.",
  runLabel: "Check My Deadlines",
  runningLabel: "Checking Submissions...",
  completeLabel: "Check Complete",
  emptyTitle: "Not Checked Yet",
  emptySubtitle: "Run the monitor to see which upcoming deadlines are at risk.",
} as const;

const DP: Content = {
  ...SHARED,
  completeSubLabel: "2 of 6 deadlines at risk",
  result: {
    kind: "findings",
    heading: "Upcoming deadlines",
    items: [
      { title: "Extended Essay — first full draft", meta: "Due in 6 days", tone: "critical", badgeLabel: "At risk", body: "No draft uploaded, and your last supervisor meeting was five weeks ago. Similar tasks have taken you nine days from first draft to submission." },
      { title: "Physics IA — final report", meta: "Due in 11 days", tone: "high", badgeLabel: "Tight", body: "Data collection is complete but the evaluation section is empty. That section took twelve days on the practice IA." },
      { title: "Mathematics — problem set 7", meta: "Due in 3 days", tone: "low", badgeLabel: "On track", body: "Six of eight questions already submitted." },
      { title: "TOK exhibition — commentary", meta: "Due in 20 days", tone: "low", badgeLabel: "On track", body: "Objects chosen and two commentaries drafted." },
    ],
  },
};

// An MYP5 student's term: the Personal Project, criterion-marked unit tasks and
// Service as Action — none of which a DP deadline list would show them.
const MYP: Content = {
  ...SHARED,
  completeSubLabel: "2 of 5 deadlines at risk",
  result: {
    kind: "findings",
    heading: "Upcoming deadlines",
    items: [
      { title: "Personal Project — report draft", meta: "Due in 9 days", tone: "critical", badgeLabel: "At risk", body: "Your process journal runs to week 6, but the report has no section for criterion C (Reflecting), and your last supervisor meeting was four weeks ago." },
      { title: "Sciences — lab report (criteria B and C)", meta: "Due in 5 days", tone: "high", badgeLabel: "Tight", body: "Method written and data collected, but the evaluation of the method is empty. Criterion C asks you to evaluate it, not only to process the data." },
      { title: "Mathematics — criterion A unit test", meta: "In 3 days", tone: "low", badgeLabel: "On track", body: "Two-thirds of the revision checklist done." },
      { title: "Service as Action — reflection", meta: "Due in 14 days", tone: "low", badgeLabel: "On track", body: "Two activities logged this term and one reflection drafted." },
    ],
  },
};

export default function DeadlineRiskPage() {
  const content = useProgramme() === "MYP" ? MYP : DP;
  return <AIDemoPage icon={AlarmClock} {...content} />;
}
