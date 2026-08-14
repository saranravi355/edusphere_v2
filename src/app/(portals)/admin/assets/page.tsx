import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import ExportButton from "@/components/data/ExportButton";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Monitor, CheckCircle2, Wrench, PackageOpen } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CHECKED_OUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  MAINTENANCE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default async function AssetsPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const assets = await prisma.asset.findMany({ orderBy: [{ category: "asc" }, { serialNo: "asc" }] });
  const total = assets.length;
  const available = assets.filter((a) => a.status === "AVAILABLE").length;
  const checkedOut = assets.filter((a) => a.status === "CHECKED_OUT").length;
  const maintenance = assets.filter((a) => a.status === "MAINTENANCE").length;

  const exportRows = assets.map((a) => ({ Name: a.name, Category: a.category, SerialNo: a.serialNo, Status: a.status.replace("_", " ") }));

  const stats = [
    { label: "Total assets", value: total, icon: Monitor, color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300" },
    { label: "Available", value: available, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { label: "Checked out", value: checkedOut, icon: PackageOpen, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    { label: "In maintenance", value: maintenance, icon: Wrench, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="IT & Asset Management"
        description="Track school devices, lab equipment, sports gear and instruments."
        action={<ExportButton rows={exportRows} filename="asset-inventory" label="Export inventory" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-3 ${s.color}`}><s.icon size={20} /></div>
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border"><h3 className="font-heading text-base text-foreground">Asset inventory</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Asset</th>
                <th className="text-left font-medium px-5 py-2.5">Category</th>
                <th className="text-left font-medium px-5 py-2.5">Serial no.</th>
                <th className="text-left font-medium px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-5 py-2.5 text-foreground">{a.name}</td>
                  <td className="px-5 py-2.5 text-muted-foreground">{a.category.replace("_", " ")}</td>
                  <td className="px-5 py-2.5 text-muted-foreground font-mono text-xs">{a.serialNo}</td>
                  <td className="px-5 py-2.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[a.status] || "bg-slate-100 text-slate-600"}`}>
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No assets recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
