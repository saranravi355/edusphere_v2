import { TimetableEntryProps } from "@/components/timetable/TimetableGrid";

/**
 * Builds an authentic weekly timetable directly from a student's REAL IB
 * subject records — so every cell shows the subject the student actually takes
 * (English A, Mathematics: A&A HL, Visual Arts SL, ...) rather than generic mock
 * subjects. Deterministic: the same inputs always produce the same grid, so it's
 * stable across renders. No database writes required.
 */

export type TimetableSubjectInput = {
  subjectName: string;
  level: string; // HL / SL (DP) or MYP
  subjectGroup: number; // IB group 1-6
};

const DAYS = 5; // Mon–Fri
const PERIODS = 6;

// Realistic study/free periods so the week isn't wall-to-wall lessons.
function isFreePeriod(day: number, period: number): boolean {
  return period === PERIODS && (day === 3 || day === 5); // Wed & Fri last period
}

function roomFor(name: string, index: number): string {
  const n = name.toLowerCase();
  if (n.includes("physics")) return "Physics Lab";
  if (n.includes("chemistry")) return "Chemistry Lab";
  if (n.includes("biology")) return "Biology Lab";
  if (n.includes("science")) return "Science Lab";
  if (n.includes("computer")) return "Computing Lab";
  if (n.includes("art")) return "Art Studio";
  if (n.includes("music")) return "Music Room";
  if (n.includes("theatre") || n.includes("dance") || n.includes("film")) return "Drama Studio";
  return `Room ${201 + (index % 12)}`;
}

export function buildWeeklyTimetable(
  subjects: TimetableSubjectInput[],
  teachers: string[] = []
): TimetableEntryProps[] {
  const entries: TimetableEntryProps[] = [];
  const n = subjects.length;
  if (n === 0) return entries;

  let id = 1;
  for (let day = 1; day <= DAYS; day++) {
    for (let period = 1; period <= PERIODS; period++) {
      if (isFreePeriod(day, period)) continue;
      // Latin-square rotation: each subject shifts one slot per day, giving a
      // balanced, non-repetitive spread across the week.
      const subjIdx = (period - 1 + (day - 1)) % n;
      const subj = subjects[subjIdx];
      entries.push({
        id: String(id++),
        dayOfWeek: day,
        period,
        subject: subj.subjectName,
        level: subj.level,
        teacher: teachers.length ? teachers[subjIdx % teachers.length] : "",
        room: roomFor(subj.subjectName, subjIdx),
      });
    }
  }
  return entries;
}
