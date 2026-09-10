import PageHeader from "@/components/ui/PageHeader";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Sparkles, Send, Bot } from "lucide-react";
import { firstName } from "@/lib/utils";

/**
 * The tutor's chat window, as a preview.
 *
 * The opening message used to tell every student they had "a Mathematics
 * assignment due tomorrow" — whether or not they did — and offered quadratic
 * equations and spelling practice, primary-school work in a school whose
 * youngest students are in MYP1. The send button posted to an empty server
 * action, so a typed question vanished without a word.
 *
 * Until the tutor answers, the input says so instead of swallowing questions.
 */
const SUGGESTIONS = [
  "What does the command term 'evaluate' ask for?",
  "Explain a concept from this week's lessons",
  "Help me revise for my next assessment",
];

export default async function StudentTutorPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/");
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      <PageHeader
        title="AI Tutor"
        description="Your 24/7 personalized learning assistant."
      />

      <div className="mt-4">
        <AIPreviewNotice>
          The tutor does not answer questions yet — this shows how a conversation would look. Nothing you type here
          is sent.
        </AIPreviewNotice>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col mt-4 overflow-hidden">

        {/* Chat Area */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-slate-50/50 dark:bg-slate-950/50">

          {/* Intro Message */}
          <div className="flex items-start gap-4 max-w-[85%]">
            <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-1">
              <Bot size={18} />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-tl-sm shadow-sm text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              <p>Hi {firstName(session.user.name, "there")}! I&apos;m your EduSphere AI Tutor. <Sparkles className="inline w-4 h-4 text-indigo-500" /></p>
              <p className="mt-2">
                Ask me about a concept in any of your subjects, and I&apos;ll explain it the way your IB subject guide
                frames it — using the command terms your assessments use.
              </p>
            </div>
          </div>

        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="relative flex items-center">
            <input
              type="text"
              disabled
              aria-label="Ask the tutor a question"
              placeholder="The tutor is a preview and does not answer yet"
              className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm disabled:cursor-not-allowed disabled:opacity-70"
            />
            <button
              type="button"
              disabled
              aria-label="Send"
              className="absolute right-2 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled
                className="whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 rounded-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
