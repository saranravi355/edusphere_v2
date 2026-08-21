"use client";

import { Plus, Settings, MoveRight } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { upsertSchool, assignClassroom } from "./actions";

const field =
  "w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 " +
  "text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
const secondary =
  "px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs " +
  "font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5";

type Campus = {
  id: string;
  name: string;
  campusCode: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  principalName: string | null;
};

function Fields({ campus }: { campus?: Campus }) {
  return (
    <>
      {campus && <input type="hidden" name="id" value={campus.id} />}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={label} htmlFor={`sc-name-${campus?.id ?? "new"}`}>Campus name</label>
          <input id={`sc-name-${campus?.id ?? "new"}`} name="name" required type="text" defaultValue={campus?.name}
            placeholder="e.g. Main Campus" className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`sc-code-${campus?.id ?? "new"}`}>Campus code</label>
          <input id={`sc-code-${campus?.id ?? "new"}`} name="campusCode" required type="text" defaultValue={campus?.campusCode}
            placeholder="MAIN" className={`${field} uppercase`} />
        </div>
        <div>
          <label className={label} htmlFor={`sc-principal-${campus?.id ?? "new"}`}>Head of campus</label>
          <input id={`sc-principal-${campus?.id ?? "new"}`} name="principalName" type="text" defaultValue={campus?.principalName ?? ""} className={field} />
        </div>
        <div className="col-span-2">
          <label className={label} htmlFor={`sc-address-${campus?.id ?? "new"}`}>Address</label>
          <input id={`sc-address-${campus?.id ?? "new"}`} name="address" type="text" defaultValue={campus?.address ?? ""} className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`sc-phone-${campus?.id ?? "new"}`}>Phone</label>
          <input id={`sc-phone-${campus?.id ?? "new"}`} name="phone" type="tel" defaultValue={campus?.phone ?? ""} className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`sc-email-${campus?.id ?? "new"}`}>Email</label>
          <input id={`sc-email-${campus?.id ?? "new"}`} name="email" type="email" defaultValue={campus?.email ?? ""} className={field} />
        </div>
      </div>
    </>
  );
}

export function AddCampus() {
  return (
    <FormModal
      title="Add campus"
      buttonText="Add campus"
      buttonIcon={<Plus size={16} aria-hidden />}
      submitLabel="Add campus"
      pendingLabel="Adding…"
      action={upsertSchool}
    >
      <Fields />
    </FormModal>
  );
}

export function EditCampus({ campus }: { campus: Campus }) {
  return (
    <FormModal
      title={`Edit ${campus.name}`}
      buttonText="Manage"
      buttonIcon={<Settings size={13} aria-hidden />}
      buttonClassName={secondary}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      action={upsertSchool}
    >
      <Fields campus={campus} />
    </FormModal>
  );
}

export function MoveClassroom({
  classrooms,
  campuses,
}: {
  classrooms: { id: string; name: string; campus: string }[];
  campuses: { id: string; name: string }[];
}) {
  return (
    <FormModal
      title="Move a class to another campus"
      buttonText="Move a class"
      buttonIcon={<MoveRight size={16} aria-hidden />}
      buttonClassName="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
      submitLabel="Move it"
      pendingLabel="Moving…"
      action={assignClassroom}
    >
      <div>
        <label className={label} htmlFor="mv-class">Class</label>
        <select id="mv-class" name="classroomId" required defaultValue="" className={field}>
          <option value="" disabled>Select a class…</option>
          {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.campus}</option>)}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="mv-campus">Campus</label>
        <select id="mv-campus" name="schoolId" required defaultValue="" className={field}>
          <option value="" disabled>Select a campus…</option>
          {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
    </FormModal>
  );
}
