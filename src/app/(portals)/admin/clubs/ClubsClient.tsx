"use client";

import { useState } from "react";
import {
  Users, Trophy, Wrench, Bus, HeartHandshake, CalendarDays, ChevronDown,
  ChevronUp, MapPin, CheckCircle2, Tent, Sparkles,
} from "lucide-react";

interface Member {
  name: string;
  registrationNo: string;
  classroom: string | null;
}

interface Activity {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  description: string | null;
  outcome: string | null;
}

interface ClubRow {
  id: string;
  name: string;
  description: string;
  advisor: string;
  members: Member[];
  past: Activity[];
  upcoming: Activity[];
}

const TYPE_META: Record<string, { icon: typeof Trophy; cls: string }> = {
  COMPETITION: { icon: Trophy, cls: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
  WORKSHOP: { icon: Wrench, cls: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  TRIP: { icon: Bus, cls: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
  SERVICE: { icon: HeartHandshake, cls: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400" },
  MEETING: { icon: Users, cls: "text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-slate-300" },
  EVENT: { icon: Sparkles, cls: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default function ClubsClient({ clubs }: { clubs: ClubRow[] }) {
  const [open, setOpen] = useState<string | null>(clubs[0]?.id || null);
  const [tab, setTab] = useState<"members" | "past" | "upcoming">("upcoming");

  const totalMembers = clubs.reduce((n, c) => n + c.members.length, 0);
  const totalUpcoming = clubs.reduce((n, c) => n + c.upcoming.length, 0);
  const totalPast = clubs.reduce((n, c) => n + c.past.length, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active clubs", value: clubs.length, icon: Tent, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
          { label: "Student members", value: totalMembers, icon: Users, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "Activities completed", value: totalPast, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
          { label: "Upcoming events", value: totalUpcoming, icon: CalendarDays, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Club cards */}
      {clubs.map((club) => {
        const isOpen = open === club.id;
        return (
          <div key={club.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : club.id)}
              className="w-full p-6 flex items-center gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                <Tent size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{club.name}</h3>
                <p className="text-sm text-slate-500 truncate">{club.description}</p>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 whitespace-nowrap">
                <span className="font-bold">{club.members.length} members</span>
                <span>{club.upcoming.length} upcoming</span>
                <span>Advisor: {club.advisor}</span>
              </div>
              {isOpen ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 dark:border-zinc-800">
                {/* Tabs */}
                <div className="flex gap-1 px-6 pt-4">
                  {([
                    ["upcoming", `Upcoming events (${club.upcoming.length})`],
                    ["past", `Past activities (${club.past.length})`],
                    ["members", `Members (${club.members.length})`],
                  ] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors ${
                        tab === id ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {tab === "members" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {club.members.length === 0 && <p className="text-xs text-slate-400 col-span-3">No members enrolled yet.</p>}
                      {club.members.map((m) => (
                        <div key={m.registrationNo} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {m.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{m.name}</p>
                            <p className="text-[11px] text-slate-400">{m.classroom || "—"} · {m.registrationNo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(tab === "past" || tab === "upcoming") && (
                    <div className="space-y-3">
                      {(tab === "past" ? club.past : club.upcoming).length === 0 && (
                        <p className="text-xs text-slate-400">{tab === "past" ? "No completed activities yet." : "Nothing scheduled — add an event."}</p>
                      )}
                      {(tab === "past" ? club.past : club.upcoming).map((a) => {
                        const meta = TYPE_META[a.type] || TYPE_META.MEETING;
                        return (
                          <div key={a.id} className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.cls}`}>
                              <meta.icon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.title}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                                <span>{fmt(a.date)}</span>
                                {a.location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {a.location}</span>}
                                <span className="uppercase font-bold">{a.type.toLowerCase()}</span>
                              </p>
                              {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                              {a.outcome && (
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                  <CheckCircle2 size={12} /> {a.outcome}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
