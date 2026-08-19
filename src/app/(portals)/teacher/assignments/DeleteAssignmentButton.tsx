"use client";

import { Trash2 } from "lucide-react";
import { ConfirmIconButton } from "@/components/ui/form";
import { deleteAssignment } from "./actions";

export default function DeleteAssignmentButton({
  id, title, submissionCount,
}: { id: string; title: string; submissionCount: number }) {
  return (
    <ConfirmIconButton
      onConfirm={() => deleteAssignment(id)}
      // Deleting cascades to submissions, so say so instead of quietly binning student work.
      question={submissionCount > 0
        ? `Delete "${title}" and its ${submissionCount} submission${submissionCount === 1 ? "" : "s"}?`
        : `Delete "${title}"?`}
      triggerLabel={`Delete assignment ${title}`}
      triggerClassName="px-2 py-1.5 text-sm text-slate-400 hover:text-red-600 transition-colors"
    >
      <Trash2 size={15} aria-hidden />
    </ConfirmIconButton>
  );
}
