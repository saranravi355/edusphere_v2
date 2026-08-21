import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import ExportButton from "@/components/data/ExportButton";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Monitor, CheckCircle2, Wrench, PackageOpen, Undo2 } from "lucide-react";
import AssetControls from "./AssetControls";
import { returnAsset } from "./actions";
import { ConfirmIconButton } from "@/components/ui/form";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CHECKED_OUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  MAINTENANCE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default async function AssetsPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  /*
   * Asset and AssetCheckout have been in the schema from the beginning and this
   * page rendered them faithfully — but there was no way to add an asset, no
   * way to lend one out and no way to take one back, so the only rows that
   * could ever exist were the ones the seed script created.
   */
  const [assets, people, loans] = await Promise.all([
    prisma.asset.findMany({
      orderBy: [{ category: "asc" }, { serialNo: "asc" }],
      include: { checkouts: { where: { status: "ACTIVE" }, include: { user: { select: { name: true } } }, take: 1 } },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "PRINCIPAL", "CLASS_TEACHER", "SUBJECT_TEACHER"] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.assetCheckout.findMany({
      where: { status: "ACTIVE" },
      include: { asset: { select: { name: true } }, user: { select: { name: true } } },
      orderBy: { checkoutDate: "desc" },
    }),
  ]);
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
        action={
          <div className="flex flex-wrap gap-2 items-center">
            <AssetControls
              available={assets.filter((a) => a.status === "AVAILABLE").map((a) => ({ id: a.id, name: a.name, serialNo: a.serialNo }))}
              people={people}
            />
            <ExportButton rows={exportRows} filename="asset-inventory" label="Export inventory" />
          </div>
        }
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
                <th className="text-left font-medium px-5 py-2.5">With</th>
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
                  <td className="px-5 py-2.5 text-muted-foreground text-xs">
                    {a.checkouts[0] ? a.checkouts[0].user.name : "—"}
                  </td>
                </tr>
              ))}
              {assets.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No assets recorded. Use “New asset” to add the first one.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-heading text-base text-foreground">Currently out ({loans.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Asset</th>
                <th className="text-left font-medium px-5 py-2.5">Issued to</th>
                <th className="text-left font-medium px-5 py-2.5">Since</th>
                <th className="text-right font-medium px-5 py-2.5">Return</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-5 py-2.5 text-foreground">{l.asset.name}</td>
                  <td className="px-5 py-2.5 text-muted-foreground">{l.user.name}</td>
                  <td className="px-5 py-2.5 text-muted-foreground">{formatDate(l.checkoutDate, "dMonYy")}</td>
                  <td className="px-5 py-2.5 text-right">
                    <ConfirmIconButton
                      onConfirm={async () => { "use server"; return returnAsset(l.id); }}
                      question="Mark as returned?"
                      confirmLabel="Returned"
                      triggerLabel={`Mark ${l.asset.name} returned`}
                      triggerClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Undo2 size={13} aria-hidden /> Return
                    </ConfirmIconButton>
                  </td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Nothing is out at the moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
