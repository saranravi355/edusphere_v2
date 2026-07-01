import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { Plus, BookOpen, Monitor, MapPin, Search } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ResourcesPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/');

  const resources = await prisma.resource.findMany({
    orderBy: { name: 'asc' }
  });

  async function createResource(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const capacity = parseInt(formData.get("capacity") as string) || null;

    if (!name || !type) return;

    await prisma.resource.create({
      data: { name, type, capacity, status: "AVAILABLE" }
    });
    revalidatePath("/admin/resources");
  }

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
        action={
          <Modal
            title="Add New Resource"
            buttonText="New Resource"
            buttonIcon={<Plus size={16} />}
          >
            <form action={createResource} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resource Name</label>
                <input required type="text" name="name" placeholder="e.g. Chemistry Lab 1" className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select required name="type" className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                    <option value="FACILITY">Facility / Room</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="LIBRARY_BOOK">Library Book</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity (Optional)</label>
                  <input type="number" name="capacity" placeholder="e.g. 30" className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-white" />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mt-4">
                Add to Directory
              </button>
            </form>
          </Modal>
        }
      />

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Filter:</span>
            <select className="text-sm p-1.5 border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-black text-slate-700 dark:text-slate-300">
              <option>All Types</option>
              <option>Facilities</option>
              <option>Equipment</option>
              <option>Library</option>
            </select>
          </div>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-zinc-900/30">
              <th className="p-4 font-medium">Resource Name</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium text-center">Capacity</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <MapPin className="text-emerald-500" />
                    </div>
                    Chemistry Lab 1
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">FACILITY</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">30</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      AVAILABLE
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400">
                      Manage
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Monitor className="text-purple-500" />
                    </div>
                    Projector A
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">EQUIPMENT</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">-</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      IN USE
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400">
                      Manage
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <BookOpen className="text-blue-500" />
                    </div>
                    Advanced Physics Vol 1
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">LIBRARY BOOK</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">-</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      AVAILABLE
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400">
                      Manage
                    </button>
                  </td>
                </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
                      