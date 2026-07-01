"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { BrainCircuit, TrendingUp, TrendingDown, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

function hashStringToInt(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateData(studentId: string) {
  const hash = hashStringToInt(studentId);

  const trajectory = Array.from({ length: 6 }, (_, i) => {
    const base = 60 + ((hash + i * 7) % 30);
    return {
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i],
      score: base,
    };
  });

  const topics = [
    { topic: "Algebra", mastery: 50 + ((hash + 11) % 45) },
    { topic: "Geometry", mastery: 50 + ((hash + 23) % 45) },
    { topic: "Calculus", mastery: 50 + ((hash + 37) % 45) },
    { topic: "Statistics", mastery: 50 + ((hash + 53) % 45) },
  ];

  const confidence = 90 + (hash % 8);

  return { trajectory, topics, confidence };
}

export default function AIAnalysisPage() {
  const params = useParams();
  const studentId = (params?.id as string) || "demo";
  const [data, setData] = useState<ReturnType<typeof generateData> | null>(null);

  useEffect(() => {
    setData(generateData(studentId));
  }, [studentId]);

  const studentName = "Aarav Patel";
  const subject = "Mathematics";

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-slate-400">
        Loading AI analysis...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <Link href="/teacher/students" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft size={16} /> Back to Directory
      </Link>

      <PageHeader
        title="AI Performance Analysis"
        description={`Predictive insights for ${studentName} — ${subject}`}
      />

      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={150} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-indigo-300" />
              <span className="text-sm font-bold text-indigo-300 uppercase tracking-wider">AI Confidence: {data.confidence}%</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">{studentName}&apos;s recent {subject} scores show a positive trend.</h2>
            <p className="text-indigo-200 text-sm max-w-lg leading-relaxed">
              Based on the last 6 months of performance data, our model predicts continued improvement if current study patterns persist. Calculus mastery is the primary area for growth.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" /> Score Trajectory
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trajectory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" /> Topic Breakdown
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topics} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="topic" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="mastery" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={20} name="Mastery %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-blue-500" /> Recommended Interventions
        </h4>
        <ul className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed list-disc pl-5 space-y-1">
          <li>Assign targeted Calculus practice sets twice weekly.</li>
          <li>Pair with a peer tutor strong in Statistics for collaborative review sessions.</li>
          <li>Schedule a 1:1 check-in to discuss study habits and time management.</li>
        </ul>
      </div>
    </div>
  );
}
