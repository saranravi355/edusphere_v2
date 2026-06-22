import PageHeader from "@/components/ui/PageHeader";
import { User, BookOpen, HeartPulse, Phone } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function StudentRegistrationPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) redirect('/');

  async function registerStudent(formData: FormData) {
    "use server";
    
    // Parse form data
    const name = formData.get("name") as string;
    const registrationNo = formData.get("registrationNo") as string;
    const dobString = formData.get("dob") as string;
    const gender = formData.get("gender") as string;
    const address = formData.get("address") as string;
    
    const curriculum = formData.get("curriculum") as string;
    
    const medicalNotes = formData.get("medicalNotes") as string;
    const bloodGroup = formData.get("bloodGroup") as string;
    const learningNeeds = formData.get("learningNeeds") as string;
    
    const emergencyContactName = formData.get("emergencyContactName") as string;
    const emergencyContactPhone = formData.get("emergencyContactPhone") as string;

    if (!name || !registrationNo) return;

    try {
      await prisma.student.create({
        data: {
          name,
          registrationNo,
          dateOfBirth: dobString ? new Date(dobString) : null,
          gender,
          address,
          curriculum,
          medicalNotes,
          bloodGroup,
          learningNeeds,
          emergencyContactName,
          emergencyContactPhone,
          isActive: true
        }
      });
      revalidatePath("/admin/users");
    } catch (e) {
      console.error("Registration failed", e);
    }
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader 
        title="Student Enrollment" 
        description="Comprehensive registration system for new admissions."
      />

      <form action={registerStudent} className="space-y-8">
        {/* Personal Details */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-3">
            <User className="text-blue-600 dark:text-blue-400" size={20} />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Personal Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Legal Name *</label>
              <input required type="text" name="name" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label>
              <input type="date" name="dob" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
              <select name="gender" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white">
                <option value="">Select Gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Residential Address</label>
              <textarea name="address" rows={2} className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white"></textarea>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-3">
            <BookOpen className="text-purple-600 dark:text-purple-400" size={20} />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Academic Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registration / Admission No *</label>
              <input required type="text" name="registrationNo" placeholder="e.g. STU-2026-001" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Curriculum</label>
              <select required name="curriculum" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white">
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="IB">International Baccalaureate (IB)</option>
                <option value="IGCSE">Cambridge IGCSE</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medical & SEN */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-3">
            <HeartPulse className="text-red-500" size={20} />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Medical & SEN Records</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
              <select name="bloodGroup" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white">
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="O+">O+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="A-">A-</option>
                <option value="O-">O-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Special Education Needs (SEN)</label>
              <input type="text" name="learningNeeds" placeholder="e.g. Dyslexia support required" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white" />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Allergies & Medical Notes</label>
              <textarea name="medicalNotes" rows={2} placeholder="List any known allergies or conditions..." className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white"></textarea>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-3">
            <Phone className="text-green-600 dark:text-green-400" size={20} />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Emergency Contacts</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Name</label>
              <input type="text" name="emergencyContactName" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
              <input type="tel" name="emergencyContactPhone" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all">
            Complete Registration
          </button>
        </div>
      </form>
    </div>
  );
}
