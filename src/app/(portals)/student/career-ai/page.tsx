"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Target, Sparkles, TrendingUp, Briefcase, Award, Landmark } from "lucide-react";
import AIFeatureLink from "@/components/ai/AIFeatureLink";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { useProgramme } from "@/components/students/ProgrammeProvider";

type Path = { title: string; match: number; skills: string[]; keepOpen?: string };

// DP: pathways from the package most DP students here take. MYP: pathways from
// an MYP5 student's strongest subject groups, and — the question an MYP student
// actually faces next — which DP subjects keep each one open.
const CONTENT: Record<"DP" | "MYP", {
  description: string;
  strengths: string[];
  paths: Path[];
  links: { scholarships: { title: string; description: string }; fit: { title: string; description: string } };
}> = {
  DP: {
    description: "Discover career paths aligned with your IB subjects and strengths.",
    strengths: ["Mathematics AA HL", "Physics HL", "Economics HL"],
    paths: [
      { title: "Mechanical & Aerospace Engineering", match: 88, skills: ["Physics HL", "Mathematics AA HL", "Robotics Club"] },
      { title: "Economics & Finance", match: 84, skills: ["Economics HL", "Mathematics AA HL", "Data analysis"] },
      { title: "Architecture & Design", match: 76, skills: ["Visual Arts SL", "Physics HL", "Spatial reasoning"] },
    ],
    links: {
      scholarships: { title: "Scholarship Matcher", description: "Scholarships you would actually be eligible for, ranked by fit." },
      fit: { title: "University Fit Analyzer", description: "Maps your predicted grades onto realistic university offers." },
    },
  },
  MYP: {
    description: "Discover career paths aligned with your MYP strengths — and the DP subjects that keep them open.",
    strengths: ["Mathematics (6)", "Arts (6)", "Physical & Health Education (6)"],
    paths: [
      { title: "Architecture & Design", match: 86, skills: ["Arts", "Mathematics", "Design cycle"], keepOpen: "Visual Arts, Mathematics AA, Physics" },
      { title: "Engineering", match: 80, skills: ["Mathematics", "Sciences", "Robotics Club"], keepOpen: "Mathematics AA HL, Physics HL" },
      { title: "Economics & Business", match: 74, skills: ["Individuals & Societies", "Mathematics", "Debate Society"], keepOpen: "Economics HL, Mathematics AA" },
    ],
    links: {
      scholarships: { title: "Opportunity Matcher", description: "Competitions and programmes you can enter now, ranked by fit." },
      fit: { title: "DP Subject Planner", description: "Which DP subject choices keep your options open." },
    },
  },
};

export default function CareerAIPage() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const c = CONTENT[useProgramme()];

  const runPrediction = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerated(true);
      setGenerating(false);
    }, 2200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader title="AI Career Predictor" description={c.description} />

      <AIPreviewNotice />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AIFeatureLink href="/student/scholarships" icon={<Award size={15} />} title={c.links.scholarships.title} description={c.links.scholarships.description} />
        <AIFeatureLink href="/student/university-fit" icon={<Landmark size={15} />} title={c.links.fit.title} description={c.links.fit.description} />
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Target size={150} />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-300" /> Career Match Engine
          </h2>
          <p className="text-emerald-200 text-sm mb-6 max-w-lg leading-relaxed">
            Looks at your IB subject choices, grades and activities to suggest pathways where you are likely to do well.
          </p>
          <button
            onClick={runPrediction}
            disabled={generating}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
          >
            {generating ? (
              <><Sparkles size={18} className="animate-spin" /> Analyzing Profile...</>
            ) : (
              <><Sparkles size={18} /> Generate AI Prediction</>
            )}
          </button>
        </div>
      </div>

      {generated && (
        <>
          <div className="flex flex-wrap gap-2">
            {c.strengths.map((s, i) => (
              <span key={i} className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                Strength: {s}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {c.paths.map((path, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{path.title}</p>
                    <p className="text-xs text-slate-500">{path.skills.join(" • ")}</p>
                    {path.keepOpen && (
                      <p className="text-xs text-slate-400 mt-0.5">DP subjects that keep it open: {path.keepOpen}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  <TrendingUp size={16} /> {path.match}%
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
