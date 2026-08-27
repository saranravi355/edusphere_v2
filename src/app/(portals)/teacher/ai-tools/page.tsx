import PageHeader from "@/components/ui/PageHeader";
import AIToolCard from "@/components/ai/AIToolCard";
import {
  Lightbulb, ListChecks, FileEdit, ScanLine, BrainCircuit,
  BookOpenCheck, BarChart3, Activity, ClipboardList, Layers, Search,
} from "lucide-react";

const tools = [
  { href: "/teacher/ai-coach", icon: <Lightbulb size={18} />, title: "AI Coaching Nudges", description: "Weekly teaching insights from your gradebook, ATL and CAS records." },
  { href: "/teacher/quizzes/ai-generator", icon: <ListChecks size={18} />, title: "AI Question Bank Generator", description: "Generates IB-style questions mapped to assessment objectives." },
  { href: "/teacher/assignments/ai-feedback", icon: <FileEdit size={18} />, title: "Smart Homework Feedback", description: "Drafts criterion-referenced feedback for you to review and approve." },
  { href: "/teacher/lesson-copilot", icon: <BookOpenCheck size={18} />, title: "Lesson Plan Co-Pilot", description: "Drafts an IB-aligned lesson plan from the unit guide." },
  { href: "/teacher/rubric-feedback", icon: <ListChecks size={18} />, title: "Rubric Auto-Feedback", description: "Criterion-wise feedback grounded in the IB descriptors." },
  { href: "/teacher/assessment-difficulty", icon: <BarChart3 size={18} />, title: "Assessment Difficulty Analyzer", description: "Shows how hard an assessment turned out to be, question by question." },
  { href: "/teacher/engagement-heatmap", icon: <Activity size={18} />, title: "Class Engagement Heatmap", description: "Surfaces dropping participation before it shows up in a grade." },
  { href: "/teacher/meeting-brief", icon: <ClipboardList size={18} />, title: "Parent Meeting Brief", description: "A one-page brief on a student before you meet their parents." },
  { href: "/teacher/differentiation", icon: <Layers size={18} />, title: "Differentiation Assistant", description: "Adapts one lesson for the range of attainment in the room." },
  { href: "/teacher/curriculum-qa", icon: <Search size={18} />, title: "Curriculum Q&A", description: "Answers from the subject guides, quoting where each came from." },
  { href: "/teacher/grading/ai-grader", icon: <ScanLine size={18} />, title: "AI Grader", description: "Scans and auto-scores submitted homework against the rubric.", badge: "Existing" },
  { href: "/teacher/students", icon: <BrainCircuit size={18} />, title: "Student AI Analysis", description: "Per-student performance and behaviour analysis.", badge: "Existing" },
];

export default function TeacherAIToolsHub() {
  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="AI Tools"
        description="Assistive AI tools for lesson planning, assessment and feedback — built around IB DP/MYP workflows."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t, i) => <AIToolCard key={i} {...t} />)}
      </div>
    </div>
  );
}
