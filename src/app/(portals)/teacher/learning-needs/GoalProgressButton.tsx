"use client";

import { useTransition } from "react";
import { updateGoalProgress } from "../../admin/students/learning-needs/actions";

export default function GoalProgressButton({ goalId, progress }: { goalId: string; progress: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => updateGoalProgress(goalId, progress + 10).then(() => {}))}
      disabled={isPending}
      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap disabled:opacity-50"
    >
      +10%
    </button>
  );
}
