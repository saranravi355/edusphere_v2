"use client";

import AIDemoPage, { type AIDemoPageProps } from "@/components/ai/AIDemoPage";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { Mic } from "lucide-react";

type Content = Omit<AIDemoPageProps, "icon">;

// DP: the English A individual oral — 10 minutes plus 5 of questions, four
// criteria out of 10.
const DP: Content = {
  title: "Oral Exam Simulator",
  description: "Runs a mock individual oral, asks follow-up questions the way an examiner would, and scores the response against the criteria.",
  accent: "amber",
  panelTitle: "Mock Examiner",
  panelDescription: "Puts the extracts in front of you, times the response, and asks the follow-ups an examiner would ask on what you actually said.",
  runLabel: "Start Mock Oral",
  runningLabel: "Preparing Extracts...",
  completeLabel: "Mock Complete",
  completeSubLabel: "15 minutes (10 + 5 questions) · 29 of 40",
  emptyTitle: "No Session Yet",
  emptySubtitle: "Start a mock oral to practise under timed conditions and get scored feedback.",
  result: {
    kind: "findings",
    heading: "Session feedback — English A individual oral",
    items: [
      { title: "Criterion A — Knowledge, understanding and interpretation", meta: "8 of 10", tone: "low", badgeLabel: "Strong", body: "You linked the extract to the wider work confidently and used two well-chosen references." },
      { title: "Criterion B — Analysis and evaluation", meta: "6 of 10", tone: "medium", badgeLabel: "Developing", body: "Techniques were identified but their effect on the reader was asserted rather than argued. The examiner followed up twice on this." },
      { title: "Criterion C — Focus and organisation", meta: "7 of 10", tone: "medium", badgeLabel: "Developing", body: "Clear structure for the first six minutes; the final section returned to a point already made." },
      { title: "Criterion D — Language", meta: "8 of 10", tone: "low", badgeLabel: "Strong", body: "Register was appropriate throughout. Two filler-heavy stretches at 3:10 and 7:45." },
    ],
  },
};

// MYP: no individual oral. The spoken assessment an MYP student meets is in
// Language Acquisition, marked on its speaking criterion (C) out of 8 — here
// Spanish, the language this school teaches in the MYP.
const MYP: Content = {
  title: "Oral Exam Simulator",
  description: "Runs a mock speaking assessment, asks follow-up questions the way your teacher would, and gives feedback against the speaking criterion.",
  accent: "amber",
  panelTitle: "Mock Examiner",
  panelDescription: "Puts a visual stimulus in front of you, times your response, and asks the follow-up questions a teacher would ask about what you said.",
  runLabel: "Start Mock Speaking Task",
  runningLabel: "Preparing Stimulus...",
  completeLabel: "Mock Complete",
  completeSubLabel: "Language Acquisition: Spanish · criterion C: 6 of 8",
  emptyTitle: "No Session Yet",
  emptySubtitle: "Start a mock speaking task to practise under timed conditions and get feedback.",
  result: {
    kind: "findings",
    heading: "Session feedback — Spanish speaking task (criterion C)",
    items: [
      { title: "Criterion C — Speaking", meta: "6 of 8", tone: "low", badgeLabel: "Level 5–6", body: "You described the image, gave an opinion and kept the conversation going without long pauses." },
      { title: "Vocabulary", meta: "Strength", tone: "low", badgeLabel: "Strong", body: "A good range of topic vocabulary on the environment, including two phrases from this unit." },
      { title: "Grammar", meta: "Next step", tone: "medium", badgeLabel: "Developing", body: "Past tenses were mixed up when you described last weekend: the preterite is the one for completed actions." },
      { title: "Pronunciation and interaction", meta: "Next step", tone: "medium", badgeLabel: "Developing", body: "Clear pronunciation throughout. Twice you answered a follow-up question in one word; aim for a full sentence with a reason." },
    ],
  },
};

export default function OralSimulatorPage() {
  const content = useProgramme() === "MYP" ? MYP : DP;
  return <AIDemoPage icon={Mic} {...content} />;
}
