import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Search, Download } from "lucide-react";

export default async function StudentLibraryPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const books = [
    { id: 1, title: "Advanced Mathematics vol 2", category: "Mathematics", cover: "bg-blue-500", size: "12 MB" },
    { id: 2, title: "Physics: Principles & Problems", category: "Science", cover: "bg-purple-500", size: "45 MB" },
    { id: 3, title: "World History: Modern Era", category: "History", cover: "bg-orange-500", size: "28 MB" },
    { id: 4, title: "English Literature 101", category: "Languages", cover: "bg-teal-500", size: "5 MB" },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader 
        title="Digital E-Library" 
        description="Access your textbooks and recommended reading materials."
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search textbooks, topics..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none">
            <option>All Subjects</option>
            <option>Mathematics</option>
            <option>Science</option>
            <option>History</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {books.map(book => (
          <Card key={book.id} className="glass-card hover:-translate-y-1 transition-transform cursor-pointer group">
            <CardContent className="p-0">
              {/* Fake Book Cover */}
              <div className={`h-48 w-full ${book.cover} rounded-t-xl relative overflow-hidden flex items-end p-4`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <BookOpen className="text-white/20 absolute top-4 right-4 w-16 h-16" />
                <h3 className="text-white font-bold text-lg relative z-10 leading-tight">
                  {book.title}
                </h3>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{book.category}</p>
                  <p className="text-xs text-slate-400 mt-1">{book.size}</p>
                </div>
                <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Download size={14} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
