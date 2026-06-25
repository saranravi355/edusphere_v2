import { TimetableEntryProps } from "@/components/timetable/TimetableGrid";

export const mockEntries: TimetableEntryProps[] = [
  { id: "1", dayOfWeek: 1, period: 1, subject: "Mathematics", teacher: "Sindhu Sharma", room: "Room 301" },
  { id: "2", dayOfWeek: 2, period: 1, subject: "Physics", teacher: "Ramesh Patel", room: "Room 301" },
  { id: "3", dayOfWeek: 3, period: 1, subject: "Mathematics", teacher: "Sindhu Sharma", room: "Room 301" },
  { id: "4", dayOfWeek: 4, period: 1, subject: "Chemistry", teacher: "Ramesh Patel", room: "Chemistry Lab" },
  { id: "5", dayOfWeek: 5, period: 1, subject: "Calculus", teacher: "Sindhu Sharma", room: "Room 301" },
  
  { id: "6", dayOfWeek: 1, period: 2, subject: "Physics", teacher: "Ramesh Patel", room: "Room 301" },
  { id: "7", dayOfWeek: 2, period: 2, subject: "Mathematics", teacher: "Sindhu Sharma", room: "Room 301" },
  { id: "8", dayOfWeek: 3, period: 2, subject: "Calculus", teacher: "Sindhu Sharma", room: "Room 301" },
  { id: "9", dayOfWeek: 4, period: 2, subject: "Physics", teacher: "Ramesh Patel", room: "Room 301" },
  { id: "10", dayOfWeek: 5, period: 2, subject: "Mathematics", teacher: "Sindhu Sharma", room: "Room 301" },

  { id: "11", dayOfWeek: 1, period: 3, subject: "English Language", teacher: "Ananya Iyer", room: "Room 301" },
  { id: "12", dayOfWeek: 2, period: 3, subject: "World History", teacher: "Rajesh Kumar", room: "Room 301" },
  { id: "13", dayOfWeek: 3, period: 3, subject: "Physics", teacher: "Ramesh Patel", room: "Physics Lab" },
  { id: "14", dayOfWeek: 4, period: 3, subject: "English Literature", teacher: "Ananya Iyer", room: "Room 301" },
  { id: "15", dayOfWeek: 5, period: 3, subject: "Chemistry", teacher: "Ramesh Patel", room: "Room 301" },

  { id: "16", dayOfWeek: 1, period: 4, subject: "World History", teacher: "Rajesh Kumar", room: "Room 301" },
  { id: "17", dayOfWeek: 2, period: 4, subject: "English Literature", teacher: "Ananya Iyer", room: "Room 301" },
  { id: "18", dayOfWeek: 3, period: 4, subject: "English Language", teacher: "Ananya Iyer", room: "Room 301" },
  { id: "19", dayOfWeek: 4, period: 4, subject: "World History", teacher: "Rajesh Kumar", room: "Room 301" },
  { id: "20", dayOfWeek: 5, period: 4, subject: "World History", teacher: "Rajesh Kumar", room: "Room 301" },

  { id: "21", dayOfWeek: 1, period: 5, subject: "Chemistry", teacher: "Ramesh Patel", room: "Science Lab" },
  { id: "22", dayOfWeek: 2, period: 5, subject: "Chemistry", teacher: "Ramesh Patel", room: "Room 301" },

  { id: "23", dayOfWeek: 1, period: 6, subject: "Calculus", teacher: "Sindhu Sharma", room: "Room 301" },
];

export const teacherPlannerMockEntries: TimetableEntryProps[] = mockEntries.filter(
  entry => entry.teacher === "Sindhu Sharma"
);
