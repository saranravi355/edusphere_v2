"use client";

import AIDemoPage, { type AIDemoPageProps } from "@/components/ai/AIDemoPage";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { FileQuestion } from "lucide-react";

type Content = Omit<AIDemoPageProps, "icon">;

const SHARED = {
  title: "Question Paper Generator",
  description: "Produces IB-style practice papers from the syllabus, with a mark scheme, so you can sit one under timed conditions.",
  accent: "indigo",
  panelTitle: "Paper Builder",
  runLabel: "Generate Practice Paper",
  runningLabel: "Assembling Questions...",
  completeLabel: "Paper Generated",
  emptyTitle: "No Paper Generated",
  emptySubtitle: "Run the builder to assemble a timed practice paper from your syllabus.",
} as const;

// DP: a short set in the style of Physics Paper 2.
const DP: Content = {
  ...SHARED,
  panelDescription: "Selects questions matching the command terms, mark weightings and topic spread of a real paper for your subject and level.",
  completeSubLabel: "Sections A and B · 15 marks · 25 minutes",
  result: {
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
  },
};

// MYP: a criterion A (knowing and understanding) task in Mathematics. MYP work
// is marked against criterion levels, so the marks here are evidence for a
// level, not a percentage.
const MYP: Content = {
  ...SHARED,
  panelDescription: "Selects questions matching the command terms and the criterion your next assessment is marked against.",
  completeSubLabel: "Sections A and B · 20 marks · 30 minutes",
  result: {
    kind: "document",
    heading: "Practice set — MYP Mathematics, criterion A (knowing and understanding)",
    sections: [
      {
        heading: "Section A — Short answer (8 marks)",
        lines: [
          "1 Solve 3x − 7 = 2x + 5. [2]",
          "2 A right-angled triangle has shorter sides of 6 cm and 8 cm. Calculate the length of the hypotenuse. [2]",
          "3 Find the gradient of the line through (1, 2) and (4, 11). [2]",
          "4 Write 0.000 45 in standard form. [2]",
        ],
      },
      {
        heading: "Section B — Structured (12 marks)",
        lines: [
          "5 (a) Solve the simultaneous equations x + y = 10 and 2x − y = 5. [4]",
          "5 (b) A bag holds 3 red and 5 blue counters. Two are taken without replacement. Find the probability that both are red. [4]",
          "5 (c) Justify whether 'both blue' is more likely than 'one of each colour'. [4]",
        ],
      },
      {
        heading: "Mark scheme notes",
        lines: [
          "1: x = 12. 2: 10 cm. 3: 3. 4: 4.5 × 10⁻⁴.",
          "5 (a): x = 5, y = 5. Method marks for eliminating a variable, even if the arithmetic slips.",
          "5 (b): 3/8 × 2/7 = 3/28.",
          "5 (c): both blue is 20/56 and one of each is 30/56, so one of each is more likely — the comparison has to be shown to count as justified.",
          "The total is evidence for a level in criterion A, not a percentage.",
        ],
      },
    ],
  },
};

export default function QuestionPaperPage() {
  const content = useProgramme() === "MYP" ? MYP : DP;
  return <AIDemoPage icon={FileQuestion} {...content} />;
}
