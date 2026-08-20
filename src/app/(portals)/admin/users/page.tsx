import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import ExportButton from "@/components/data/ExportButton";
import Pagination from "@/components/ui/Pagination";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { presenceByStudent } from "@/lib/attendance";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

/**
 * Student Registry.
 *
 * What this page used to do: load all 173 students with `attendances: true`,
 * `invoices: true` and `behaviorIncidents: true`, then reduce those arrays in
 * JavaScript to three numbers per student. That pulled 3,144 attendance rows on
 * every request, and attendance is the table that grows fastest — one row per
 * student per school day, so a single year of real use is over 30,000 rows and
 * five years is 150,000, all fetched to render a percentage. It also rendered
 * every student at once under a pagination footer that was pure decoration
 * ("1 / 1", a ">" that did nothing) and a class filter button with no handler.
 *
 * Now: the three per-student figures come from grouped aggregates computed in
 * the database, the filters are a real GET form, and the pagination navigates.
 */
export default async function StudentRegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; class?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const sp = await searchParams;
  const query = (sp.q ?? "").trim();

  const classrooms = await prisma.classroom.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  const classNames = classrooms.map((c) => c.name);
  // Ignore a class that does not exist rather than silently returning nothing.
  const classFilter = sp.class && classNames.includes(sp.class) ? sp.class : "";

  const where = {
    ...(classFilter ? { classroom: { name: classFilter } } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { registrationNo: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // Scalars and two shallow relations only — no collections.
  const students = await prisma.student.findMany({
    where,
    select: {
      id: true,
      name: true,
      registrationNo: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      classroom: { select: { name: true } },
      parent: { select: { phone: true, user: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
  });

  const ids = students.map((s) => s.id);

  // Three grouped aggregates instead of three collections. Each returns at most
  // one row per student, and the counting happens in Postgres.
  const [presence, unpaid, demerits] = ids.length
    ? await Promise.all([
        presenceByStudent(ids),
        prisma.feeInvoice.groupBy({
          by: ["studentId"],
          // OVERDUE was missed before, so a student who had stopped paying
          // altogether showed up in the registry as fully paid.
          where: { studentId: { in: ids }, status: { in: ["PENDING", "OVERDUE"] } },
          _sum: { amount: true },
        }),
        prisma.behaviorIncident.groupBy({
          by: ["studentId"],
          where: { studentId: { in: ids }, type: "DEMERIT" },
          _count: { _all: true },
        }),
      ])
    : [new Map(), [], []];

  const owed = new Map(unpaid.map((i) => [i.studentId, i._sum.amount ?? 0]));
  const demeritCount = new Map(demerits.map((d) => [d.studentId, d._count._all]));

  const rows = students.map((student) => {
    const ratio = presence.get(student.id)?.ratio ?? null;
    const due = owed.get(student.id) ?? 0;
    const bad = demeritCount.get(student.id) ?? 0;

    return {
      id: student.id,
      regNo: student.registrationNo,
      name: student.name,
      initial: student.name.charAt(0).toUpperCase(),
      class: student.classroom?.name || "Unassigned",
      parentName: student.parent?.user?.name || student.emergencyContactName || "—",
      parentPhone: student.parent?.phone || student.emergencyContactPhone || "—",
      // No attendance recorded yet is not the same as perfect attendance.
      presenceLabel: ratio === null ? "No data" : `${(ratio * 100).toFixed(1)}%`,
      presenceRatio: ratio ?? 0,
      barColor: ratio === null ? "bg-slate-200" : ratio < 0.75 ? "bg-red-400" : ratio < 0.9 ? "bg-yellow-400" : "bg-teal-400",
      feeStatusText: due > 0 ? (due >= 1000 ? `₹${(due / 1000).toFixed(0)}k` : `₹${due}`) : "Paid",
      feeStatusColor: due > 0 ? "text-yellow-600" : "text-teal-600",
      riskLevel: bad >= 3 ? "High" : bad > 0 ? "Medium" : "Low",
      riskColor: bad >= 3 ? "text-red-500" : bad > 0 ? "text-yellow-600" : "text-teal-600",
    };
  });

  const pendingFeeCount = rows.filter((r) => r.feeStatusText !== "Paid").length;
  const page = Math.min(Math.max(1, Number(sp.page) || 1), Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // The export covers everything the filters match, not just the page in view.
  const exportRows = rows.map((r) => ({
    RegNo: r.regNo,
    Name: r.name,
    Class: r.class,
    Parent: r.parentName,
    Phone: r.parentPhone,
    Attendance: r.presenceLabel,
    FeeStatus: r.feeStatusText,
    Risk: r.riskLevel,
  }));

  const filtering = Boolean(query || classFilter);

  return (
    <div className="bg-white min-h-[calc(100vh-100px)] font-sans -mt-6 -mx-4 sm:-mx-8 px-4 sm:px-8 py-8 sm:py-12 md:px-16 text-slate-800 rounded-tl-3xl shadow-sm border-l border-t border-slate-100">
      <div className="max-w-[1400px] mx-auto">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl sm:text-[2.5rem] leading-tight font-extrabold tracking-tight mb-2 text-black">Student Registry</h1>
            <p className="text-slate-400 text-[13px] font-medium tracking-wide">
              {filtering ? `${rows.length} matching` : `${rows.length} students enrolled`} &middot; {pendingFeeCount} with fees outstanding
            </p>
            <div className="mt-4">
              <ExportButton rows={exportRows} filename="student-registry" label={filtering ? `Export ${rows.length} matching` : "Export CSV"} />
            </div>
          </div>
          <Link href="/admin/students/register">
            <button className="bg-[#111] hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-md">
              <Plus size={16} aria-hidden />
              Enroll Student
            </button>
          </Link>
        </div>

        {/*
          Search and the class filter were a decorative "All Classes" button with
          no handler. One GET form now, so a filtered registry can be bookmarked
          and shared, and paging through it keeps the filter.
        */}
        <form className="flex flex-wrap items-end gap-3 mb-8">
          <div className="relative flex-1 min-w-[12rem] max-w-sm">
            <label className="sr-only" htmlFor="registry-search">Search by name or registration number</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} aria-hidden />
            <input
              id="registry-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Name or registration no."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="registry-class">Class</label>
            <select
              id="registry-class"
              name="class"
              defaultValue={classFilter}
              className="py-2 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white"
            >
              <option value="">All classes</option>
              {classNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-black text-white text-sm font-semibold">
            Apply
          </button>
          {filtering && (
            <Link href="/admin/users" className="text-sm text-slate-500 hover:text-black underline py-2">Clear</Link>
          )}
        </form>

        {/* Narrow screens scroll this sideways rather than crushing 7 columns. */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[52rem]">
            <div className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-100 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 px-2">
              <div className="col-span-3">Student ID</div>
              <div className="col-span-2">Class</div>
              <div className="col-span-2">Parent / Contact</div>
              <div className="col-span-2">Presence Index</div>
              <div className="col-span-1">Fee Status</div>
              <div className="col-span-1">Academic Risk</div>
              <div className="col-span-1 text-right"></div>
            </div>

            <div className="flex flex-col gap-1">
              {visible.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-4 items-center py-[18px] border-b border-slate-50 hover:bg-slate-50/50 transition-colors rounded-2xl px-2">
                  <div className="col-span-3 flex items-center gap-5">
                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs" aria-hidden>
                      {row.initial}
                    </div>
                    <div>
                      <p className="font-bold text-[13px] text-black">{row.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium tracking-wider mt-[3px] uppercase">{row.regNo}</p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[12px] font-bold text-blue-500 uppercase tracking-wide">{row.class}</span>
                  </div>

                  <div className="col-span-2">
                    <p className="font-bold text-[13px] text-black">{row.parentName}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-[3px] tracking-wider">{row.parentPhone}</p>
                  </div>

                  <div className="col-span-2 flex items-center gap-4">
                    <div className="w-12 h-[3px] bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${row.barColor} rounded-full`} style={{ width: `${row.presenceRatio * 100}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-black">{row.presenceLabel}</span>
                  </div>

                  <div className="col-span-1">
                    <span className={`text-[11px] font-bold ${row.feeStatusColor}`}>{row.feeStatusText}</span>
                  </div>

                  <div className="col-span-1">
                    <span className={`text-[11px] font-bold ${row.riskColor}`}>{row.riskLevel}</span>
                  </div>

                  <div className="col-span-1 text-right">
                    <Link href={`/admin/users/${row.id}`} className="text-[11px] font-semibold text-slate-400 hover:text-black transition-colors">
                      Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {rows.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">
            No students match that search.{" "}
            <Link href="/admin/users" className="text-blue-600 hover:underline">Clear filters</Link>
          </p>
        )}

        <div className="mt-10 pb-8">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
            basePath="/admin/users"
            params={{ q: query || undefined, class: classFilter || undefined }}
            label="students"
          />
        </div>

      </div>
    </div>
  );
}
