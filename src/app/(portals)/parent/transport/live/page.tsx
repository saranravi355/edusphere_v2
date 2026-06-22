"use client";

import PageHeader from "@/components/ui/PageHeader";
import { Bus, MapPin, Clock, Navigation, AlertCircle, Phone, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function LiveTransportTracker() {
  const [eta, setEta] = useState(12);
  const [distance, setDistance] = useState(3.4);

  // Simulate bus moving
  useEffect(() => {
    const interval = setInterval(() => {
      setEta(prev => Math.max(0, prev - 1));
      setDistance(prev => Math.max(0, Number((prev - 0.2).toFixed(1))));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader 
        title="Live Transport Tracker" 
        description="Real-time GPS tracking for Route 04 (Downtown / Main St)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Mockup */}
        <div className="lg:col-span-2 relative h-[500px] bg-slate-100 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 shadow-sm">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 opacity-50 dark:opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #cbd5e1 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}></div>
          
          {/* Map Roads lines (CSS Mockup) */}
          <div className="absolute top-1/2 left-0 right-0 h-4 bg-slate-300 dark:bg-zinc-700 -translate-y-1/2"></div>
          <div className="absolute left-1/3 top-0 bottom-0 w-4 bg-slate-300 dark:bg-zinc-700 -translate-x-1/2"></div>

          {/* School Marker */}
          <div className="absolute top-[20%] left-[33%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="p-3 bg-indigo-600 text-white rounded-full shadow-lg">
              <BuildingIcon />
            </div>
            <span className="mt-2 font-bold text-sm bg-white dark:bg-zinc-900 px-3 py-1 rounded-full shadow-sm">EduSphere Campus</span>
          </div>

          {/* Stop Marker */}
          <div className="absolute top-[50%] right-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="p-3 bg-red-500 text-white rounded-full shadow-lg">
              <MapPin size={24} />
            </div>
            <span className="mt-2 font-bold text-sm bg-white dark:bg-zinc-900 px-3 py-1 rounded-full shadow-sm">Your Stop (Main St)</span>
          </div>

          {/* Bus Marker (Moving) */}
          <div 
            className="absolute top-[50%] -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-linear z-10"
            style={{ left: `${33 + ((12 - eta) / 12) * 47}%` }}
          >
            <div className="p-3 bg-yellow-400 text-yellow-900 rounded-full shadow-xl border-2 border-white dark:border-zinc-900 animate-bounce">
              <Bus size={24} />
            </div>
            <span className="mt-2 font-bold text-sm bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
              <Navigation size={12} /> {distance} km
            </span>
          </div>
        </div>

        {/* Status Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Navigation size={18} className="text-blue-500" />
              Live Journey Status
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-xl">
                  {eta}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Estimated Arrival</p>
                  <p className="font-bold text-lg text-slate-800 dark:text-slate-100">Minutes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Scheduled Time</p>
                  <p className="font-bold text-lg text-slate-800 dark:text-slate-100">07:45 AM</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Status</p>
                  <p className="font-bold text-lg text-green-600 dark:text-green-400">On Time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Driver Details</p>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">MP</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Mark Peterson</p>
                  <p className="text-xs text-slate-500">Vehicle ID: BUS-402</p>
                </div>
              </div>
              <button className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
                <Phone size={18} />
              </button>
            </div>
            
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-amber-800 dark:text-amber-400">Please arrive at the stop 5 minutes before the ETA. The bus will only wait for 60 seconds.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <path d="M9 22v-4h6v4"></path>
      <path d="M8 6h.01"></path>
      <path d="M16 6h.01"></path>
      <path d="M12 6h.01"></path>
      <path d="M12 10h.01"></path>
      <path d="M12 14h.01"></path>
      <path d="M16 10h.01"></path>
      <path d="M16 14h.01"></path>
      <path d="M8 10h.01"></path>
      <path d="M8 14h.01"></path>
    </svg>
  );
}
