import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import ExportButton from "@/components/data/ExportButton";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Plus, Trash2, IndianRupee } from "lucide-react";

export const dynamic = "force-dynamic";

const BANDS = ["Toddler", "PREKG-LKG", "UKG", "1-5", "6-8", "9", "10", "General"];
const BAND_LABEL: Record<string, string> = {
  "Toddler": "Toddler (Day Boarder)",
  "PREKG-LKG": "Pre-KG – LKG",
  "UKG": "UKG",
  "1-5": "Grade 1 – 5",
  "6-8": "Grade 6 – 8",
  "9": "Grade 9",
  "10": "Grade 10",
  "General": "General / Optional add-ons",
};
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

async function createFeeItem(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) return;
  const gradeBand = String(formData.get("gradeBand") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const amount = parseFloat(String(formData.get("amount") || ""));
  const installments = parseInt(String(formData.get("installments") || "1")) || 1;
  const academicYear = String(formData.get("academicYear") || "2025-26").trim();
  const mandatory = formData.get("mandatory") === "on";
  const notes = String(formData.get("notes") || "").trim() || null;
  if (!gradeBand || !category || isNaN(amount)) return;
  await prisma.feeItem.create({ data: { gradeBand, category, amount, installments, academicYear, mandatory, notes } });
  revalidatePath("/admin/fees");
}

async function deleteFeeItem(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) return;
  const id = String(formData.get("id") || "");
  if (id) await prisma.feeItem.delete({ where: { id } });
  revalidatePath("/admin/fees");
}

export default async function FeesPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const items = await prisma.feeItem.findMany({ orderBy: [{ gradeBand: "asc" }, { createdAt: "asc" }] });
  const year = items[0]?.academicYear ?? "2025-26";

  const byBand: Record<string, typeof items> = {};
  for (const b of BANDS) byBand[b] = [];
  for (const it of items) (byBand[it.gradeBand] ??= []).push(it);

  const exportRows = items.map((it) => ({
    GradeBand: BAND_LABEL[it.gradeBand] || it.gradeBand,
    Category: it.category,
    PerTerm: Math.round(it.amount),
    Installments: it.installments,
    Total: Math.round(it.amount * it.installments),
    Mandatory: it.mandatory ? "Yes" : "Optional",
    AcademicYear: it.academicYear,
    Notes: it.notes || "",
  }));

  const field = "w-full p-2 border border-border rounded-md bg-card text-foreground text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Fee Loader"
        description={`Set up the term fee structure per grade band for academic year ${year}. Amounts are per installment; totals multiply by the number of terms.`}
        action={<ExportButton rows={exportRows} filename={`fee-structure-${year}`} label="Export schedule" />}
      />

      {/* Add fee item */}
      <form action={createFeeItem} className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <h3 className="font-heading text-base text-foreground mb-3 flex items-center gap-2"><Plus size={16} /> Add a fee item</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Grade band</label>
            <select name="gradeBand" required className={field} defaultValue="1-5">
              {BANDS.map((b) => <option key={b} value={b}>{BAND_LABEL[b]}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
            <input name="category" required placeholder="e.g. Tuition, Annual Material, Bus" className={field} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Amount / term (₹)</label>
            <input name="amount" type="number" step="1" required placeholder="79000" className={field} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Installments</label>
            <input name="installments" type="number" min="1" defaultValue={3} className={field} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Academic year</label>
            <input name="academicYear" defaultValue={year} className={field} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="mandatory" defaultChecked className="accent-primary" /> Mandatory fee
          </label>
          <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium">Add fee item</button>
        </div>
      </form>

      {/* Fee structure by grade band */}
      {BANDS.filter((b) => byBand[b] && byBand[b].length > 0).map((b) => {
        const list = byBand[b];
        const mandatoryTotal = list.filter((i) => i.mandatory).reduce((s, i) => s + i.amount * i.installments, 0);
        return (
          <div key={b} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-heading text-base text-foreground">{BAND_LABEL[b]}</h3>
              {b !== "General" && (
                <span className="text-sm text-muted-foreground">
                  Mandatory annual: <span className="font-semibold text-foreground">{inr(mandatoryTotal)}</span>
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">Category</th>
                    <th className="text-right font-medium px-4 py-2">Per term</th>
                    <th className="text-center font-medium px-4 py-2">Terms</th>
                    <th className="text-right font-medium px-4 py-2">Total</th>
                    <th className="text-left font-medium px-4 py-2">Type</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((it) => (
                    <tr key={it.id} className="border-t border-border">
                      <td className="px-4 py-2 text-foreground">
                        {it.category}
                        {it.notes && <span className="block text-[11px] text-muted-foreground">{it.notes}</span>}
                      </td>
                      <td className="px-4 py-2 text-right text-foreground">{inr(it.amount)}</td>
                      <td className="px-4 py-2 text-center text-muted-foreground">× {it.installments}</td>
                      <td className="px-4 py-2 text-right font-semibold text-foreground">{inr(it.amount * it.installments)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${it.mandatory ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300"}`}>
                          {it.mandatory ? "Mandatory" : "Optional"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <form action={deleteFeeItem}>
                          <input type="hidden" name="id" value={it.id} />
                          <button type="submit" title="Remove" className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
          <IndianRupee className="mx-auto mb-3 text-slate-400" size={28} />
          <p className="text-sm">No fee items yet. Add your first fee item above.</p>
        </div>
      )}
    </div>
  );
}
