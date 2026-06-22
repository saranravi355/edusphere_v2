import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, MapPin, UserCheck, AlertTriangle } from "lucide-react";

export default async function AdminTransportPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) {
    redirect("/");
  }

  const routes = [
    { id: "R01", driver: "John Smith", vehicle: "Bus 12 (Yellow)", status: "On Route", students: 42, delays: "None" },
    { id: "R02", driver: "Sarah Connor", vehicle: "Bus 04 (Blue)", status: "Delayed", students: 38, delays: "15 mins (Traffic)" },
    { id: "R03", driver: "Michael Chang", vehicle: "Van 02 (White)", status: "Completed", students: 12, delays: "None" }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader 
        title="Fleet & Transport Management" 
        description="Monitor school bus routes, driver assignments, and vehicle status."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Bus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Vehicles</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">24 / 26</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Drivers on Duty</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">24</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-red-200 dark:border-red-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Alerts</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">1</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Live Routes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Route ID</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Students onboard</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {routes.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{r.id}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.vehicle}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.driver}</td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{r.students}</td>
                  <td className="px-6 py-4">
                    {r.status === 'On Route' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {r.status}
                      </span>
                    ) : r.status === 'Delayed' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        {r.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {r.status}
                      </span>
                    )}
                    {r.delays !== 'None' && <span className="block text-xs text-red-500 mt-1">{r.delays}</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm flex items-center gap-1 justify-end w-full">
                      <MapPin size={14} /> Track
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
