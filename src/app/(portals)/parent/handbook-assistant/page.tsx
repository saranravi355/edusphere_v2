"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { MessagesSquare } from "lucide-react";

export default function HandbookAssistantPage() {
  return (
    <AIDemoPage
      title="Parent Handbook Assistant"
      description="Answers questions about school policy, fees, transport and attendance from the parent handbook, quoting the section it came from."
      icon={MessagesSquare}
      accent="emerald"
      panelTitle="Handbook Search"
      panelDescription="Searches the parent handbook and the current fee and transport schedules, and answers only from what it finds there."
      runLabel="Ask A Question"
      runningLabel="Searching Handbook..."
      completeLabel="Answers Retrieved"
      completeSubLabel="3 questions answered"
      emptyTitle="No Question Asked"
      emptySubtitle="Ask about fees, transport, attendance or term dates and see the handbook section behind the answer."
      result={{
        kind: "chat",
        heading: "Answers with sources",
        exchanges: [
          {
            question: "How do I report that my child will be absent?",
            answer: "Before 8:00 on the morning of the absence, through the parent portal or by telephoning the school office. An absence of more than three consecutive days needs a medical note on return.",
            sources: [
              "Parent Handbook 2025-26, section 4.2 Attendance",
              "Attendance Policy, section 3",
            ],
          },
          {
            question: "When is the second term fee instalment due, and what happens if it is late?",
            answer: "The second instalment is due on the first working day of the term. A late-payment charge applies after fourteen days, and the handbook asks families in difficulty to contact the bursar before that point rather than after.",
            sources: [
              "Fee Schedule 2025-26, Payment terms",
              "Parent Handbook 2025-26, section 7.1",
            ],
          },
          {
            question: "Can my child change bus stops for a few weeks?",
            answer: "Yes, with five working days' notice to the transport office, subject to capacity on the requested route. Temporary changes are approved for a stated period rather than indefinitely.",
            sources: [
              "Transport Policy, section 2.4",
              "Parent Handbook 2025-26, section 6.3",
            ],
          },
        ],
      }}
    />
  );
}
