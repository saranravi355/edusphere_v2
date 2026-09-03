'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import {
  getBandCounts, getStudentScores, getQuestionAverages, getCriteriaAverages, getHeatmapData, getInsights
} from '@/lib/grading/analytics';
import type { AnalyticsSubmission, Insight } from '@/lib/grading/analytics';
import { BAND_LABELS, BAND_HEX } from '@/lib/grading/gradeBands';
import type { Band } from '@/lib/grading/gradeBands';

const select =
  'p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-medium ' +
  'text-slate-700 dark:text-slate-300 text-sm';

const card = 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5';

const TONE_ICON: Record<Insight['tone'], typeof CheckCircle2> = {
  good: CheckCircle2,
  weak: AlertTriangle,
  neutral: Info
};

const TONE_STYLE: Record<Insight['tone'], string> = {
  good: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
  weak: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
  neutral: 'bg-slate-50 dark:bg-zinc-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700'
};

export default function AnalyticsClient({
  classes,
  activeClassId,
  submissions,
  totalStudents
}: {
  classes: { id: string; name: string }[];
  activeClassId: string;
  submissions: AnalyticsSubmission[];
  totalStudents: number;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-mount gate to avoid SSR/recharts hydration mismatch
    setMounted(true);
  }, []);

  const insights = useMemo(() => getInsights(submissions), [submissions]);
  const bandCounts = useMemo(() => getBandCounts(submissions), [submissions]);
  const studentScores = useMemo(() => getStudentScores(submissions), [submissions]);
  const questionAverages = useMemo(() => getQuestionAverages(submissions), [submissions]);
  const criteriaAverages = useMemo(() => getCriteriaAverages(submissions), [submissions]);
  const heatmap = useMemo(() => getHeatmapData(submissions), [submissions]);

  const evaluatedStudents = new Set(studentScores.map(s => s.studentId)).size;

  if (submissions.length === 0) {
    return (
      <div className={card}>
        <p className="text-sm text-slate-500">
          No answer sheets graded for this class yet. Upload and grade a paper from the AI Exam Grader to see analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {classes.length > 1 && (
        <div className="flex justify-end">
          <select
            defaultValue={activeClassId}
            className={select}
            onChange={e => router.push(`/teacher/grading/ai-grader/analytics?classId=${e.target.value}`)}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, i) => {
            const Icon = TONE_ICON[insight.tone];
            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl border p-4 ${TONE_STYLE[insight.tone]}`}>
                <Icon size={16} className="shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-bold">{insight.label}</p>
                  <p className="text-xs mt-0.5 opacity-90">{insight.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={card}>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Papers graded</h3>
          <div className="flex items-center gap-5">
            <ProgressRing evaluated={evaluatedStudents} total={totalStudents > 0 ? totalStudents : studentScores.length} />
            <div className="text-sm text-slate-500 space-y-1">
              <p><strong className="text-slate-800 dark:text-slate-100">{evaluatedStudents}</strong> of {totalStudents > 0 ? totalStudents : evaluatedStudents} students graded</p>
              <p>{submissions.length} submission{submissions.length === 1 ? '' : 's'} total</p>
            </div>
          </div>
        </div>

        <div className={card}>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Score bands</h3>
          {mounted ? <BandDonut counts={bandCounts} /> : <ChartSkeleton />}
        </div>

        <div className={card}>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Criteria strength</h3>
          {mounted ? <CriteriaRadar criteria={criteriaAverages} /> : <ChartSkeleton />}
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Student comparison</h3>
        {mounted ? <StudentBar scores={studentScores} /> : <ChartSkeleton height={Math.max(240, studentScores.length * 32)} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Average score per question</h3>
          {mounted ? <QuestionBar questions={questionAverages} /> : <ChartSkeleton />}
        </div>
        <div className={card}>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Score trend across questions</h3>
          {mounted ? <QuestionTrend questions={questionAverages} /> : <ChartSkeleton />}
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Performance heatmap</h3>
        <Heatmap data={heatmap} />
      </div>
    </div>
  );
}

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <div className="w-full bg-slate-50 dark:bg-zinc-800/50 rounded-lg animate-pulse" style={{ height }} />;
}

function ProgressRing({ evaluated, total }: { evaluated: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((evaluated / total) * 100)) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
      <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-zinc-800" />
      <circle
        cx="44" cy="44" r={r} fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 44 44)"
      />
      <text x="44" y="49" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 text-lg font-bold" style={{ fontSize: '18px' }}>
        {pct}%
      </text>
    </svg>
  );
}

function BandDonut({ counts }: { counts: { band: Band; count: number }[] }) {
  const total = counts.reduce((s, c) => s + c.count, 0);
  if (total === 0) return <p className="text-sm text-slate-400">No graded papers yet.</p>;
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={counts} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="count" stroke="none">
            {counts.map(c => (
              <Cell key={c.band} fill={BAND_HEX[c.band]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value, _name, entry) => [value, BAND_LABELS[(entry?.payload as { band: Band }).band]]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-1">
        {counts.map(c => (
          <span key={c.band} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: BAND_HEX[c.band] }} />
            {BAND_LABELS[c.band]} ({c.count})
          </span>
        ))}
      </div>
    </div>
  );
}

function CriteriaRadar({ criteria }: { criteria: { code: string; name: string; avgPct: number }[] }) {
  if (criteria.length === 0) return <p className="text-sm text-slate-400">No criterion-based scoring for this coursework type.</p>;
  const data = criteria.map(c => ({ subject: c.code, fullName: c.name, value: Math.round(c.avgPct * 100) }));
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#cbd5e1" strokeOpacity={0.4} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickCount={5} />
          <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={value => [`${value}%`, 'Average']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StudentBar({ scores }: { scores: { studentName: string; pct: number; band: Band }[] }) {
  const data = scores.map(s => ({ name: s.studentName, pct: Math.round(s.pct * 100), band: s.band }));
  const height = Math.max(240, data.length * 32);
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={value => [`${value}%`, 'Score']}
            cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((d, i) => (
              <Cell key={i} fill={BAND_HEX[d.band]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuestionBar({ questions }: { questions: { number: number; avgPct: number; band: Band }[] }) {
  if (questions.length === 0) return <p className="text-sm text-slate-400">This coursework type has no per-question breakdown.</p>;
  const data = questions.map(q => ({ name: `Q${q.number}`, pct: Math.round(q.avgPct * 100), band: q.band }));
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={8} />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={value => [`${value}%`, 'Class average']}
            cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((d, i) => (
              <Cell key={i} fill={BAND_HEX[d.band]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuestionTrend({ questions }: { questions: { number: number; avgPct: number }[] }) {
  if (questions.length === 0) return <p className="text-sm text-slate-400">This coursework type has no per-question breakdown.</p>;
  const data = questions.map(q => ({ name: `Q${q.number}`, pct: Math.round(q.avgPct * 100) }));
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={8} />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={value => [`${value}%`, 'Class average']}
          />
          <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Heatmap({ data }: { data: ReturnType<typeof getHeatmapData> }) {
  if (data.students.length === 0 || data.questionNumbers.length === 0) {
    return <p className="text-sm text-slate-400">This coursework type has no per-question breakdown to map.</p>;
  }
  const cellByKey = new Map(data.cells.map(c => [`${c.studentId}:${c.questionNumber}`, c.pct]));
  const colorFor = (pct: number | null) => {
    if (pct === null) return 'bg-slate-50 dark:bg-zinc-900';
    if (pct >= 0.7) return 'bg-emerald-500/80';
    if (pct >= 0.4) return 'bg-amber-400/80';
    return 'bg-red-500/70';
  };
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white dark:bg-zinc-900 p-2 text-left text-xs font-medium text-slate-500 min-w-[140px]">Student</th>
            {data.questionNumbers.map(qn => (
              <th key={qn} className="p-2 text-xs font-medium text-slate-500 min-w-[44px]">Q{qn}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.students.map(s => (
            <tr key={s.studentId}>
              <td className="sticky left-0 bg-white dark:bg-zinc-900 p-2 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">{s.studentName}</td>
              {data.questionNumbers.map(qn => {
                const pct = cellByKey.get(`${s.studentId}:${qn}`) ?? null;
                return (
                  <td key={qn} className="p-1">
                    <div
                      title={pct === null ? 'No data' : `${Math.round(pct * 100)}%`}
                      className={`w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${colorFor(pct)}`}
                    >
                      {pct !== null ? Math.round(pct * 100) : ''}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
