"use client";

import { Plus, BookUp } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { addBook, issueBook } from "./actions";
import { BOOK_CATEGORIES, LOAN_DAYS, prettyOption } from "@/lib/options";

const field =
  "w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 " +
  "text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function LibraryControls({
  lendable,
  people,
}: {
  lendable: { id: string; title: string; free: number }[];
  people: { id: string; name: string; role: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FormModal
        title="Issue a book"
        description={`Loans run for ${LOAN_DAYS} days.`}
        buttonText="Issue"
        buttonIcon={<BookUp size={16} aria-hidden />}
        buttonClassName="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
        submitLabel="Issue book"
        pendingLabel="Issuing…"
        action={issueBook}
      >
        <div>
          <label className={label} htmlFor="lb-book">Book</label>
          <select id="lb-book" name="bookId" required defaultValue="" className={field}>
            <option value="" disabled>Select a book…</option>
            {lendable.map((b) => (
              <option key={b.id} value={b.id}>{b.title} — {b.free} available</option>
            ))}
          </select>
          {lendable.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Every copy of every title is out.</p>
          )}
        </div>
        <div>
          <label className={label} htmlFor="lb-user">Borrower</label>
          <select id="lb-user" name="userId" required defaultValue="" className={field}>
            <option value="" disabled>Select a person…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.role.replace("_", " ").toLowerCase()}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <FormModal
        title="Catalogue a book"
        buttonText="Add book"
        buttonIcon={<Plus size={16} aria-hidden />}
        submitLabel="Add to catalogue"
        pendingLabel="Adding…"
        action={addBook}
      >
        <div>
          <label className={label} htmlFor="bk-title">Title</label>
          <input id="bk-title" name="title" required type="text" placeholder="e.g. Mathematics: Analysis and Approaches HL" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="bk-author">Author</label>
          <input id="bk-author" name="author" required type="text" placeholder="e.g. Ibrahim Wazir" className={field} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="bk-category">Category</label>
            <select id="bk-category" name="category" defaultValue="TEXTBOOK" className={field}>
              {BOOK_CATEGORIES.map((c) => <option key={c} value={c}>{prettyOption(c)}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="bk-copies">Copies</label>
            <input id="bk-copies" name="copiesTotal" type="number" min={1} max={500} defaultValue={1} className={field} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="bk-subject">Subject (optional)</label>
            <input id="bk-subject" name="subjectName" type="text" placeholder="e.g. Physics" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="bk-isbn">ISBN (optional)</label>
            <input id="bk-isbn" name="isbn" type="text" placeholder="978…" className={field} />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
