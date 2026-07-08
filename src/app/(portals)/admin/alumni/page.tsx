import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GraduationCap, Star, Globe2, TrendingUp } from "lucide-react";

async function addAlumnus(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) return;

  const studentId = formData.get("studentId") as string;
  const graduationYear = parseInt(formData.get("graduationYear") as string);
  const finalProgramme = formData.get("finalProgramme") as string;
  const finalDpScoreRaw = formData.get("finalDpScore") as string;
  const university = (formData.get("university") as string) || null;
  const courseOfStudy = (formData.get("courseOfStudy") as string) || null;
  const country = (formData.get("country") as string) || null;
  const currentStatus = (formData.get("currentStatus") as string) || null;
  const achievements = (formData.get("achievements") as string) || null;
  const linkedinUrl = (formData.get("linkedinUrl") as string) || null;

  await prisma.alumni.create({
    data: {
      studentId,
      graduationYear,
      finalProgramme,
      finalDpScore: finalDpScoreRaw ? parseInt(finalDpScoreRaw) : null,
      university,
      courseOfStudy,
      country,
      currentStatus,
      achievements,
      linkedinUrl,
    },
  });

  // Mark the source student record as inactive (graduated)
  await prisma.student.update({ where: { id: studentId }, data: { isActive: false } });

  revalidatePath("/admin/alumni");
}

async function toggleFeatured(alumniId: string, currentlyFeatured: boolean) {
  "use server";
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) return;

  await prisma.alumni.update({ where: { id: alumniId }, data: { isFeatured: !currentlyFeatured } });
  revalidatePath("/admin/alumni");
}

export default async function AlumniPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) {
    redirect("/");
  }

  const alumni = await prisma.alumni.findMany({
    include: { student: true },
    orderBy: { graduationYear: "desc" },
  });

  // Students not yet converted to alumni, for the "add" form dropdown
  const eligibleStudents = await prisma.student.findMany({
    where: { isActive: true, alumniRecord: null },
    include: { classroom: true },
    orderBy: { name: "asc" },
  });

  const totalAlumni = alumni.length;
  const dpScores = alumni.map((a) => a.finalDpScore).filter((s): s is number => s !== null);
  const avgDpScore = dpScores.length > 0 ? (dpScores.reduce((a, b) => a + b, 0) / dpScores.length).toFixed(1) : "-";
  const studyingCount = alumni.filter((a) => a.currentStatus === "STUDYING").length;
  const workingCount = alumni.filter((a) => a.currentStatus === "WORKING").length;
  const countries = new Set(alumni.map((a) => a.country).filter(Boolean));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Alumni & Progression Tracking"
        description="Track graduating students, their university and career paths, and celebrate achievements."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><GraduationCap size={20} /></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Alumni</p>
            <p className="text-xl font-bold text-navy-900 dark:text-white">{totalAlumni}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><TrendingUp size={20} /></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg DP Score</p>
            <p className="text-xl font-bold text-navy-900 dark:text-white">{avgDpScore} / 45</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"><Globe2 size={20} /></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Countries Reached</p>
            <p className="text-xl font-bold text-navy-900 dark:text-white">{countries.size}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><Star size={20} /></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Studying / Working</p>
            <p className="text-xl font-bold text-navy-900 dark:text-white">{studyingCount} / {workingCount}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Convert Graduating Student to Alumnus</h2>
        <form action={addAlumnus} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Student</label>
            <select required name="studentId" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
              <option value="">Select a graduating student...</option>
              {eligibleStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name} {s.classroom ? `(${s.classroom.name})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Graduation Year</label>
            <input required name="graduationYear" type="number" defaultValue={new Date().getFullYear()} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Final Programme</label>
            <select required name="finalProgramme" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
              <option value="DP">DP (Diploma Programme)</option>
              <option value="MYP">MYP (Middle Years Programme)</option>
              <option value="PYP">PYP (Primary Years Programme)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Final DP Score (out of 45)</label>
            <input name="finalDpScore" type="number" min={0} max={45} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">University</label>
            <input name="university" type="text" placeholder="e.g. University of Toronto" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Course of Study</label>
            <input name="courseOfStudy" type="text" placeholder="e.g. Computer Science" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Country</label>
            <input name="country" type="text" placeholder="e.g. Canada" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Current Status</label>
            <select name="currentStatus" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
              <option value="STUDYING">Studying</option>
              <option value="WORKING">Working</option>
              <option value="GAP_YEAR">Gap Year</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">LinkedIn URL</label>
            <input name="linkedinUrl" type="text" placeholder="https://linkedin.com/in/..." className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Achievements</label>
            <textarea name="achievements" rows={2} placeholder="Notable achievements, awards, scholarships..." className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              Add to Alumni Registry
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Alumni Registry</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Class of</th>
                <th className="p-4 font-medium">DP Score</th>
                <th className="p-4 font-medium">University</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Wall</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {alumni.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">No alumni recorded yet.</td></tr>
              ) : (
                alumni.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{a.student.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{a.graduationYear} ({a.finalProgramme})</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{a.finalDpScore ?? "-"}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{a.university || "-"}{a.courseOfStudy ? ` - ${a.courseOfStudy}` : ""}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{a.currentStatus?.replace("_", " ") || "-"}{a.country ? ` - ${a.country}` : ""}</td>
                    <td className="p-4">
                      <form action={toggleFeatured.bind(null, a.id, a.isFeatured)}>
                        <button type="submit" className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${a.isFeatured ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <Star size={12} fill={a.isFeatured ? "currentColor" : "none"} /> {a.isFeatured ? "Featured" : "Feature"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
