"use client";

import { Sparkles, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAction {
  label: string;
  prompt: string;
  response: string;
}

interface Persona {
  name: string;
  greeting: string;
  actions: QuickAction[];
  fallback: string;
}

const ADMIN_PERSONA: Persona = {
  name: "Platform AI",
  greeting: "Welcome back. Pick a quick analysis below, or ask me anything about the school.",
  actions: [
    {
      label: "School Health Score",
      prompt: "Run the School Health Score",
      response:
        "School Health Score: 87 / 100 (↑ 2 vs last week)\n\n• Academics 91 — DP predicted grades stable, MYP criterion averages up 0.3\n• Attendance 88 — two classes below 90% this week (MYP 3B, DP 1A)\n• Wellbeing 82 — 3 open pastoral flags, all assigned\n• Finance 86 — fee collection at 94% of term target\n\nBiggest lever: closing the MYP 3B attendance dip would add ~2 points.",
    },
    {
      label: "Sentiment Scan",
      prompt: "Scan teacher notes for sentiment flags",
      response:
        "Sentiment NLP scan complete — 214 notes analysed from the last 14 days.\n\n⚠ 1 critical flag: repeated disengagement language for a DP 1 student (score 0.88) — routed to the pastoral lead.\n◦ 2 watch flags: declining tone trends in MYP 4 Sciences and PYP 5.\n\nOverall staff-note sentiment: 78% positive, trending stable.",
    },
    {
      label: "Fee Default Forecast",
      prompt: "Predict likely fee defaults this month",
      response:
        "Fee Payment Predictor — July cycle:\n\n• 6 families show a high default likelihood (>70%), totalling ₹4.2L exposure\n• 11 families medium likelihood — a reminder nudge historically recovers ~60% of these\n• Suggested action: send the soft-reminder template today; escalate the 6 high-risk cases to the finance officer with a payment-plan offer.",
    },
    {
      label: "Teacher Workload Check",
      prompt: "Check teacher workload balance",
      response:
        "Workload scan across 24 timetables:\n\n⚠ 2 teachers above the 26-period weekly threshold (Meena Krishnan 29, Rajesh Kumar 27)\n• 3 teachers under 18 periods with matching subject qualifications\n\nSuggested rebalance: move 2 MYP Science sections — this clears both overloads without touching DP classes. Want the substitution plan?",
    },
    {
      label: "Enrolment Snapshot",
      prompt: "Give me an enrolment snapshot",
      response:
        "Enrolment snapshot:\n\n• 173 students enrolled — 56 PYP / 39 MYP / 71 DP (+7 other curricula)\n• 4 admissions in pipeline, 2 withdrawal requests pending review\n• Projected AY 2026-27 intake: ~187 (+8%), strongest in MYP\n\nCapacity check: DP remains within 2-section capacity next year.",
    },
  ],
  fallback:
    "I've scanned the latest school data for that. Headline: metrics are stable week-on-week — try one of the quick analyses below for a deeper cut, or refine your question.",
};

const TEACHER_PERSONA: Persona = {
  name: "Teaching Coach AI",
  greeting: "Hello! I can draft plans, quizzes and parent updates, or scan your classes. Pick one below.",
  actions: [
    {
      label: "Draft Lesson Plan",
      prompt: "Draft a lesson plan for my next class",
      response:
        "Lesson plan draft — MYP 4 Sciences, 60 min (Inquiry: energy transfer):\n\n1. Hook (5 min): thermal camera photo — 'where is the energy going?'\n2. Inquiry rotation (20 min): 3 station experiments, ATL focus: data collection\n3. Consolidate (15 min): groups build a Sankey diagram of their station\n4. Criterion check (15 min): 2 Criterion B practice prompts, peer-marked\n5. Exit ticket (5 min): one misconception + one question\n\nDifferentiation: sentence starters at station 2; extension data set for early finishers.",
    },
    {
      label: "Generate Quiz Questions",
      prompt: "Generate quiz questions on my current topic",
      response:
        "5-question formative quiz (MYP 4, energy transfer):\n\n1. MCQ: Which process transfers energy without particles? (radiation ✓)\n2. MCQ: A 60W bulb runs 2 min — energy transferred? (7,200 J ✓)\n3. Short: Explain why metal feels colder than wood at room temperature.\n4. Data: Given the cooling curve, estimate the rate at t=3 min.\n5. Extended: Evaluate two home-insulation options using conduction/convection.\n\nWant these pushed to the Quiz builder with a mark scheme?",
    },
    {
      label: "Grading Curve Advice",
      prompt: "Should I curve my latest assessment?",
      response:
        "Latest assessment analysis (Criterion-referenced check):\n\n• Class average 74.2%, median 71% — distribution slightly left-skewed\n• IB best-fit: boundaries look fair; a blanket curve isn't recommended for criterion-based marking\n• Instead: Q4 had a 38% success rate — likely an instruction clarity issue. Consider discounting it or reteaching before the summative.\n\nThat single change lifts the median to a solid 5 on the 1–7 scale.",
    },
    {
      label: "At-Risk Students",
      prompt: "Who in my classes needs attention?",
      response:
        "Scan of your classes (attendance × grade trend × wellbeing):\n\n⚠ 1 student trending down 2 grade bands in 4 weeks — recommend a check-in this week\n◦ 2 students with active IEPs have assessments Friday — confirm extra-time accommodation is booked\n◦ 1 student's attendance dipped below 85% — pattern is Monday absences\n\nFull details are in your IEP tab and the Directory risk view.",
    },
    {
      label: "Write Parent Update",
      prompt: "Draft a parent update message",
      response:
        "Draft — positive progress update:\n\n\"Dear parent, a quick note from this week: your child showed strong progress in our energy-transfer unit, particularly in practical data collection (an ATL focus this term). Next week we begin summative preparation — a short revision checklist is on the portal. Please encourage 20 minutes of review on Tuesday and Thursday. Warm regards.\"\n\nTweak the tone or make it about a specific student?",
    },
  ],
  fallback:
    "Here's my read: your classes are on track overall. The class average sits at 74.2% and no new incidents were logged today. Try a quick action below for something specific.",
};

const PARENT_PERSONA: Persona = {
  name: "Parent Assistant",
  greeting: "Hi there! Ask me about your child's day, or tap a quick question below.",
  actions: [
    {
      label: "Bus ETA",
      prompt: "Where is the school bus?",
      response:
        "Route 04 is running on time. 🚌\n\n• Current position: 3 stops away\n• ETA at your stop: ~12 minutes\n• Driver: verified, speed normal\n\nYou'll get a ping when it's 2 stops out. Live map is under Live Tracker.",
    },
    {
      label: "Latest Grades",
      prompt: "Show my child's latest grades",
      response:
        "Latest assessment results:\n\n• Sciences — 6/7 (Criterion B & C, up from 5)\n• Mathematics — 5/7 (steady)\n• Language & Literature — 6/7\n• Individuals & Societies — 5/7 (new unit started)\n\nTeacher comment highlights strong practical work this term. Full breakdown is in the Gradebook.",
    },
    {
      label: "Attendance This Month",
      prompt: "How is attendance this month?",
      response:
        "Attendance for July:\n\n• Present 9 of 10 school days (90%)\n• 1 absence on 6 July — recorded as excused (medical note received)\n• No late arrivals\n\nTerm average stands at 94%. Nothing needs your action.",
    },
    {
      label: "Upcoming Events",
      prompt: "What's coming up at school?",
      response:
        "Coming up:\n\n• Wed 16 Jul — MYP Science fair (parents welcome, 14:00)\n• Fri 18 Jul — Unit test: Mathematics\n• Tue 22 Jul — Parent-teacher meetings open for booking (slots via Meetings tab)\n• Fri 25 Jul — CAS showcase evening\n\nWant me to note the PTM booking reminder?",
    },
    {
      label: "Fee Status",
      prompt: "Any fees due?",
      response:
        "Fee account status:\n\n• Term 2 tuition: paid in full ✓\n• Transport (Q3): ₹8,500 due by 31 July\n• No late fees on the account\n\nYou can pay from the Fees tab — UPI and card are both enabled.",
    },
  ],
  fallback:
    "I checked the latest records — everything looks normal today: attendance marked present and no new notices. The quick questions below cover the most common things parents ask.",
};

const STUDENT_PERSONA: Persona = {
  name: "Study Buddy AI",
  greeting: "Hey! 👋 Need a study plan, help with a topic, or your week at a glance? Tap below.",
  actions: [
    {
      label: "Make a Study Plan",
      prompt: "Make me a study plan for this week",
      response:
        "Your week, planned around Friday's Maths test:\n\n• Mon: Maths — functions practice set (40 min) + flashcard review (10 min)\n• Tue: Sciences homework due Wed — finish tonight (30 min)\n• Wed: Maths past questions (40 min), mark yourself with the scheme\n• Thu: light review only — weak spots from Wednesday (25 min) + early night\n• Fri: test day — 10-min formula skim at breakfast, then trust your prep 💪",
    },
    {
      label: "Explain a Topic",
      prompt: "Explain my trickiest current topic",
      response:
        "Quadratic functions — the 60-second version:\n\nA quadratic is just a parabola: y = ax² + bx + c.\n• a decides the shape: positive = smile, negative = frown\n• c is where it crosses the y-axis\n• The turning point sits at x = -b/2a — that one formula answers half of all exam questions\n\nTry this: sketch y = x² - 4x + 3. Roots at 1 and 3, turning point at (2, -1). Want a harder one?",
    },
    {
      label: "What's Due This Week",
      prompt: "What do I have due this week?",
      response:
        "Your deadlines:\n\n• Wed: Sciences lab write-up (submit on portal before 08:00)\n• Thu: Language & Lit reading journal — 2 entries\n• Fri: Mathematics unit test (functions & graphs)\n• Ongoing: CAS reflection due end of month — 10 minutes now saves the panic later\n\nTightest one is the lab write-up. Start there.",
    },
    {
      label: "Exam Countdown",
      prompt: "How should I prep for my next exam?",
      response:
        "Maths test: 4 days out. Countdown plan:\n\n• D-4 (today): list the 5 topic areas, rate each 1-5 confidence\n• D-3: attack your two lowest-rated topics with worked examples\n• D-2: full past paper under timed conditions\n• D-1: review only the questions you got wrong — nothing new\n• Test day: formulas at breakfast, no cramming after that\n\nRule of thumb: practice questions beat re-reading notes 3-to-1.",
    },
    {
      label: "Book Recommendation",
      prompt: "Recommend me a library book",
      response:
        "Based on your reading level and recent checkouts:\n\n1. \"The Martian\" — Andy Weir: science + survival + humour, matches your Group 4 interests\n2. \"Flowers for Algernon\" — short, powerful, great for your reading journal\n3. \"A Short History of Nearly Everything\" — Bryson: dip-in chapters, perfect between assignments\n\nAll three are on shelf in the library right now. Want me to reserve one?",
    },
  ],
  fallback:
    "Quick check of your dashboard: nothing overdue right now, and your next deadline is the Sciences lab write-up on Wednesday. Tap an option below if you want a plan or an explainer.",
};

function getPersona(role: string): Persona {
  if (role === "CLASS_TEACHER" || role === "SUBJECT_TEACHER") return TEACHER_PERSONA;
  if (role === "PARENT") return PARENT_PERSONA;
  if (role === "STUDENT") return STUDENT_PERSONA;
  return ADMIN_PERSONA;
}

export default function AIAssistant({ role }: { role: string }) {
  const persona = getPersona(role);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", content: persona.greeting }]);

  function reply(userText: string, botText: string) {
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "bot", content: botText }]);
    }, 1400);
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || typing) return;
    const q = query;
    setQuery("");
    reply(q, persona.fallback);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl shadow-indigo-600/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50 group ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 w-80 sm:w-[420px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col h-[560px]"
          >
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className="font-bold text-sm">{persona.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20">PREVIEW</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">✕</button>
            </div>

            <div className="flex-1 p-4 bg-slate-50 dark:bg-black/20 flex flex-col overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 rounded-2xl rounded-bl-sm p-3 shadow-sm flex items-center gap-2 text-sm">
                    <Loader2 size={14} className="animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Role-specific quick actions */}
            <div className="px-3 pt-2 pb-1 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap gap-1.5">
              {persona.actions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => reply(a.prompt, a.response)}
                  disabled={typing}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70 transition-colors disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full text-sm bg-slate-100 dark:bg-zinc-800 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-black rounded-xl pl-4 pr-10 py-2.5 outline-none transition-all text-slate-800 dark:text-slate-100"
                />
                <button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
