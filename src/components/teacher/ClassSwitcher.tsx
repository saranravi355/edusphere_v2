"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";

export default function ClassSwitcher({ isClassTeacher }: { isClassTeacher: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentClass = searchParams.get("classId") || "8A";

  const classes = [
    { id: "8A", name: "Class 8A", role: "Class Teacher" },
    { id: "8B", name: "Class 8B", role: "Subject Teacher (Math)" },
    { id: "8C", name: "Class 8C", role: "Subject Teacher (Math)" },
  ];

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
        <Users className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">Viewing Context</p>
        <select
          value={currentClass}
          onChange={(e) => router.push(`?classId=${e.target.value}`)}
          className="text-sm font-bold bg-transparent border-none outline-none cursor-pointer text-slate-800 dark:text-slate-100"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id} className="text-slate-800">
              {c.name} - {c.role}
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
