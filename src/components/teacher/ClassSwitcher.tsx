"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";

export type SwitchableClass = { id: string; name: string; role: string };

/**
 * The class list used to be hardcoded to 8A/8B/8C, which are not classes this
 * school has — the school runs DP1C, MYP5A and so on. The teacher directory
 * defaulted to "8A", so its first render matched no classroom and showed an
 * empty list. Classes are now passed in from the database.
 */
export default function ClassSwitcher({
  isClassTeacher,
  classes,
}: {
  isClassTeacher: boolean;
  classes: SwitchableClass[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentClass = searchParams.get("classId") || classes[0]?.name || "";

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
        <Users className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">Viewing Context</p>
        <select
          aria-label="Viewing context: class"
          value={currentClass}
          onChange={(e) => router.push(`?classId=${encodeURIComponent(e.target.value)}`)}
          className="text-sm font-bold bg-transparent border-none outline-none cursor-pointer text-slate-800 dark:text-slate-100"
        >
          {classes.length === 0 && <option value="">No classes assigned</option>}
          {classes.map(c => (
            <option key={c.id} value={c.name} className="text-slate-800">
              {c.name} — {c.role}
            </option>
          ))}
        </select>
      </div>
      {isClassTeacher ? (
        <span className="ml-auto text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded border border-green-200 dark:border-green-800">
          Full Access
        </span>
      ) : (
        <span className="ml-auto text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded border border-orange-200 dark:border-orange-800">
          Subject Access
        </span>
      )}
    </div>
  );
}
