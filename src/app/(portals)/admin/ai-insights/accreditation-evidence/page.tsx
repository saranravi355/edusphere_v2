"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { FolderSearch } from "lucide-react";

export default function AccreditationEvidencePage() {
  return (
    <AIDemoPage
      title="Accreditation Evidence Finder"
      description="Finds the documents that evidence a given standard, and says plainly where the evidence is thin."
      icon={FolderSearch}
      accent="emerald"
      panelTitle="Evidence Retrieval"
      panelDescription="Maps each standard onto the documents held, and reports coverage rather than assuming a document exists because it should."
      runLabel="Find Evidence"
      runningLabel="Matching Standards..."
      completeLabel="Search Complete"
      completeSubLabel="18 standards · 3 gaps found"
      emptyTitle="No Search Run"
      emptySubtitle="Search for the evidence behind each accreditation standard."
      result={{
        kind: "findings",
        heading: "Evidence coverage by standard",
        items: [
          {
            title: "Culture 1 — Purpose",
            meta: "4 documents",
            tone: "low",
            badgeLabel: "Well evidenced",
            body: "Mission statement, board minutes adopting it, the staff handbook section and this year's strategic plan all align and are current.",
          },
          {
            title: "Culture 2 — Environment",
            meta: "6 documents",
            tone: "low",
            badgeLabel: "Well evidenced",
            body: "Safeguarding, inclusion and language policies are present, dated within the review cycle, and show recorded consultation.",
          },
          {
            title: "Learning 3 — Approaches to teaching",
            meta: "1 document",
            tone: "high",
            badgeLabel: "Thin",
            body: "Only the curriculum overview maps to this standard. There is no lesson-observation record or professional development log evidencing it in practice.",
          },
          {
            title: "Lifelong learners 2 — Assessment",
            meta: "0 documents",
            tone: "critical",
            badgeLabel: "Gap",
            body: "No document currently maps to this standard. The assessment policy referenced in the handbook is not in the evidence folder.",
          },
        ],
      }}
    />
  );
}
