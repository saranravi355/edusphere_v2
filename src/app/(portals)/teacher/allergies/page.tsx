import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AlertTriangle, Flag, ShieldCheck, UtensilsCrossed } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherAllergiesPage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: { include: { students: { orderBy: { name: "asc" } } } } },
  });

  const menu = await prisma.menuItem.findMany();
  const menuMap = new Map(menu.map((m) => [m.id, m]));

  const detectedDishes = (allergies: string | null) => {
    const set = (allergies || "").split(",").map((a) => a.trim().toLowerCase()).filter(Boolean);
    if (set.length === 0) return [];
    return menu.filter((m) => (m.allergens || "").split(",").map((a) => a.trim().toLowerCase()).some((a) => a && set.includes(a)));
  };
  const flaggedDishes = (flaggedFoods: string | null) =>
    (flaggedFoods || "").split(",").map((s) => s.trim()).filter(Boolean).map((id) => menuMap.get(id)?.name).filter(Boolean) as string[];

  const classes = teacher?.classes ?? [];
  const concernCount = classes.reduce((n, c) => n + c.students.filter((s) => s.allergies || s.flaggedFoods).length, 0);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Canteen — Allergies & Flags"
        description="Dietary alerts your families have set for the students in your class. Please share with canteen staff before meals."
      />

      <div className="bg-slate-900 rounded-lg p-4 text-white border border-border flex items-center gap-3">
        <UtensilsCrossed size={18} className="text-amber-300" />
        <p className="text-sm">
          {concernCount === 0
            ? "No students in your class currently have allergies or flagged foods recorded."
            : `${concernCount} student${concernCount === 1 ? "" : "s"} in your class have allergies or flagged foods that need attention at meal times.`}
        </p>
      </div>

      {classes.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
          You are not assigned as the class teacher of any classroom.
        </div>
      )}

      {classes.map((c) => {
        const concerned = c.students.filter((s) => s.allergies || s.flaggedFoods);
        return (
          <div key={c.id} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-heading text-base text-foreground">{c.name}</h3>
              <span className="text-xs text-muted-foreground">{concerned.length} of {c.students.length} need attention</span>
            </div>
            {concerned.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-600" /> No allergies or flags recorded for this class.</p>
            ) : (
              <div className="divide-y divide-border">
                {concerned.map((s) => {
                  const alerts = detectedDishes(s.allergies);
                  const flags = flaggedDishes(s.flaggedFoods);
                  return (
                    <div key={s.id} className="px-5 py-4">
                      <p className="font-medium text-foreground">{s.name}</p>
                      {s.allergies && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> Allergic to:</span>
                          {s.allergies.split(",").map((a) => (
                            <span key={a} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{a.trim()}</span>
                          ))}
                        </div>
                      )}
                      {alerts.length > 0 && (
                        <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">
                          Do not serve this week: {alerts.map((m) => m.name).join("; ")}
                        </p>
                      )}
                      {flags.length > 0 && (
                        <p className="text-[12px] text-amber-700 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                          <Flag size={12} /> Parent-flagged: {flags.join("; ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
