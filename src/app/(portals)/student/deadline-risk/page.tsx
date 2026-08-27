"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { AlarmClock } from "lucide-react";

export default function DeadlineRiskPage() {
  return (
    <AIDemoPage
      title="Deadline Risk Monitor"
      description="Looks at what is due, what you have started and how you worked before, and flags the deadlines you are most likely to miss."
      icon={AlarmClock}
      accent="rose"
      panelTitle="Deadline Model"
      panelDescription="Compares each upcoming due date against how much of the work exists, and against how long similar tasks took you previously."
      runLabel="Check My Deadlines"
      runningLabel="Checking Submissions..."
      completeLabel="Check Complete"
      completeSubLabel="2 of 6 deadlines at risk"
      emptyTitle="Not Checked Yet"
      emptySubtitle="Run the monitor to see which upcoming deadlines are at risk."
      result={{
        kind: "findings",
        heading: "Upcoming deadlines",
        items: [
          {
            title: "Extended Essay — first full draft",
            meta: "Due in 6 days",
            tone: "critical",
            badgeLabel: "At risk",
            body: "No draft uploaded, and your last supervisor meeting was five weeks ago. Similar tasks have taken you nine days from first draft to submission.",
          },
          {
            title: "Chemistry IA — final report",
            meta: "Due in 11 days",
            tone: "high",
            badgeLabel: "Tight",
            body: "Data collection is complete but the evaluation section is empty. That section took twelve days on the practice IA.",
          },
          {
            title: "Mathematics — problem set 7",
            meta: "Due in 3 days",
            tone: "low",
            badgeLabel: "On track",
            body: "Six of eight questions already submitted.",
          },
          {
            title: "TOK exhibition — commentary",
            meta: "Due in 20 days",
            tone: "low",
            badgeLabel: "On track",
            body: "Objects chosen and two commentaries drafted.",
          },
        ],
      }}
    />
  );
}
