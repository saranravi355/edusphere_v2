import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, Phone, Mail } from "lucide-react";

export default async function AdminSchoolsPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) {
    redirect("/");
  }

  const schools = [
    {
      id: 1,
      name: "EduSphere Central Academy",
      address: "123 Education Blvd, Metro City",
      phone: "+1 555-0101",
      email: "central@edusphere.com",
      students: 1250,
      status: "Active",
      type: "Primary & Secondary"
    },
    {
      id: 2,
      name: "EduSphere North Campus",
      address: "45 Innovation Way, North District",
      phone: "+1 555-0202",
      email: "north@edusphere.com",
      students: 840,
      status: "Active",
      type: "High School"
    }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader 
        title="School Directory" 
        description="Manage multi-tenant school branches and campuses."
        action={
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm">
            + Add Campus
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schools.map(school => (
          <Card key={school.id} className="glass-card hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Building size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{school.name}</CardTitle>
                    <p className="text-xs text-slate-500 font-medium">{school.type}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">
                  {school.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <MapPin size={16} className="text-slate-400" /> {school.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Phone size={16} className="text-slate-400" /> {school.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail size={16} className="text-slate-400" /> {school.email}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {school.students} Enrolled Students
                </span>
                <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                  Manage Settings
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
