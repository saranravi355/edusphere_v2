"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: string;
  points: number;
  options: string[] | null;
}

interface ExamTakingClientProps {
  examTitle: string;
  examType: string;
  subjectName?: string | null;
  timeLimitMinutes: number | null;
  questions: Question[];
  submitAction: (formData: FormData) => Promise<void>;
}

export default function ExamTakingClient({
  examTitle,
  examType,
  subjectName,
  timeLimitMinutes,
  questions,
  submitAction,
}: ExamTakingClientProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes ? timeLimitMinutes * 60 : null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  const doSubmit = useCallback((autoSubmitted: boolean) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const formData = new FormData();
    formData.set("autoSubmitted", autoSubmitted ? "true" : "false");
    Object.entries(answers).forEach(([qId, val]) => formData.set(`q_${qId}`, val));
    startTransition(() => {
      submitAction(formData);
    });
  }, [answers, submitAction]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      doSubmit(true);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, doSubmit]);

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : null;
  const isUrgent = secondsLeft !== null && secondsLeft < 60;

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 py-4 mb-6 -mx-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-navy-900 dark:text-white">{examTitle}</h1>
            <p className="text-xs text-slate-500">{subjectName ? `${subjectName} - ` : ""}{examType.replace("_", " ")} - {questions.length} questions</p>
          </div>
          {secondsLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${isUrgent ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}>
              <Clock size={18} />
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          )}
        </div>
        {isUrgent && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertTriangle size={12} /> Less than a minute left. Your exam will auto-submit when time runs out.
          </p>
        )}
      </div>

      <form ref={formRef} className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
              {i + 1}. {q.text} <span className="text-xs font-normal text-slate-400">({q.points} pts)</span>
            </p>

            {q.type === "MCQ" && q.options ? (
              <div className="space-y-2">
                {q.options.map((opt, idx) => (
                  <label key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === String(idx) ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={idx}
                      checked={answers[q.id] === String(idx)}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: String(idx) }))}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                rows={4}
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Write your answer..."
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
              />
            )}
          </div>
        ))}
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 p-4 flex justify-center">
        <button
          type="button"
          disabled={isPending}
          onClick={() => doSubmit(false)}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-60"
        >
          {isPending ? "Submitting..." : "Submit Exam"}
        </button>
      </div>
    </div>
  );
}
