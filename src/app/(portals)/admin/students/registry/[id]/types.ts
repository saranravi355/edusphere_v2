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
  motherMonthlyIncome: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;

  previousSchool: string | null;
  admissionDate: string;
  bloodGroup: string | null;
  learningNeeds: string | null;
  allergies: string | null;
  medicalNotes: string | null;

  /**
   * Background. Collected by the bulk importer and filled in for 155 of the
   * 173 students on file, and until now displayed nowhere at all — the columns
   * existed, the import wrote them, and no screen read them back.
   */
  nationality: string | null;
  religion: string | null;
  community: string | null;
  motherTongue: string | null;
  medium: string | null;

  attendancePresent: number;
  attendanceTotal: number;
  attendanceRatio: number | null;

  ibSubjects: { id: string; subjectName: string; level: string; currentGrade: number | null; predictedGrade: number | null }[];
  ibCore: { id: string; element: string; status: string; grade: string | null }[];
  recentAssessments: { id: string; title: string; subjectName: string; grade: number; date: string }[];
  recentGrades: { id: string; subjectName: string; examName: string; score: number; maxScore: number }[];
}
