"use client";

import { Plus, PackageOpen } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { createAsset, checkOutAsset } from "./actions";
import { ASSET_CATEGORIES, prettyOption } from "@/lib/options";

const field =
  "w-full p-2 border border-border rounded-md bg-card text-foreground text-sm outline-none focus:ring-2 focus:ring-primary";
const label = "block text-sm font-medium text-foreground mb-1";

export default function AssetControls({
  available,
  people,
}: {
  available: { id: string; name: string; serialNo: string }[];
  people: { id: string; name: string; role: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FormModal
        title="Check out equipment"
        description="Records who has it and marks the asset unavailable."
        buttonText="Check out"
        buttonIcon={<PackageOpen size={16} aria-hidden />}
        buttonClassName="px-4 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
        submitLabel="Check out"
        pendingLabel="Checking out…"
        action={checkOutAsset}
      >
        <div>
          <label className={label} htmlFor="co-asset">Asset</label>
          <select id="co-asset" name="assetId" required defaultValue="" className={field}>
            <option value="" disabled>Select an available asset…</option>
            {available.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.serialNo}</option>)}
          </select>
          {available.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Everything is currently out or in maintenance.</p>
          )}
        </div>
        <div>
          <label className={label} htmlFor="co-user">Issued to</label>
          <select id="co-user" name="userId" required defaultValue="" className={field}>
            <option value="" disabled>Select a person…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.role.replace("_", " ").toLowerCase()}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <FormModal
        title="Add asset"
        description="Adds a device or piece of equipment to the register."
        buttonText="New asset"
        buttonIcon={<Plus size={16} aria-hidden />}
        submitLabel="Add to register"
        pendingLabel="Adding…"
        action={createAsset}
      >
        <div>
          <label className={label} htmlFor="as-name">Name</label>
          <input id="as-name" name="name" required type="text" placeholder="e.g. Dell Latitude 5440" className={field} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="as-category">Category</label>
            <select id="as-category" name="category" required defaultValue="LAPTOP" className={field}>
              {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{prettyOption(c)}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="as-serial">Serial number</label>
            <input id="as-serial" name="serialNo" required type="text" placeholder="e.g. DL-5440-0042" className={field} />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
