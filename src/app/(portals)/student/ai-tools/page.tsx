import PageHeader from "@/components/ui/PageHeader";
import AIToolCard from "@/components/ai/AIToolCard";
import { Map, CalendarRange, Sparkles, BookOpen, Trophy, MessageSquare, Target } from "lucide-react";

const tools = [
  { href: "/student/learning-gap", icon: <Map size={18} />, title: "Learning Gap Map", description: "See which sub-topics you're weakest on after each assessment." },
  { href: "/student/study-plan", icon: <CalendarRange size={18} />, title: "AI Study Plan", description: "A personalized weekly study schedule built around your deadlines." },
  { href: "/student/grade-forecast", icon: <Sparkles size={18} />, title: "Predictive Grade Forecast", description: "Projects your final IB subject grades from this term's trend." },
  { href: "/student/library/recommender", icon: <BookOpen size={18} />, title: "Reading Level Recommender", description: "Books matched to your reading level and current coursework." },
  { href: "/student/activities-ai", icon: <Trophy size={18} />, title: "Activity Recommender", description: "Clubs and CAS opportunities matched to your strengths." },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ga