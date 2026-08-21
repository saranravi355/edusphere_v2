import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, Phone, Mail, GraduationCap, User } from "lucide-react";
import { AddCampus, EditCampus, MoveClassroom } from "./CampusControls";
import { setSchoolActive } from "./actions";
import { SubmitButton } from "@/components/ui/form";

export const dynamic = "force-dynamic";

/**
 * Campuses.
 *
 * This page listed two campuses — "EduSphere Central Academy, 1250 students"
 * and a second with 840 — from a literal array, both marked Active, with an
 * "+ Add Campus" button and a per-campus "Manage Settings" button that had no
 * handler, no href and no form. There was no School model in the schema.
 *
 * Classrooms now belong to a campus, so the enrolment figure on each card is a
 * count of the students actually in its classes.
 */
export default async function AdminSchoolsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const [campuses, classrooms, unassignedStudents] = await Promise.all([
    prisma.school.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        classrooms: {
          select: { id: true, name: true, _count: { select: { students: true } } },
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.classroom.findMany({
      select: { id: true, name: true, school: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.student.count({ where: { classroom: { is: { schoolId: null } } } }),
  ]);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Campuses"
        description="Sites, their classes and who is enrolled at each."
        action={
          <div className="flex flex-wrap gap-2">
            <MoveClassroom
              classrooms={classrooms.map((c) => ({ id: c.id, name: c.name, campus: c.school?.name ?? "no campus" }))}
              campuses={campuses.map((c) => ({ id: c.id, name: c.name }))}
            />
            <AddCampus />
          </div>
        }
      />

      {campuses.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center text-slate-500">
          No campuses recorded yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campuses.map((c) => {
          const students = c.classrooms.reduce((n, k) => n + k._count.students, 0);
          return (
            <Card key={c.id} className={c.isActive ? "" : "opacity-70"}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building size={18} className="text-blue-500" aria-hidden /> {c.name}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{c.campusCode}</p>
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400"}`}
                >
                  {c.isActive ? "Active" : "Closed"}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <GraduationCap size={15} className="text-slate-400" aria-hidden />
                  {students} student{students === 1 ? "" : "s"} across {c.classrooms.length} class{c.classrooms.length === 1 ? "" : "es"}
                </p>
                {c.principalName && (
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <User size={15} className="text-slate-400" aria-hidden /> {c.principalName}
                  </p>
                )}
                {c.address && (
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin size={15} className="text-slate-400" aria-hidden /> {c.address}
                  </p>
                )}
                {c.phone && (
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Phone size={15} className="text-slate-400" aria-hidden />
                    <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:underline">{c.phone}</a>
                  </p>
                )}
                {c.email && (
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Mail size={15} className="text-slate-400" aria-hidden />
                    <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
                  </p>
                )}

                {c.classrooms.length > 0 && (
                  <p className="text-xs text-slate-500 pt-1">
                    {c.classrooms.map((k) => k.name).join(", ")}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <EditCampus
                    campus={{
                      id: c.id, name: c.name, campusCode: c.campusCode,
                      address: c.address, phone: c.phone, email: c.email, principalName: c.principalName,
                    }}
                  />
                  <form action={async () => { "use server"; await setSchoolActive(c.id, !c.isActive); }}>
                    <SubmitButton size="sm" variant="subtle" pendingText="Updating…">
                      {c.isActive ? "Mark closed" : "Reopen"}
                    </SubmitButton>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {unassignedStudents > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {unassignedStudents} student{unassignedStudents === 1 ? " is" : "s are"} in a class that is not on any campus.
          Use “Move a class” to place it.
        </p>
      )}
    </div>
  );
}
