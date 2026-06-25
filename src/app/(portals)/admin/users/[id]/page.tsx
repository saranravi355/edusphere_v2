import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ChevronLeft, User, Heart, BookOpen } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";



export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const student = await prisma.student.findUnique({
    where: { id: resolvedParams.id },
    include: {
      classroom: true,
      parent: { include: { user: true } },
      attendances: { orderBy: { date: 'desc' }, take: 10 },
      grades: { include: { subject: true }, orderBy: { date: 'desc' }, take: 5 }
    }
  });

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <Link href="/admin/users" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors mb-4 w-fit">
        <ChevronLeft size={16} /> Back to Directory
      </Link>
      
      <PageHeader 
        title="Student Master Profile" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Identity */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 mb-4">
                  {student.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{student.name}</h2>
                <p className="text-slate-500">{student.registrationNo}</p>
                <div className="mt-4 flex gap-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-medium">
                    {student.curriculum}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded text-xs font-medium">
                    Class {student.classroom?.name || "Unassigned"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Heart size={16} className="text-red-500" /> Medical & Welfare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">Blood Group</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{student.bloodGroup || "Not specified"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Medical Notes</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{student.medicalNotes || "None"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Learning Needs (IEP)</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{student.learningNeeds || "None identified"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details & Academics */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <User size={16} className="text-slate-400" /> Parent / Guardian
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.parent ? (
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{student.parent.user.name}</p>
                    <p className="text-sm text-slate-500">{student.parent.user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{student.parent.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No guardian linked.</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <User size={16} className="text-slate-400" /> Demographics & Background
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">Nationality</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.nationality || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Religion</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.religion || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Community</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.community || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Mother Tongue</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.motherTongue || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Father's Name</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.fatherName || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Mother's Name</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.motherName || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Mother's Occupation</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.motherOccupation || "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <BookOpen size={16} className="text-slate-400" /> Recent Academic Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.grades.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {student.grades.map(grade => (
                    <div key={grade.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div>
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{grade.subject.name}</p>
                        <p className="text-xs text-slate-500">{grade.examName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{grade.score} / {grade.maxScore}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-4">No recent grades available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
