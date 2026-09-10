import PageHeader from "@/components/ui/PageHeader";
import AIToolCard from "@/components/ai/AIToolCard";
import { getSession } from "@/lib/session";
import { getStudentProgramme } from "@/lib/students/programme";
import {
  Map, CalendarRange, Sparkles, BookOpen, Trophy, MessageSquare, Target,
  GaugeCircle, ClipboardCheck, NotebookPen, FileQuestion, Mic, AlarmClock, Award, Landmark,
} from "lucide-react";

type Tool = {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  /** What an MYP student sees instead, where the DP wording would not apply to them. */
  myp?: { title?: string; description: string };
};

const tools: Tool[] = [
  { href: "/student/learning-gap", icon: <Map size={18} />, title: "Learning Gap Map", description: "See which sub-topics you're weakest on after each assessment." },
  { href: "/student/study-plan", icon: <CalendarRange size={18} />, title: "AI Study Plan", description: "A personalized weekly study schedule built around your deadlines." },
  { href: "/student/grade-forecast", icon: <Sparkles size={18} />, title: "Predictive Grade Forecast", description: "Projects your final IB subject grades from this term's trend.", myp: { description: "Projects your MYP subject grades from your criterion levels." } },
  { href: "/student/library/recommender", icon: <BookOpen size={18} />, title: "Reading Level Recommender", description: "Books matched to your reading level and current coursework." },
  { href: "/student/activities-ai", icon: <Trophy size={18} />, title: "Activity Recommender", description: "Clubs and CAS opportunities matched to your strengths.", myp: { description: "Clubs and Service as Action opportunities matched to your strengths." } },
  { href: "/student/exam-readiness", icon: <GaugeCircle size={18} />, title: "Exam Readiness Index", description: "Scores how ready you are for each upcoming exam, subject by subject.", myp: { description: "How ready you are for unit assessments and the May eAssessment." } },
  { href: "/student/ia-feedback", icon: <ClipboardCheck size={18} />, title: "IA Feedback Assistant", description: "Formative feedback on your internal assessment draft, criterion by criterion.", myp: { title: "Personal Project Feedback", description: "Formative feedback on your Personal Project report, criterion by criterion." } },
  { href: "/student/revision-generator", icon: <NotebookPen size={18} />, title: "Concept Revision Generator", description: "Turns your weakest topics into a condensed revision sheet." },
  { href: "/student/question-papers", icon: <FileQuestion size={18} />, title: "Question Paper Generator", description: "IB-style practice papers with a mark scheme, for timed practice.", myp: { description: "Criterion-based practice tasks with a mark scheme, for timed practice." } },
  { href: "/student/oral-simulator", icon: <Mic size={18} />, title: "Oral Exam Simulator", description: "A mock individual oral with examiner-style follow-up questions.", myp: { description: "A mock Spanish speaking task with teacher-style follow-up questions." } },
  { href: "/student/deadline-risk", icon: <AlarmClock size={18} />, title: "Deadline Risk Monitor", description: "Flags the deadlines you are most likely to miss, and why." },
  { href: "/student/scholarships", icon: <Award size={18} />, title: "Scholarship Matcher", description: "Scholarships you would actually be eligible for, ranked by fit.", myp: { title: "Opportunity Matcher", description: "Competitions and programmes you can enter now, ranked by fit." } },
  { href: "/student/university-fit", icon: <Landmark size={18} />, title: "University Fit Analyzer", description: "Maps your predicted grades onto realistic university offers.", myp: { title: "DP Subject Planner", description: "Which DP subject choices keep your options open." } },
  { href: "/student/tutor", icon: <MessageSquare size={18} />, title: "AI Tutor", description: "Ask questions and get help on any subject." },
  { href: "/student/career-ai", icon: <Target size={18} />, title: "Career AI", description: "Explore university and career pathways suited to you.", myp: { description: "Explore pathways, and the DP subjects that keep them open." } },
];

export default async function StudentAIToolsHub() {
  const session = await getSession();
  const programme = session ? await getStudentProgramme(session.user.id) : "DP";
  const visible = tools.map(({ myp, ...t }) =>
    programme === "MYP" && myp ? { ...t, title: myp.title ?? t.title, description: myp.description } : t,
  );

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="AI Tools"
        description={
          programme === "MYP"
            ? "Personalized AI tools to help you study, plan and grow — built around the MYP."
            : "Personalized AI tools to help you study, plan and grow — built around the IB Diploma."
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((t, i) => <AIToolCard key={i} {...t} />)}
      </div>
    </div>
  );
}
