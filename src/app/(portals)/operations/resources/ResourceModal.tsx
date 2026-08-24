"use client";

import { Plus } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { createResource } from "./actions";

const field =
  "w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 " +
  "text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function ResourceModal() {
  return (
    <FormModal
      title="Add New Resource"
      buttonText="New Resource"
      buttonIcon={<Plus size={16} aria-hidden />}
      submitLabel="Add to directory"
      pendingLabel="Adding…"
      action={createResource}
    >
      <div>
        <label className={label} htmlFor="res-name">Resource name</label>
        <input id="res-name" required type="text" name="name" placeholder="e.g. Chemistry Lab 1" className={field} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="res-type">Type</label>
          <select id="res-type" required name="type" defaultValue="FACILITY" className={field}>
            <option value="FACILITY">Facility / Room</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="LIBRARY_BOOK">Library Book</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="res-capacity">Capacity (optional)</label>
          <input id="res-capacity" type="number" min={1} name="capacity" placeholder="e.g. 30" className={field} />
        </div>
      </div>
    </FormModal>
  );
}
