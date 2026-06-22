import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Student Reports" 
        description="Generate and review academic performance reports."
      />
      <EmptyState 
        icon={BookOpen} 
        title="Report Generator" 
        description="The AI-powered report generator will be available soon." 
      />
    </div>
  );
}
