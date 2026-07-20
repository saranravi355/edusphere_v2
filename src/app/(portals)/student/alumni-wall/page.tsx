import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { GraduationCap, Star, MapPin } from "lucide-react";

export default async function AlumniWallPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const featured = await prisma.alumni.findMany({
    where: { isFeatured: true },
    include: { student: true },
    orderBy: { graduationYear: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <PageHeader
        title="Alumni Achievement Wall"
        description="Notable graduates from our school community, for inspiration on your own journey."
      />

      {featured.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
          <GraduationCap size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Featured Alumni Yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-1 text-sm">Check back soon as we add notable graduates to the wall.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((a) => (
            <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <Star size={16} className="absolute top-4 right-4 text-amber-400" fill="currentColor" />
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg mb-3">
                {a.student.name[0]}
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{a.student.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Class of {a.graduationYear} - {a.finalProgramme}{a.finalDpScore ? ` - DP ${a.finalDpScore}/45` : ""}</p>

              {(a.university || a.courseOfStudy) && (
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{a.courseOfStudy}{a.university ? ` at ${a.university}` : ""}</p>
              )}
              {a.country && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><MapPin size={11} /> {a.country}</p>
              )}
              {a.achievements && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">{a.achievements}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
