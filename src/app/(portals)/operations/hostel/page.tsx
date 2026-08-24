import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import ExportButton from "@/components/data/ExportButton";
import { getSession } from "@/lib/session";
import { canAccessDepartment } from "@/lib/operations";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Bed, UserPlus, X, Plane, Check, Ban } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/form";

export const dynamic = "force-dynamic";

const genderOfStudent = (g: string | null) => (g === "Female" ? "GIRLS" : g === "Male" ? "BOYS" : null);
const fmt = (d: Date) => new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

async function allocateStudent(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!canAccessDepartment(session?.user?.role, "hostel")) return;
  const studentId = String(formData.get("studentId") || "");
  const roomId = String(formData.get("roomId") || "");
  if (!studentId || !roomId) return;
  const [student, room] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, include: { hostelRecord: true } }),
    prisma.hostelRoom.findUnique({ where: { id: roomId }, include: { occupants: true } }),
  ]);
  if (!student || !room || student.hostelRecord) return;
  if (genderOfStudent(student.gender) !== room.gender) return; // gender must match
  if (room.occupants.length >= room.capacity) return; // must have vacancy
  await prisma.hostelStudent.create({ data: { studentId, roomId, joinedAt: new Date() } });
  revalidatePath("/operations/hostel");
}

async function removeOccupant(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!canAccessDepartment(session?.user?.role, "hostel")) return;
  const id = String(formData.get("id") || "");
  if (id) await prisma.hostelStudent.delete({ where: { id } });
  revalidatePath("/operations/hostel");
}

async function addLeave(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!canAccessDepartment(session?.user?.role, "hostel")) return;
  const studentId = String(formData.get("studentId") || "");
  const fromDate = String(formData.get("fromDate") || "");
  const toDate = String(formData.get("toDate") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!studentId || !fromDate || !toDate || !reason) return;
  await prisma.hostelLeave.create({
    data: {
      studentId, fromDate: new Date(fromDate), toDate: new Date(toDate), reason,
      destination: String(formData.get("destination") || "").trim() || null,
      contactPhone: String(formData.get("contactPhone") || "").trim() || null,
      // Recorded as PENDING. It used to be created APPROVED, which meant the
      // Approve and Reject buttons below — which only render for PENDING —
      // could never appear for anything this screen created.
      status: "PENDING",
    },
  });
  revalidatePath("/operations/hostel");
}

async function setLeaveStatus(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!canAccessDepartment(session?.user?.role, "hostel")) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (id && status) await prisma.hostelLeave.update({ where: { id }, data: { status } });
  revalidatePath("/operations/hostel");
}

const LEAVE_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RETURNED: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300",
};

