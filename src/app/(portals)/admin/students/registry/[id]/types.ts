export interface StudentProfile {
  id: string;
  photoUrl: string | null;
  registrationNo: string;
  rollNumber: string | null;
  name: string;
  dateOfBirth: string | null;
  gender: string | null;
  curriculum: string;
  className: string | null;
  gradeLevel: number | null;
  section: string | null;
  academicYear: string | null;
  isActive: boolean;

  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;

  fatherName: string | null;
  fatherPhone: string | null;
  fatherEmail: string | null;
  motherName: string | null;
  motherPhone: string | null;
  motherEmail: string | null;
  motherOccupation: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;

  previousSchool: string | null;
  admissionDate: string;
  bloodGroup: string | null;
  learningNeeds: string | null;
  allergies: string | null;

  attendancePresent: number;
  attendanceTotal: number;
  attendanceRatio: number | null;

  ibSubjects: { id: string; subjectName: string; level: string; currentGrade: number | null; predictedGrade: number | null }[];
  ibCore: { id: string; element: string; status: string; grade: string | null }[];
  recentAssessments: { id: string; title: string; subjectName: string; grade: number; date: string }[];
  recentGrades: { id: string; subjectName: string; examName: string; score: number; maxScore: number }[];
}
