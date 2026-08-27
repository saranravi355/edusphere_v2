"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { NotebookPen } from "lucide-react";

export default function RevisionGeneratorPage() {
  return (
    <AIDemoPage
      title="Concept Revision Generator"
      description="Turns the topics you scored lowest on into a condensed revision sheet you can work through."
      icon={NotebookPen}
      accent="emerald"
      panelTitle="Weak Topic Finder"
      panelDescription="Picks the sub-topics where your assessed scores sit furthest below your own average, then writes revision notes for those only."
      runLabel="Generate Revision Sheet"
      runningLabel="Finding Weak Topics..."
      completeLabel="Sheet Generated"
      completeSubLabel="3 topics · roughly 50 minutes of work"
      emptyTitle="Nothing Generated Yet"
      emptySubtitle="Run the generator to turn your weakest topics into a revision sheet."
      result={{
        kind: "document",
        heading: "Revision sheet — Mathematics AA HL",
        sections: [
          {
            heading: "Vectors — scalar product (weakest topic)",
            lines: [
              "The scalar product a·b equals |a||b|cos(theta): it is a number, not a vector.",
              "Two vectors are perpendicular exactly when their scalar product is zero — this is the fact most questions hinge on.",
              "Practice: given a = (2, -1, 3) and b = (1, 4, k), find k such that the vectors are perpendicular.",
            ],
          },
          {
            heading: "Integration by substitution",
            lines: [
              "Choose u so that du appears, up to a constant, elsewhere in the integrand.",
              "Change the limits when you change the variable, or convert back before substituting them.",
              "Common slip in your last two papers: forgetting to divide by the derivative of the substitution.",
            ],
          },
          {
            heading: "Binomial distribution",
            lines: [
              "Use it only when trials are fixed in number, independent, and have constant probability.",
              "The phrase 'at least one' almost always means 1 minus P(none).",
            ],
          },
        ],
      }}
    />
  );
}
