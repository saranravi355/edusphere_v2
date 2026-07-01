import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navigation, Bus, ArrowRight } from "lucide-react";

export default async function ParentTransportHubPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') redirect('/');

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Transport"
        description="Track your child's school bus in real time."
      />

      <Link href="/parent/transport/live" className="group block">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
              <Bus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Live Transport Tracker</h3>
              <p className="text-sm text-slate-500 mt-1">Real-time GPS tracking and ETA for your child's bus route.</p>
            </div>
          </div>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all shrink-0 ml-4">
            <Navigation size={14} /> Track <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </div>
  );
}
