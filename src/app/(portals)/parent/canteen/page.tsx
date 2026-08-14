import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Leaf, Drumstick, AlertTriangle, ShieldAlert, ShieldCheck, Flag, Sparkles, Check } from "lucide-react";

export const dynamic = "force-dynamic";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MEALS = ["BREAKFAST", "LUNCH", "SNACK"];
const MEAL_LABEL: Record<string, string> = { BREAKFAST: "Breakfast", LUNCH: "Lunch", SNACK: "Snack" };
const COMMON_ALLERGENS = ["Nuts", "Peanuts", "Dairy", "Gluten", "Egg", "Soy", "Sesame", "Fish", "Shellfish", "Mustard"];

async function saveAllergies(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.user.role !== "PARENT") return;
  const studentId = String(formData.get("studentId") || "");
  const selected = formData.getAll("allergen").map((a) => String(a).trim()).filter(Boolean);
  const custom = String(formData.get("customAllergens") || "").split(",").map((a) => a.trim()).filter(Boolean);
  const all = Array.from(new Set([...selected, ...custom]));
  // Only allow updating the parent's own child.
  const student = await prisma.student.findFirst({ where: { id: studentId, parent: { userId: session.user.id } } });
  if (!student) return;
  await prisma.student.update({ where: { id: studentId }, data: { allergies: all.join(", ") || null } });
  revalidatePath("/parent/canteen");
}

async function toggleFlag(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.user.role !== "PARENT") return;
  const studentId = String(formData.get("studentId") || "");
  const menuItemId = String(formData.get("menuItemId") || "");
  const student = await prisma.student.findFirst({ where: { id: studentId, parent: { userId: session.user.id } } });
  if (!student || !menuItemId) return;
  const set = new Set((student.flaggedFoods || "").split(",").map((s) => s.trim()).filter(Boolean));
  if (set.has(menuItemId)) set.delete(menuItemId);
  else set.add(menuItemId);
  await prisma.student.update({ where: { id: studentId }, data: { flaggedFoods: Array.from(set).join(",") || null } });
  revalidatePath("/parent/canteen");
}

export default async function ParentCanteenPage() {
  const session = await getSession();
  if (!session || session.user.role !== "PARENT") redirect("/");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: true },
  });
  const student = parent?.students[0];
  const items = await prisma.menuItem.findMany({ orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }] });

  const childAllergies = (student?.allergies || "").split(",").map((a) => a.trim()).filter(Boolean);
  const childAllergiesLower = childAllergies.map((a) => a.toLowerCase());
  const flaggedIds = new Set((student?.flaggedFoods || "").split(",").map((s) => s.trim()).filter(Boolean));

  const detectedFor = (allergens: string | null) =>
    (allergens || "").split(",").map((a) => a.trim()).filter((a) => childAllergiesLower.includes(a.toLowerCase()));

  const alertCount = items.filter((it) => detectedFor(it.allergens).length > 0).length;
  const flaggedCount = items.filter((it) => flaggedIds.has(it.id)).length;

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <PageHeader title="Canteen & Allergies" description="Weekly meal plan and allergy safety for your child." />
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center text-slate-500">No child linked to your account.</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Canteen & Allergies"
        description={`Weekly meal plan for ${student.name}, with automatic allergy checks.`}
      />

      {/* AI allergy summary */}
      <div className="bg-slate-900 rounded-lg p-5 text-white border border-border flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-amber-300" />
          <div>
            <p className="font-heading text-base">AI allergy check</p>
            <p className="text-sm text-slate-300">
              {childAllergies.length === 0
                ? "Add your child's allergies below to enable automatic warnings."
                : `Scanning the week's ${items.length} dishes against: ${childAllergies.join(", ")}.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <span className="flex items-center gap-1.5"><ShieldAlert size={16} className="text-red-400" /> {alertCount} allergy {alertCount === 1 ? "alert" : "alerts"}</span>
          <span className="flex items-center gap-1.5"><Flag size={16} className="text-amber-400" /> {flaggedCount} flagged</span>
        </div>
      </div>

      {/* Allergy setup */}
      <form action={saveAllergies} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <input type="hidden" name="studentId" value={student.id} />
        <h3 className="font-heading text-base text-slate-800 dark:text-slate-100 mb-1">{student.name}&apos;s allergies</h3>
        <p className="text-xs text-slate-500 mb-3">Select all that apply. Any dish containing these will be flagged automatically.</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGENS.map((a) => {
            const on = childAllergiesLower.includes(a.toLowerCase());
            return (
              <label key={a} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${on ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300" : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"}`}>
                <input type="checkbox" name="allergen" value={a} defaultChecked={on} className="accent-red-600" /> {a}
              </label>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <input name="customAllergens" placeholder="Other allergies (comma-separated)" className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" />
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save allergies</button>
        </div>
      </form>

      {/* Weekly menu with detection + manual flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2, 3, 4, 5].map((day) => {
          const dayItems = items.filter((i) => i.dayOfWeek === day);
          return (
            <div key={day} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800"><h3 className="font-heading text-base text-slate-800 dark:text-slate-100">{DAYS[day]}</h3></div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {dayItems.length === 0 && <p className="px-5 py-4 text-sm text-slate-400">No menu set.</p>}
                {MEALS.map((meal) => {
                  const meals = dayItems.filter((i) => i.mealType === meal);
                  if (meals.length === 0) return null;
                  return meals.map((it) => {
                    const detected = detectedFor(it.allergens);
                    const flagged = flaggedIds.has(it.id);
                    const unsafe = detected.length > 0 || flagged;
                    return (
                      <div key={it.id} className={`px-5 py-3 ${unsafe ? "bg-red-50/60 dark:bg-red-900/10" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{MEAL_LABEL[meal]}</p>
                            <p className="text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                              {it.isVeg ? <Leaf size={13} className="text-emerald-600 shrink-0" /> : <Drumstick size={13} className="text-orange-600 shrink-0" />}
                              {it.name}
                            </p>
                            {it.allergens && <p className="text-[11px] text-slate-400 mt-0.5">Contains: {it.allergens}</p>}
                            {detected.length > 0 && (
                              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                <AlertTriangle size={12} /> Allergy alert — contains {detected.join(", ")}
                              </p>
                            )}
                            {flagged && (
                              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1">
                                <Flag size={12} /> Flagged — please do not serve
                              </p>
                            )}
                          </div>
                          <form action={toggleFlag} className="shrink-0">
                            <input type="hidden" name="studentId" value={student.id} />
                            <input type="hidden" name="menuItemId" value={it.id} />
                            <button type="submit" title={flagged ? "Remove flag" : "Flag this dish"} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${flagged ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                              {flagged ? <><Check size={12} /> Flagged</> : <><Flag size={12} /> Flag</>}
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          );
        })}
      </div>

      {childAllergies.length > 0 && alertCount === 0 && flaggedCount === 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 rounded-lg px-4 py-3">
          <ShieldCheck size={16} /> Good news — no dishes this week contain {student.name}&apos;s allergens.
        </div>
      )}
    </div>
  );
}
