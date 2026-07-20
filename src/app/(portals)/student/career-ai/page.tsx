"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Target, Sparkles, TrendingUp, Briefcase } from "lucide-react";

const careerPaths = [
  { title: "Software Engineering", match: 92, skills: ["Mathematics", "Logical Reasoning", "Problem Solving"] },
  { title: "Data Science", match: 87, skills: ["Statistics", "Mathematics", "Pattern Recognition"] },
  { title: "Mechanical Engineering", match: 78, skills: ["Physics", "Spatial Reasoning", "Design"] },
];

export default function CareerAIPage() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [points, setPoints] = useState<string[]>([]);

  const runPrediction = () => {
    setGenerating(true);
    setGenerated(false);
    setPoints([]);
    setTimeout(() => {
      setPoints(["+5 pts Leadership", "+3 pts Analytical Thinking", "+2 pts Creativity"]);
      setGenerated(true);
      setGenerating(false);
    }, 2200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="AI Career Predictor"
        description="Discover career paths aligned with your academic strengths."
      />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Target size={150} />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-300" /> Career Match Engine
          </h2>
          <p className="text-emerald-200 text-sm mb-6 max-w-lg leading-relaxed">
            Our AI analyzes your grades, interests, and extracurricular activities to suggest career paths where you&apos;re likely to excel.
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
            {points.map((p, i) => (
              <span key={i} className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                {p}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {careerPaths.map((path, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{path.title}</p>
                    <p className="text-xs text-slate-500">{path.skills.join(" • ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
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
