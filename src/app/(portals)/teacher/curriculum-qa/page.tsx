"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { Search } from "lucide-react";

export default function CurriculumQAPage() {
  return (
    <AIDemoPage
      title="Curriculum Q&A"
      description="Answers questions directly from the subject guides and unit planners, quoting where each answer came from."
      icon={Search}
      accent="indigo"
      panelTitle="Document Search"
      panelDescription="Retrieves the passages that answer your question from the subject guides, then answers only from what it found."
      runLabel="Ask The Guides"
      runningLabel="Retrieving Passages..."
      completeLabel="Answer Retrieved"
      completeSubLabel="3 questions answered from 4 documents"
      emptyTitle="No Question Asked"
      emptySubtitle="Ask a question and get the answer with the guide passage it came from."
      result={{
        kind: "chat",
        heading: "Answers with sources",
        exchanges: [
          {
            question: "How many hours of teaching does the DP require for a Higher Level subject?",
            answer: "240 hours for Higher Level and 150 for Standard Level. The guide notes these are minimums for the whole two-year course, not per year, and that they include time for internal assessment.",
            sources: [
              "IB Diploma Programme: From principles into practice, p. 84",
              "Chemistry guide (first assessment 2025), Syllabus outline",
            ],
          },
          {
            question: "Can a student change from HL to SL after the first year?",
            answer: "Yes, subject to the coordinator's approval and the registration deadline for the session. The guide is explicit that internal assessment work already completed at HL can be carried across if it meets the SL criteria.",
            sources: [
              "Diploma Programme Assessment procedures 2026, section B2.3",
              "School academic policy, section 4.1",
            ],
          },
          {
            question: "What is the word limit for the Extended Essay, and what counts towards it?",
            answer: "4,000 words. The count excludes the contents page, maps, charts, diagrams, tables, equations, citations, references, the bibliography and appendices — but includes the introduction, body, conclusion and any footnote that is not purely a citation.",
            sources: [
              "Extended essay guide (2018 onwards), Presentation section",
            ],
          },
        ],
      }}
    />
  );
}
