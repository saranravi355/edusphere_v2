import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import ExportButton from "@/components/data/ExportButton";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Plus, Trash2, Leaf, Drumstick, AlertTriangle } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/form";

export const dynamic = "force-dynamic";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MEALS = ["BREAKFAST", "LUNCH", "SNACK"];
const MEAL_LABEL: Record<string, string> = { BREAKFAST: "Breakfast", LUNCH: "Lunch", SNACK: "Snack" };

async function addMenuItem(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) return;
  const dayOfWeek = parseInt(String(formData.get("dayOfWeek") || "1")) || 1;
  const mealType = String(formData.get("mealType") || "LUNCH");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const allergens = String(formData.get("allergens") || "").trim() || null;
  // An unchecked box submits nothing at all, so `!== "off"` was true either
  // way: every dish saved as vegetarian however the box was left.
  const isVeg = formData.get("isVeg") === "on";
  if (!name) return;
  await prisma.menuItem.create({ data: { dayOfWeek, mealType, name, description, allergens, isVeg } });
  revalidatePath("/admin/canteen");
  revalidatePath("/parent/canteen");
}

async function deleteMenuItem(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) return;
  const id = String(formData.get("id") || "");
  if (id) await prisma.menuItem.delete({ where: { id } });
  revalidatePath("/admin/canteen");
  revalidatePath("/parent/canteen");
}

export default async function CanteenPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const items = await prisma.menuItem.findMany({ orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }] });
  const flagged = await prisma.student.findMany({
    where: { OR: [{ allergies: { not: null } }, { flaggedFoods: { not: null } }] },
    include: { classroom: true },
    orderBy: { name: "asc" },
  });
  const menuMap = new Map(items.map((m) => [m.id, m.name]));
  const flaggedNames = (ff: string | null) => (ff || "").split(",").map((x) => x.trim()).filter(Boolean).map((id) => menuMap.get(id)).filter(Boolean) as string[];
  const exportRows = items.map((it) => ({
    Day: DAYS[it.dayOfWeek] || it.dayOfWeek, Meal: MEAL_LABEL[it.mealType] || it.mealType,
    Name: it.name, Type: it.isVeg ? "Veg" : "Non-Veg", Allergens: it.allergens || "None", Description: it.description || "",
  }));
  const field = "w-full p-2 border border-border rounded-md bg-card text-foreground text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Canteen — Weekly Meal Plan"
        description="Set the fixed weekly menu. Tag each dish with its allergens so parents are automatically warned about food their child is allergic to."
        action={<ExportButton rows={exportRows} filename="weekly-meal-plan" label="Export menu" />}
      />

      <form action={addMenuItem} className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <h3 className="font-heading text-base text-foreground mb-3 flex items-center gap-2"><Plus size={16} /> Add a dish</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Day</label>
            <select name="dayOfWeek" className={field} defaultValue="1">{[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{DAYS[d]}</option>)}</select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Meal</label>
            <select name="mealType" className={field} defaultValue="LUNCH">{MEALS.map((m) => <option key={m} value={m}>{MEAL_LABEL[m]}</option>)}</select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Dish name</label>
            <input name="name" required placeholder="e.g. Vegetable Pulao & Raita" className={field} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Allergens (comma-separated)</label>
            <input name="allergens" placeholder="e.g. Dairy, Nuts, Gluten" className={field} />
          </div>
          {/*
            addMenuItem has always read `description` and always stored null,
            because there was no field to type one into.
          */}
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Description (optional)</label>
            <input name="description" placeholder="e.g. Steamed rice, sambar and a seasonal vegetable" className={field} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="isVeg" defaultChecked className="accent-primary" /> Vegetarian
          </label>
          <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium">Add dish</button>
        </div>
      </form>

      {flagged.length > 0 && (
        <div className="bg-card border border-red-200 dark:border-red-900/50 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2 flex-wrap">
            <AlertTriangle size={16} className="text-red-600" />
            <h3 className="font-heading text-base text-foreground">Allergy &amp; flag register</h3>
            <span className="text-xs text-muted-foreground">{flagged.length} student{flagged.length === 1 ? "" : "s"} &middot; share with kitchen staff</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Student</th>
                  <th className="text-left font-medium px-5 py-2.5">Class</th>
                  <th className="text-left font-medium px-5 py-2.5">Allergic to</th>
                  <th className="text-left font-medium px-5 py-2.5">Parent-flagged dishes</th>
                </tr>
              </thead>
              <tbody>
                {flagged.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-5 py-2.5 text-foreground">{s.name}</td>
                    <td className="px-5 py-2.5 text-muted-foreground">{s.classroom?.name ?? "\u2014"}</td>
                    <td className="px-5 py-2.5 text-red-600 dark:text-red-400">{s.allergies || "\u2014"}</td>
                    <td className="px-5 py-2.5 text-amber-700 dark:text-amber-400">{flaggedNames(s.flaggedFoods).join(", ") || "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2, 3, 4, 5].map((day) => {
          const dayItems = items.filter((i) => i.dayOfWeek === day);
          return (
            <div key={day} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border"><h3 className="font-heading text-base text-foreground">{DAYS[day]}</h3></div>
              <div className="divide-y divide-border">
                {MEALS.map((meal) => {
                  const meals = dayItems.filter((i) => i.mealType === meal);
                  if (meals.length === 0) return null;
                  return (
                    <div key={meal} className="px-5 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{MEAL_LABEL[meal]}</p>
                      {meals.map((it) => (
                        <div key={it.id} className="flex items-start justify-between gap-3 py-1.5">
                          <div className="min-w-0">
                            <p className="text-sm text-foreground flex items-center gap-1.5">
                              {it.isVeg ? <Leaf size={13} className="text-emerald-600 shrink-0" /> : <Drumstick size={13} className="text-orange-600 shrink-0" />}
                              {it.name}
                            </p>
                            {it.allergens && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                <AlertTriangle size={11} /> Contains: {it.allergens}
                              </p>
                            )}
                          </div>
                          <form action={deleteMenuItem}>
                            <input type="hidden" name="id" value={it.id} />
                            <ConfirmSubmitButton
                              question="Remove this menu item?"
                              confirmLabel="Remove"
                              pendingText="Removing…"
                              triggerLabel={`Remove menu item ${it.name}`}
                              triggerClassName="text-slate-400 hover:text-red-600 transition-colors mt-0.5"
                            >
                              <Trash2 size={14} aria-hidden />
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {dayItems.length === 0 && <p className="px-5 py-4 text-sm text-muted-foreground">No dishes set for {DAYS[day]}.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
