import PageHeader from "@/components/ui/PageHeader";
import AIToolCard from "@/components/ai/AIToolCard";
import {
  Map, CalendarRange, Sparkles, BookOpen, Trophy, MessageSquare, Target,
  GaugeCircle, ClipboardCheck, NotebookPen, FileQuestion, Mic, AlarmClock, Award, Landmark,
} from "lucide-react";

const tools = [
  { href: "/student/learning-gap", icon: <Map size={18} />, title: "Learning Gap Map", description: "See which sub-topics you're weakest on after each assessment." },
  { href: "/student/study-plan", icon: <CalendarRange size={18} />, title: "AI Study Plan", description: "A personalized weekly study schedule built around your deadlines." },
  { href: "/student/grade-forecast", icon: <Sparkles size={18} />, title: "Predictive Grade Forecast", description: "Projects your final IB subject grades from this term's trend." },
  { href: "/student/library/recommender", icon: <BookOpen size={18} />, title: "Reading Level Recommender", description: "Books matched to your reading level and current coursework." },
  { href: "/student/activities-ai", icon: <Trophy size={18} />, title: "Activity Recommender", description: "Clubs and CAS opportunities matched to your strengths." },
  { href: "/student/exam-readiness", icon: <GaugeCircle size={18} />, title: "Exam Readiness Index", description: "Scores how ready you are for each upcoming exam, subject by subject." },
  { href: "/student/ia-feedback", icon: <ClipboardCheck size={18} />, title: "IA Feedback Assistant", description: "Formative feedback on your internal assessment draft, criterion by criterion." },
  { href: "/student/revision-generator", icon: <NotebookPen size={18} />, title: "Concept Revision Generator", description: "Turns your weakest topics into a condensed revision sheet." },
  { href: "/student/question-papers", icon: <FileQuestion size={18} />, title: "Question Paper Generator", description: "IB-style practice papers with a mark scheme, for timed practice." },
  { href: "/student/oral-simulator", icon: <Mic size={18} />, title: "Oral Exam Simulator", description: "A mock individual oral with examiner-style follow-up questions." },
  { href: "/student/deadline-risk", icon: <AlarmClock size={18} />, title: "Deadline Risk Monitor", description: "Flags the deadlines you are most likely to miss, and why." },
  { href: "/student/scholarships", icon: <Award size={18} />, title: "Scholarship Matcher", description: "Scholarships you would actually be eligible for, ranked by fit." },
  { href: "/student/university-fit", icon: <Landmark size={18} />, title: "University Fit Analyzer", description: "Maps your predicted grades onto realistic university offers." },
  { href: "/student/tutor", icon: <MessageSquare size={18} />, title: "AI Tutor", description: "Ask questions and get help on any subject.", badge: "Existing" },
  { href: "/student/career-ai", icon: <Target size={18} />, title: "Career AI", description: "Explore university and career pathways suited to you.", badge: "Existing" },
];

export default function StudentAIToolsHub() {
  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="AI Tools"
        description="Personalized AI tools to help you study, plan and grow — built around the IB Diploma and MYP."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t, i) => <AIToolCard key={i} {...t} />)}
      </div>
    </div>
  );
}
