import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, ChevronDown } from "lucide-react";
import ExportButton from "@/components/data/ExportButton";

export default async function StudentRegistryPage() {
  const students = await prisma.student.findMany({
    include: { 
      classroom: true,
      parent: {
        include: { user: true }
      },
      attendances: true,
      invoices: true,
      behaviorIncidents: true
    }
  });

  const enrolledCount = students.length;
  let pendingFeeCount = 0;

  const tableRows = students.map(student => {
    // Presence Index Calculation
    const attendances = student.attendances;
    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
    const presenceRatio = totalDays > 0 ? presentDays / totalDays : 1; // Default to 100% if no data
    const presencePercentage = (presenceRatio * 100).toFixed(1);
    
    // Fee Status Calculation
    const unpaidInvoices = student.invoices.filter(i => i.status === 'PENDING');
    const hasUnpaid = unpaidInvoices.length > 0;
    if (hasUnpaid) pendingFeeCount++;
    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const feeStatusText = hasUnpaid ? `₹${totalUnpaid >= 1000 ? (totalUnpaid/1000).toFixed(0) + 'k' : totalUnpaid}` : 'Paid';
    const feeStatusColor = hasUnpaid ? 'text-yellow-400' : 'text-teal-400';

    // Academic Risk Calculation (Based on Demerits)
    const demerits = student.behaviorIncidents.filter(i => i.type === 'DEMERIT').length;
    let riskLevel = 'Low';
    let riskColor = 'text-teal-400';
    if (demerits >= 3) {
      riskLevel = 'High';
      riskColor = 'text-red-400';
    } else if (demerits > 0) {
      riskLevel = 'Medium';
      riskColor = 'text-yellow-400';
    }

    // Colors for Progress Bar
    let barColor = 'bg-teal-400';
    if (presenceRatio < 0.75) barColor = 'bg-red-400';
    else if (presenceRatio < 0.90) barColor = 'bg-yellow-400';

    return {
      id: student.id,
      regNo: student.registrationNo,
      name: student.name,
      initial: student.name.charAt(0).toUpperCase(),
      class: student.classroom?.name || 'Unassigned',
      parentName: student.parent?.user?.name || student.emergencyContactName || 'N/A',
      parentPhone: student.parent?.phone || student.emergencyContactPhone || 'N/A',
      presencePercentage,
      presenceRatio,
      barColor,
      feeStatusText,
      feeStatusColor,
      riskLevel,
      riskColor,
    };
  });

  const exportRows = tableRows.map((r) => ({ RegNo: r.regNo, Name: r.name, Class: r.class, Parent: r.parentName, Phone: r.parentPhone, Attendance: `${r.presencePercentage}%`, FeeStatus: r.feeStatusText, Risk: r.riskLevel }));

  return (
    <div className="bg-white min-h-[calc(100vh-100px)] font-sans -mt-6 -mx-8 px-8 py-12 md:px-16 text-slate-800 rounded-tl-3xl shadow-sm border-l border-t border-slate-100">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-16 gap-6">
          <div>
            <h1 className="text-[2.5rem] leading-tight font-extrabold tracking-tight mb-2 text-black">Student Registry</h1>
            <p className="text-slate-400 text-[13px] font-medium tracking-wide">
              {enrolledCount} students enrolled &middot; {pendingFeeCount} pending fee collections
            </p>
            <div className="mt-4"><ExportButton rows={exportRows} filename="student-registry" /></div>
          </div>
          <Link href="/admin/students/register">
            <button className="bg-[#111] hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-md">
              <Plus size={16} />
              Enroll Student
            </button>
          </Link>
        </div>

        {/* Filter Section */}
        <div className="flex justify-end mb-8">
          <button className="flex items-center gap-2 text-slate-400 hover:text-slate-800 text-[13px] font-medium transition-colors bg-transparent border-none outline-none">
            All Classes <ChevronDown size={14} className="opacity-50" />
          </button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-100 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 px-2">
          <div className="col-span-3">Student ID</div>
          <div className="col-span-2">Class</div>
          <div className="col-span-2">Parent / Contact</div>
          <div className="col-span-2">Presence Index</div>
          <div className="col-span-1">Fee Status</div>
          <div className="col-span-1">Academic Risk</div>
          <div className="col-span-1 text-right"></div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col gap-1">
          {tableRows.map((row) => (
            <div key={row.id} className="grid grid-cols-12 gap-4 items-center py-[18px] border-b border-slate-50 hover:bg-slate-50/50 transition-colors rounded-2xl px-2">
              
              {/* Student ID Column */}
              <div className="col-span-3 flex items-center gap-5">
                <div className="w-6 h-6 flex-shrink-0 bg-transparent flex items-center justify-center font-bold text-slate-400 text-xs">
                  {row.initial}
                </div>
                <div>
                  <p className="font-bold text-[13px] text-black">{row.name}</p>
                  <p className="text-[10px] text-slate-300 font-medium tracking-wider mt-[3px] uppercase">{row.regNo}</p>
                </div>
              </div>

              {/* Class Column */}
              <div className="col-span-2">
                <span className="text-[12px] font-bold text-blue-500 uppercase tracking-wide">
                  {row.class}
                </span>
              </div>

              {/* Parent Column */}
              <div className="col-span-2">
                <p className="font-bold text-[13px] text-black">{row.parentName}</p>
                <p className="text-[10px] text-slate-300 font-medium mt-[3px] tracking-wider">{row.parentPhone}</p>
              </div>

              {/* Presence Index */}
              <div className="col-span-2 flex items-center gap-4">
                <div className="w-12 h-[3px] bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${row.barColor} rounded-full`} 
                    style={{ width: `${row.presenceRatio * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-black">{row.presencePercentage}%</span>
              </div>

              {/* Fee Status */}
              <div className="col-span-1">
                <span className={`text-[11px] font-bold ${row.feeStatusColor}`}>
                  {row.feeStatusText}
                </span>
              </div>

              {/* Academic Risk */}
              <div className="col-span-1">
                <span className={`text-[11px] font-bold ${row.riskColor}`}>
                  {row.riskLevel}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-1 text-right">
                <Link href={`/admin/users/${row.id}`} className="text-[11px] font-semibold text-slate-400 hover:text-black transition-colors">
                  Profile
                </Link>
              </div>

            </div>
          ))}
        </div>

        {/* Footer Pagination */}
        <div className="flex justify-between items-center mt-16 pb-8 text-[11px] font-medium text-slate-400">
          <p className="tracking-wide">1–{tableRows.length} of {tableRows.length} students</p>
          <div className="flex items-center gap-6">
            <span className="text-black font-bold tracking-widest">1 / 1</span>
            <button className="hover:text-black transition-colors text-lg font-light pb-0.5">&gt;</button>
          </div>
        </div>

      </div>
    </div>
  );
}