export default async function HostelPage() {
  const session = await getSession();
  if (!canAccessDepartment(session?.user?.role, "hostel")) redirect("/");

  const [rooms, unhoused, leaves] = await Promise.all([
    prisma.hostelRoom.findMany({ include: { occupants: { include: { student: true } } }, orderBy: [{ gender: "asc" }, { block: "asc" }, { roomNumber: "asc" }] }),
    prisma.student.findMany({ where: { isActive: true, hostelRecord: null, gender: { in: ["Male", "Female"] } }, select: { id: true, name: true, gender: true }, orderBy: { name: "asc" } }),
    prisma.hostelLeave.findMany({ include: { student: true }, orderBy: { fromDate: "desc" } }),
  ]);

  const statsFor = (g: string) => {
    const rs = rooms.filter((r) => r.gender === g);
    const beds = rs.reduce((s, r) => s + r.capacity, 0);
    const occ = rs.reduce((s, r) => s + r.occupants.length, 0);
    return { rooms: rs.length, beds, occ, vacant: beds - occ };
  };
  const boys = statsFor("BOYS");
  const girls = statsFor("GIRLS");
  const field = "w-full p-2 border border-border rounded-md bg-card text-foreground text-sm outline-none focus:border-primary";

  const exportRows = rooms.flatMap((r) =>
    r.occupants.length
      ? r.occupants.map((o) => ({ Hostel: r.gender === "BOYS" ? "Boys" : "Girls", Block: r.block, Room: r.roomNumber, Type: r.type.replace("_", " "), Student: o.student.name }))
      : [{ Hostel: r.gender === "BOYS" ? "Boys" : "Girls", Block: r.block, Room: r.roomNumber, Type: r.type.replace("_", " "), Student: "(vacant)" }]
  );

  const genderBlock = (g: "BOYS" | "GIRLS", label: string, warden: string | undefined, tone: string) => {
    const rs = rooms.filter((r) => r.gender === g);
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-heading text-base text-foreground">{label}</h3>
          <span className="text-xs text-muted-foreground">Warden: {warden || "—"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2">Room</th>
                <th className="text-left font-medium px-4 py-2">Floor</th>
                <th className="text-left font-medium px-4 py-2">Type</th>
                <th className="text-left font-medium px-4 py-2">Occupants</th>
                <th className="text-center font-medium px-4 py-2">Beds</th>
              </tr>
            </thead>
            <tbody>
              {rs.map((r) => {
                const full = r.occupants.length >= r.capacity;
                return (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="px-4 py-2 text-foreground font-medium">{r.roomNumber}<span className="block text-[11px] text-muted-foreground font-normal">{r.block}</span></td>
                    <td className="px-4 py-2 text-muted-foreground">{r.floor ?? "—"}</td>
                    <td className="px-4 py-2"><span className={`text-[11px] px-2 py-0.5 rounded-full ${r.type === "AC" ? tone : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300"}`}>{r.type.replace("_", " ")}</span></td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {r.occupants.map((o) => (
                          <span key={o.id} className="inline-flex items-center gap-1 text-[11px] bg-muted rounded-full pl-2 pr-1 py-0.5 text-foreground">
                            {o.student.name}
                            <form action={removeOccupant} className="inline">
                              <input type="hidden" name="id" value={o.id} />
                              <ConfirmSubmitButton
                                question={`Remove ${o.student.name} from this room?`}
                                confirmLabel="Remove"
                                pendingText="Removing…"
                                triggerLabel={`Remove ${o.student.name} from room`}
                                triggerClassName="text-slate-400 hover:text-red-600"
                              >
                                <X size={11} aria-hidden />
                              </ConfirmSubmitButton>
                            </form>
                          </span>
                        ))}
                        {r.occupants.length === 0 && <span className="text-[11px] text-muted-foreground">Vacant</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center"><span className={full ? "text-red-600 dark:text-red-400 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-semibold"}>{r.occupants.length}/{r.capacity}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const boysWarden = rooms.find((r) => r.gender === "BOYS")?.warden ?? undefined;
  const girlsWarden = rooms.find((r) => r.gender === "GIRLS")?.warden ?? undefined;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Hostel & Dormitory Management"
        description="Separate boys' and girls' hostels — room allocation, occupancy and gate passes."
        action={<ExportButton rows={exportRows} filename="hostel-rooming-list" label="Export rooming list" />}
      />

      {/* Stats: boys vs girls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {([["Boys' Hostel — Aravali", boys, "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"], ["Girls' Hostel — Nilgiri", girls, "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400"]] as const).map(([label, st, tone]) => (
          <div key={label} className="bg-card border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tone}`}><Bed size={18} /></div>
              <h3 className="font-heading text-base text-foreground">{label}</h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-xl font-semibold text-foreground">{st.rooms}</p><p className="text-[11px] text-muted-foreground">Rooms</p></div>
              <div><p className="text-xl font-semibold text-foreground">{st.beds}</p><p className="text-[11px] text-muted-foreground">Beds</p></div>
              <div><p className="text-xl font-semibold text-foreground">{st.occ}</p><p className="text-[11px] text-muted-foreground">Occupied</p></div>
              <div><p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{st.vacant}</p><p className="text-[11px] text-muted-foreground">Vacant</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Allocate a student */}
      <form action={allocateStudent} className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <h3 className="font-heading text-base text-foreground mb-3 flex items-center gap-2"><UserPlus size={16} /> Allocate a boarder</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Student (unhoused)</label>
            <select name="studentId" required className={field}>
              <option value="">Select student…</option>
              {unhoused.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.gender})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Room (with vacancy)</label>
            <select name="roomId" required className={field}>
              <option value="">Select room…</option>
              {rooms.filter((r) => r.occupants.length < r.capacity).map((r) => (
                <option key={r.id} value={r.id}>{r.roomNumber} · {r.gender === "BOYS" ? "Boys" : "Girls"} · {r.occupants.length}/{r.capacity}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium">Allocate room</button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Gender is enforced automatically — boys can only be placed in the boys&apos; hostel and girls in the girls&apos; hostel.</p>
      </form>

      {genderBlock("BOYS", "Boys' Hostel — Aravali Block", boysWarden, "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}
      {genderBlock("GIRLS", "Girls' Hostel — Nilgiri Block", girlsWarden, "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400")}

      {/* Gate passes / hostel leave */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2"><Plane size={16} className="text-primary" /><h3 className="font-heading text-base text-foreground">Gate passes &amp; hostel leave</h3></div>
        <form action={addLeave} className="p-5 border-b border-border grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Boarder</label>
            <select name="studentId" required className={field}>
              <option value="">Select boarder…</option>
              {rooms.flatMap((r) => r.occupants).map((o) => <option key={o.id} value={o.studentId}>{o.student.name}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground block mb-1">From</label><input type="date" name="fromDate" required className={field} /></div>
          <div><label className="text-xs font-medium text-muted-foreground block mb-1">To</label><input type="date" name="toDate" required className={field} /></div>
          <div className="md:col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Reason</label><input name="reason" required placeholder="e.g. Weekend home visit" className={field} /></div>
          <div className="md:col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Destination</label><input name="destination" placeholder="e.g. Bengaluru" className={field} /></div>
          <div className="md:col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Contact phone</label><input name="contactPhone" placeholder="+91…" className={field} /></div>
          <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium md:col-span-2">Record gate pass</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2">Boarder</th>
                <th className="text-left font-medium px-4 py-2">Dates</th>
                <th className="text-left font-medium px-4 py-2">Reason</th>
                <th className="text-left font-medium px-4 py-2">Destination</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
                <th className="text-right font-medium px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-2 text-foreground">{l.student.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{fmt(l.fromDate)} – {fmt(l.toDate)}</td>
                  <td className="px-4 py-2 text-foreground">{l.reason}</td>
                  <td className="px-4 py-2 text-muted-foreground">{l.destination || "—"}</td>
                  <td className="px-4 py-2"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${LEAVE_STYLE[l.status]}`}>{l.status}</span></td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {l.status === "PENDING" && (
                        <>
                          <form action={setLeaveStatus}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="status" value="APPROVED" /><button title="Approve" className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"><Check size={14} /></button></form>
                          <form action={setLeaveStatus}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="status" value="REJECTED" /><button title="Reject" className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Ban size={14} /></button></form>
                        </>
                      )}
                      {l.status === "APPROVED" && (
                        <form action={setLeaveStatus}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="status" value="RETURNED" /><button className="text-[11px] px-2 py-1 border border-border rounded hover:bg-muted text-muted-foreground">Mark returned</button></form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No gate passes recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
