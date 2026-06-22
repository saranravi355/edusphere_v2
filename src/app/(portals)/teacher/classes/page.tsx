import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Classes" 
        description="View and manage the classes you are assigned to teach."
      />
      <EmptyState 
        icon={Users} 
        title="Class Directory" 
        description="Detailed class view is coming in the next update." 
      />
    </div>
  );
}
