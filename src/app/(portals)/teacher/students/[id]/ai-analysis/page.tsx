"use client";

import PageHeader from "@/components/ui/PageHeader";
import { BrainCircuit, LineChart as LineChartIcon, Target, AlertTriangle, BookOpen, AlertCircle, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState } from "react";

const performanceData = [
  { month: "Jan", "Expected Trajectory": 85, "Actual Performance": 82 },
  { month: "Feb", "Expected Trajectory": 86, "Actual Performance": 85 },
  { month: "Mar", "Expected Trajectory": 87, "Actual Performance": 80 },
  { month: "Apr", "Expected Trajectory": 88, "Actual Performance": 72 },
  { month: "May", "Expected Trajectory": 89, "Actual Performance": 65 },
];

const topicData = [
  { topic: "Arithmetic", score: 92 },
  { topic: "Geometry", score: 88 },
  { topic: "Probability", score: 75 },
  { topic: "Algebraic Functions", score: 45 },
];

export default function StudentAIAnalysisPage({ params }: { params: { id: string } }) {
  const [generating, setGenerating] = useState(false);
  const studentName = "Alex Carter";

  const generatePlan = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title={`AI Performance Analysis: ${studentName}`} 
        description="Machine Learning insights based on historical grades, attendance, and behavioral data."
        action={
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors">
            <BrainCircuit size={18} />
            <span className="font-medium">Regenerate Analysis</span>
          </button>
        }
      />

      {/* ML Diagnostic Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-purple-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={150} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <BrainCircuit className="text-purple-300" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">AI Diagnostic Report</h2>
              <p className="text-purple-300 text-sm font-medium">Confidence Interval: 94.2%</p>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-red-400">
              <TrendingDown size={20} />
              Critical Learning Gap Detected
            </h3>
            <p className="text-slate-300 text-lg leading-relaxed">
              Our ML model has detected a <strong className="text-white bg-red-500/20 px-1 rounded">20% drop</strong> in {studentName}'s recent Mathematics scores. 
              Based on historical pattern analysis of past learnings, this correlates heavily with their prolonged 2-week absence during the introductory fractions module in Grade 8. 
              The student is now struggling specifically with <strong className="text-white border-b border-purple-400">Algebraic Functions</strong> because they lack the foundational fraction manipulation skills required.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={generatePlan}
              disabled={generating}
              className="px-6 py-3 bg-white text-purple-900 hover:bg-purple-50 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
            >
              {generating ? "Generating..." : "Generate Remedial Action Plan"}
            </button>
            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium backdrop-blur-sm transition-all flex items-center gap-2">
              <BookOpen size={18} />
              Assign Prerequisite Modules
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trajectory Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <LineChartIcon className="text-blue-500" size={20} />
              Learning Trajectory Prediction
            </h3>
            <select className="text-sm p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-900/50">
              <option>Mathematics</option>
              <option>Physics</option>
              <option>English</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} domain={[40, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Expected Trajectory" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorExpected)" />
                <Area type="monotone" dataKey="Actual Performance" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <Target className="text-orange-500" size={20} />
            Topic Breakdown (Math)
          </h3>
          
          <div className="flex-1 space-y-5">
            {topicData.map((topic, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{topic.topic}</span>
                  <span className={`text-sm font-bold ${topic.score < 60 ? 'text-red-500' : 'text-green-500'}`}>
                    {topic.score}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${topic.score < 60 ? 'bg-red-500' : topic.score < 80 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                    style={{ width: `${topic.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900/50 flex gap-3">
            <AlertCircle className="text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
              Immediate intervention recommended for <strong>Algebraic Functions</strong>. Proceeding to Calculus without remediation will result in a projected 45% failure risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
