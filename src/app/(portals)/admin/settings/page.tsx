import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Platform Settings" 
        description="Global configurations, integrations, and access control."
      />
      <EmptyState 
        icon={Settings} 
        title="Settings Locked" 
        description="Global configuration is locked in this demo environment." 
      />
    </div>
  );
}
