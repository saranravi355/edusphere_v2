import PageHeader from "@/components/ui/PageHeader";
import AIToolCard from "@/components/ai/AIToolCard";
import { Lightbulb, ListChecks, FileEdit, ScanLine, BrainCircuit } from "lucide-react";

const tools = [
  { href: "/teacher/ai-coach", icon: <Lightbulb size={18} />, title: "AI Coaching Nudges", description: "Weekly teaching insights from your gradebook, ATL and CAS records." },
  { href: "/teacher/quizzes/ai-generator", icon: <ListChecks size={18} />, title: "AI Question Bank Generator", description: "Generates IB-style questions mapped to assessment objectives." },
  { href: "/teacher/assignments/ai-feedback", icon: <FileEdit size={18} />, title: "Smart Homework Feedback", description: "Drafts criterion-referenced feedback for you to review and approve." },
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
        {tools.map((t, i) => <AIToolCar