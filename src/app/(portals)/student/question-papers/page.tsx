"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { FileQuestion } from "lucide-react";

// A short practice set in the style of DP Physics Paper 2 (short-answer and
// structured questions), for the same student as the other student previews.
// The old paper was Chemistry SL, which this school does not teach, and its
// section headings promised 45 marks from questions adding up to 21.
export default function QuestionPaperPage() {
  return (
    <AIDemoPage
      title="Question Paper Generator"
      description="Produces IB-style practice papers from the syllabus, with a mark scheme, so you can sit one under timed conditions."
      icon={FileQuestion}
      accent="indigo"
      panelTitle="Paper Builder"
      panelDescription="Selects questions matching the command terms, mark weightings and topic spread of a real paper for your subject and level."
      runLabel="Generate Practice Paper"
      runningLabel="Assembling Questions..."
      completeLabel="Paper Generated"
      completeSubLabel="Sections A and B · 15 marks · 25 minutes"
      emptyTitle="No Paper Generated"
      emptySubtitle="Run the builder to assemble a timed practice paper from your syllabus."
      result={{
        kind: "document",
        heading: "Practice set — Physics HL, Paper 2 style",
        sections: [
          {
            heading: "Section A — Short answer (7 marks)",
            lines: [
              "1 (a) State Newton's second law in terms of momentum. [1]",
              "1 (b) A 0.16 kg cricket ball moving at 12 m s⁻¹ is brought to rest in 0.030 s. Calculate the average force on the ball. [2]",
              "1 (c) Explain why a fielder draws their hands back when catching the ball. [2]",
              "2 Calculate the gravitational field strength at the surface of Mars. Mass 6.4 × 10²³ kg, radius 3.4 × 10⁶ m. [2]",
            ],
          },
          {
            heading: "Section B — Structured (8 marks)",
            lines: [
              "3 (a) Outline what is meant by simple harmonic motion. [2]",
              "3 (b) A mass on a spring oscillates with period 0.80 s and amplitude 5.0 cm. Determine its maximum speed. [3]",
              "3 (c) Discuss how the period would change if the mass were doubled, and justify your answer. [3]",
            ],
          },
          {
            heading: "Mark scheme notes",
            lines: [
              "1 (b): 64 N. Award the method mark for Δp ÷ Δt even if the final value is wrong.",
              "1 (c): 'Explain' needs the physics — a longer stopping time reduces the average force for the same change in momentum.",
              "2: 3.7 N kg⁻¹. 3 (b): ωA = 0.39 m s⁻¹.",
              "3 (c): the period increases by a factor of √2, to about 1.1 s; a bare 'it increases' scores 1 of 3.",
            ],
          },
        ],
      }}
    />
  );
}
