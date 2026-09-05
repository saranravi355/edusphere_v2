import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { BookOpen, Monitor, MapPin, Search, PackageOpen } from "lucide-react";
import AIFeatureLink from "@/components/ai/AIFeatureLink";
import { getSession } from "@/lib/session";
import { canAccessDepartment } from "@/lib/operations";
import { redirect } from "next/navigation";
import ResourceModal from "./ResourceModal";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const session = await getSession();
  if (!canAccessDepartment(session?.user?.role, "resources")) redirect("/");

  const sp = await searchParams;
  const query = (sp.q || "").trim();

  // Offer only types that exist, and ignore anything else in the query string.
  const types = (await prisma.resource.findMany({ distinct: ["type"], select: { type: true }, orderBy: { type: "asc" } }))
    .map((r) => r.type);
  const typeFilter = sp.type && types.includes(sp.type) ? sp.type : "";

  const resources = await prisma.resource.findMany({
    where: {
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(query
        ? { OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { type: { contains: query, mode: "insensitive" as const } },
          ] }
        : {}),
    },
    orderBy: { name: 'asc' }
  });

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'LIBRARY_BOOK': return <BookOpen className="text-blue-500" />;
      case 'EQUIPMENT': return <Monitor className="text-purple-500" />;
      case 'FACILITY': return <MapPin className="text-emerald-500" />;
      default: return <MapPin className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Resource Directory" 
        description="Manage facilities, library books, and equipment availability."
        action={<ResourceModal />}
      />

      <AIFeatureLink
        href="/operations/resources/predictive-ai"
        icon={<PackageOpen size={15} />}
        title="Predictive Resource Allocation"
        description="Forecasts inventory depletion and drafts purchase orders."
      />

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {/*
          Search and type filter were both decorative — no name, no form, no
          handler. They are one GET form now, so the two combine and both
          survive a refresh or a shared URL.
        */}
        <form className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap items-center gap-3 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} aria-hidden />
            <label className="sr-only" htmlFor="resource-search">Search resources</label>
            <input
              id="resource-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search resources..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500" htmlFor="resource-type">Filter</label>
            <select
              id="resource-type"
              name="type"
              defaultValue={typeFilter}
              className="text-sm p-1.5 border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-black text-slate-700 dark:text-slate-300"
            >
              <option value="">All types</option>
              {types.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Apply
            </button>
            {(query || typeFilter) && (
              <a href="/operations/resources" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline">
                Clear
              </a>
            )}
          </div>
        </form>
        
        <div className="overflow-x-auto"><table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-zinc-900/30">
              <th className="p-4 font-medium">Resource Name</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium text-center">Capacity</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          {/*
            This table used to render three hardcoded rows — "Chemistry Lab 1",
            "Projector A", "Advanced Physics Vol 1" — while the resources actually
            fetched from the database were never used. It now renders real rows.
          */}
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {resources.map((r) => {
              const Icon = r.type === "FACILITY" ? MapPin : r.type === "EQUIPMENT" ? Monitor : BookOpen;
              const tone =
                r.status === "AVAILABLE"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : r.status === "IN_USE" || r.status === "IN USE"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300";
              return (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Icon className="text-emerald-500" size={16} aria-hidden />
                    </div>
                    {r.name}
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{r.type}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">{r.capacity ?? "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tone}`}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-slate-400">
                    {/* Booking lives on the resource booking module; no dead button here. */}
                    <a href="/operations/resources" className="sr-only">Resource {r.name}</a>
                    —
                  </td>
                </tr>
              );
            })}
            {resources.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-sm text-slate-500">
                  {query || typeFilter
                    ? <>No resources match that search. <a href="/operations/resources" className="text-blue-600 hover:underline">Clear filters</a></>
                    : "No resources yet. Add one with the button above."}
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
