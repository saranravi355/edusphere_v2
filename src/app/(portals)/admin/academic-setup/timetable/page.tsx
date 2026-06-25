"use client";

import PageHeader from "@/components/ui/PageHeader";
import { CalendarDays, BrainCircuit, Wand2, CheckCircle2, AlertTriangle, Users, Building } from "lucide-react";
import { useState } from "react";

import TimetableGrid from "@/components/timetable/TimetableGrid";
import { mockEntries } from "@/lib/mockTimetable";

export default function AITimetableOptimizer() {
  const [generating, setGenerating] = useState(false);
  const [complete, setComplete] = useState(false);

  const generateTimetable = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setComplete(true);
    }, 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="Timetable" 
          description="Click slots to allocate room resources and instructors"
        />
        
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-sm mt-4">
          <span className="text-sm font-medium text-slate-500">Section:</span>
          <select className="bg-transparent border-none outline-none text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[150px]">
            <option>Grade 10 - Section A</option>
            <option>Grade 10 - Section B</option>
            <option>Grade 9 - Section A</option>
          </select>
        </div>
      </div>

      {/* Hero Control Panel */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30 mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={150} />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Algorithmic Scheduling</h2>
            <p className="text-indigo-200 text-sm mb-6 max-w-md leading-relaxed">
              Our AI evaluates 10,000+ permutations per second to map Teachers, Subjects, and Rooms without overlapping.
            </p>
            
            <div className="flex gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-indigo-300">Teachers Loaded</p>
                <p className="text-xl font-bold">42</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-indigo-300">Rooms Available</p>
                <p className="text-xl font-bold">28</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-indigo-300">Classes</p>
                <p className="text-xl font-bold">15</p>
              </div>
            </div>

            {!complete ? (
              <button 
                onClick={generateTimetable}
                disabled={generating}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70 w-full sm:w-auto justify-center"
              >
                {generating ? (
                  <><Wand2 size={18} className="animate-spin"/> Calculating Permutations...</>
                ) : (
                  <><BrainCircuit size={18} /> Auto-Generate Schedule</>
                )}
              </button>
            ) : (
              <button className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center">
                <CheckCircle2 size={18} /> Publish to Portals
              </button>
            )}
          </div>

          {/* Visualization Area */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/10 h-64 flex flex-col justify-center items-center relative overflow-hidden">
            {generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-mono text-xs text-indigo-300 animate-pulse">Running constraint satisfaction...</p>
                <p className="font-mono text-xs text-indigo-400 mt-1">Resolving Room 102 conflict...</p>
              </div>
            )}
            
            {complete ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-bold text-lg text-white">0 Conflicts Found</h3>
                <p className="text-xs text-indigo-200 mt-1">Optimal schedule generated in 2.4s</p>
              </div>
            ) : (
              <div className="text-center opacity-50">
                <CalendarDays size={48} className="mx-auto mb-3 text-indigo-400" />
                <p className="text-sm">Ready to optimize</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={generating ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity duration-500"}>
        <TimetableGrid 
          entries={complete ? mockEntries : []} 
          isEditable={true} 
          onAllocate={(day, period) => {
            alert(`Allocate for Day ${day}, Period ${period}`);
          }}
        />
      </div>
    </div>
  );
}
