"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { ShieldCheck } from "lucide-react";

export default function ComplianceAssistantPage() {
  return (
    <AIDemoPage
      title="Compliance Document Assistant"
      description="Answers policy and accreditation questions from the school's own documents, and shows which document each answer came from."
      icon={ShieldCheck}
      accent="sky"
      panelTitle="Policy Retrieval"
      panelDescription="Searches board policies, the staff handbook and accreditation evidence, and answers only from passages it can cite."
      runLabel="Ask A Policy Question"
      runningLabel="Searching Policies..."
      completeLabel="Answers Retrieved"
      completeSubLabel="3 questions · 6 documents cited"
      emptyTitle="No Question Asked"
      emptySubtitle="Ask a policy question and get the answer with its source."
      result={{
        kind: "chat",
        heading: "Answers with sources",
        exchanges: [
          {
            question: "What is our retention period for safeguarding records?",
            answer: "Safeguarding records are retained until the student's 25th birthday, then reviewed rather than destroyed automatically. The policy requires a written note of the review decision in every case.",
            sources: [
              "Child Protection and Safeguarding Policy v4, section 9.2",
              "Records Retention Schedule 2025, row 31",
            ],
          },
          {
            question: "Who must approve an overnight school trip?",
            answer: "The Head of School approves overnight trips, on a risk assessment signed by the trip leader and the designated safeguarding lead. Trips leaving the country additionally require board notification at least 30 days ahead.",
            sources: [
              "Educational Visits Policy, section 3",
              "Board Delegation of Authority, appendix B",
            ],
          },
          {
            question: "How often must the fire evacuation drill be run?",
            answer: "Once per term, with at least one drill in the first two weeks of the academic year so that new students take part. Each drill must be logged with the evacuation time.",
            sources: [
              "Health and Safety Policy, section 6.4",
              "Fire Log 2025-26",
            ],
          },
        ],
      }}
    />
  );
}
