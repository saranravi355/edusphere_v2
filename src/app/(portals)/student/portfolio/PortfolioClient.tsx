"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Image as ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { uploadPortfolioItem, deletePortfolioItem } from "./actions";

type Item = {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  academicYear: string | null;
  fileUrl: string;
  fileType: string | null;
  createdAt: string;
};

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
const label = "block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

function ItemCard({ item }: { item: Item }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isImage = item.fileType?.startsWith("image/");

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden group">
      <a href={item.fileUrl} target="_blank" rel="noreferrer" className="block aspect-video bg-slate-50 dark:bg-zinc-800 flex items-center justify-center">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.fileUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <FileText size={28} className="text-slate-400" />
        )}
      </a>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
          <button
            onClick={() => startTransition(async () => { await deletePortfolioItem(item.id); router.refresh(); })}
            disabled={pending}
            className="text-slate-300 hover:text-rose-500 transition-colors shrink-0 disabled:opacity-50"
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">{[item.subject, item.academicYear].filter(Boolean).join(" · ") || fmt(item.createdAt)}</p>
        {item.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{item.description}</p>}
      </div>
    </div>
  );
}

export default function PortfolioClient({ items }: { items: Item[] }) {
  const [state, action] = useActionState(uploadPortfolioItem, undefined);

  return (
    <div className="space-y-6">
      <form action={action} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><UploadCloud size={15} /> Add to your portfolio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <label className={label} htmlFor="pf-title">Title</label>
            <input id="pf-title" name="title" required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="pf-subject">Subject (optional)</label>
            <input id="pf-subject" name="subject" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="pf-year">Academic year (optional)</label>
            <input id="pf-year" name="academicYear" placeholder="2025-26" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="pf-file">File (image or PDF)</label>
            <input id="pf-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className={field} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="pf-desc">Description (optional)</label>
          <textarea id="pf-desc" name="description" rows={2} className={field} />
        </div>
        <FormFeedback state={state} />
        <SubmitButton pendingText="Uploading…">Add to portfolio</SubmitButton>
      </form>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
          <ImageIcon className="mx-auto mb-2 text-slate-400" size={28} />
          Nothing uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
