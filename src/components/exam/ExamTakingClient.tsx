"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { Clock, AlertTriangle, Lock, ShieldCheck, Maximize2, Eye } from "lucide-react";

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

const MAX_VIOLATIONS = 3;

export default function ExamTakingClient({
  examTitle,
  examType,
  subjectName,
  timeLimitMinutes,
  questions,
  submitAction,
}: ExamTakingClientProps) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes ? timeLimitMinutes * 60 : null);
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const submittedRef = useRef(false);
  const startedRef = useRef(false);

  const doSubmit = useCallback(
    (autoSubmitted: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      const formData = new FormData();
      formData.set("autoSubmitted", autoSubmitted ? "true" : "false");
      Object.entries(answers).forEach(([qId, val]) => formData.set(`q_${qId}`, val));
      startTransition(() => {
        submitAction(formData);
      });
    },
    [answers, submitAction]
  );

  // Countdown only once started
  useEffect(() => {
    if (!started || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      doSubmit(true);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(timer);
  }, [started, secondsLeft, doSubmit]);

  const registerViolation = useCallback(
    (reason: string) => {
      if (!startedRef.current || submittedRef.current) return;
      setViolations((v) => {
        const next = v + 1;
        if (next >= MAX_VIOLATIONS) {
          setWarning(`${reason} — violation limit reached. Your exam is being submitted.`);
          doSubmit(true);
        } else {
          setWarning(`${reason} — warning ${next} of ${MAX_VIOLATIONS - 1}. At ${MAX_VIOLATIONS} violations the exam auto-submits.`);
        }
        return next;
      });
    },
    [doSubmit]
  );

  // Lockdown listeners: fullscreen exit, tab switch, copy, right-click
  useEffect(() => {
    if (!started) return;
    startedRef.current = true;

    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) registerViolation("You left full-screen mode");
    };
    const onVisibility = () => {
      if (document.hidden) registerViolation("You switched tabs or minimised the window");
    };
    const onBlock = (e: Event) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      // block common shortcuts: copy/paste/print/find/devtools
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "p", "f", "u", "s"].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === "F12") e.preventDefault();
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("contextmenu", onBlock);
    document.addEventListener("copy", onBlock);
    document.addEventListener("paste", onBlock);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("contextmenu", onBlock);
      document.removeEventListener("copy", onBlock);
      document.removeEventListener("paste", onBlock);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [started, registerViolation]);

  async function begin() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // fullscreen may be blocked; the overlay still locks the UI
    }
    setStarted(true);
  }

  async function reenterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
      setWarning(null);
    } catch {}
  }

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : null;
  const isUrgent = secondsLeft !== null && secondsLeft < 60;
  const answered = Object.keys(answers).length;

  // ── Pre-exam gate ──
  if (!started) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-100 dark:bg-black flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Lock size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{examTitle}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {subjectName ? `${subjectName} · ` : ""}{examType.replace("_", " ")} · {questions.length} questions
              {timeLimitMinutes ? ` · ${timeLimitMinutes} minutes` : " · untimed"}
            </p>
          </div>
          <div className="text-left bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-500" /> Secure exam mode</p>
            <p>• The exam opens in full screen. Navigation, sidebar and other pages are locked until you submit.</p>
            <p>• Copying, pasting and right-click are disabled.</p>
            <p>• Leaving full screen or switching tabs is recorded — after {MAX_VIOLATIONS} violations the exam auto-submits.</p>
            {timeLimitMinutes && <p>• The timer starts as soon as you begin and cannot be paused.</p>}
          </div>
          <button
            onClick={begin}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Maximize2 size={17} /> Enter Full Screen & Begin
          </button>
        </div>
      </div>
    );
  }

  // ── Locked exam view: full-viewport overlay above the app shell ──
  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 dark:bg-black overflow-y-auto select-none">
      {/* Lockdown header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
              <Lock size={14} className="text-blue-600 flex-shrink-0" /> {examTitle}
            </h1>
            <p className="text-[11px] text-slate-500">
              {subjectName ? `${subjectName} · ` : ""}{answered}/{questions.length} answered · secure mode
              {violations > 0 && <span className="text-red-500 font-bold"> · {violations} violation{violations > 1 ? "s" : ""}</span>}
            </p>
          </div>
          {secondsLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg flex-shrink-0 ${isUrgent ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}>
              <Clock size={18} />
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          )}
        </div>
        {warning && (
          <div className="bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900/50 px-4 py-2">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={13} className="flex-shrink-0" /> {warning}
              </p>
              {!isFullscreen && !isPending && (
                <button onClick={reenterFullscreen} className="text-xs font-bold text-red-600 dark:text-red-400 underline whitespace-nowrap flex items-center gap-1">
                  <Maximize2 size={11} /> Return to full screen
                </button>
              )}
            </div>
          </div>
        )}
        {isUrgent && !warning && (
          <div className="max-w-3xl mx-auto px-4 pb-2">
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle size={12} /> Less than a minute left. Your exam will auto-submit when time runs out.
            </p>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-32">
        <form className="space-y-6">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                {i + 1}. {q.text} <span className="text-xs font-normal text-slate-400">({q.points} pts)</span>
              </p>

              {q.type === "MCQ" && q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt, idx) => (
                    <label key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === String(idx) ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/50"}`}>
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
                  className="w-full p-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 text-sm select-text"
                />
              )}
            </div>
          ))}
        </form>
      </div>

      {/* Submit bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-slate-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Eye size={13} /> {answered} of {questions.length} answered
          </p>
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
    </div>
  );
}
