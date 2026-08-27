"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { BookMarked } from "lucide-react";

export default function IBPolicyPage() {
  return (
    <AIDemoPage
      title="IB Policy Assistant"
      description="Answers questions about IB requirements from the handbooks, with the passage each answer rests on."
      icon={BookMarked}
      accent="indigo"
      panelTitle="Handbook Retrieval"
      panelDescription="Searches the IB handbooks and programme standards, and answers strictly from retrieved passages rather than from memory."
      runLabel="Ask The Handbooks"
      runningLabel="Retrieving Passages..."
      completeLabel="Answers Retrieved"
      completeSubLabel="3 questions · 5 passages cited"
      emptyTitle="No Question Asked"
      emptySubtitle="Ask about an IB requirement and get the handbook passage behind the answer."
      result={{
        kind: "chat",
        heading: "Answers with sources",
        exchanges: [
          {
            question: "What must a school have in place before it can be authorised to offer the DP?",
            answer: "A completed application, evidence against each programme standard, a qualified and trained faculty, and the required policies in place — language, assessment, inclusion and academic integrity. Authorisation follows a verification visit.",
            sources: [
              "Programme standards and practices (2020), Culture 1-3",
              "Guide to programme evaluation, section 2",
            ],
          },
          {
            question: "How is the academic integrity policy expected to be reviewed?",
            answer: "It must be reviewed on a stated cycle with staff, students and parents involved, and the review itself has to be documented. The standards ask for evidence of consultation, not only a current document.",
            sources: [
              "Programme standards and practices (2020), Culture 2.2",
              "Academic integrity policy (2019), section 5",
            ],
          },
          {
            question: "Does CAS have a minimum number of hours?",
            answer: "No. The guide is explicit that CAS is not measured in hours; the requirement is a reasonable balance across creativity, activity and service over 18 months, evidenced against the seven learning outcomes.",
            sources: [
              "CAS guide (first assessment 2017), 'CAS and the DP core'",
            ],
          },
        ],
      }}
    />
  );
}
