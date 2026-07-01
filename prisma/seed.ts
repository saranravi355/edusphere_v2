import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Seeding 5 Staff and 5 Students...')

  // Create Staff (1 Principal, 2 Super Admins, 2 Teachers)
  const staffs = [
    { email: 'principal@edusphere.com', name: 'Dr. Meena Krishnan', role: 'PRINCIPAL' },
    { email: 'admin1@edusphere.com', name: 'Amit Patel', role: 'SUPER_ADMIN' },
    { email: 'admin2@edusphere.com', name: 'Priya Sharma', role: 'SUPER_ADMIN' },
    { email: 'teacher1@edusphere.com', name: 'Rajesh Kumar', role: 'CLASS_TEACHER' },
    { email: 'teacher2@edusphere.com', name: 'Sindhu Sharma', role: 'SUBJECT_TEACHER' }
  ];

  const teacherRecords: { id: string; userId: string; name: string }[] = [];

  for (const staff of staffs) {
    const user = await prisma.user.upsert({
      where: { email: staff.email },
      update: { name: staff.name },
      create: {
        email: staff.email,
        name: staff.name,
        role: staff.role,
        password: 'password123'
      }
    });

    if (staff.role === 'CLASS_TEACHER' || staff.role === 'SUBJECT_TEACHER') {
      const teacher = await prisma.teacher.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          subjects: 'Mathematics, Science',
          qualifications: 'B.Ed, M.Sc',
          yearsExperience: 5
        }
      });
      teacherRecords.push({ id: teacher.id, userId: user.id, name: staff.name });
    }
  }

  // Add a few more teachers so classrooms/subjects have realistic staffing
  const extraTeachers = [
    { email: 'teacher3@edusphere.com', name: 'Ananya Bose', subjects: 'English, Individuals & Societies' },
    { email: 'teacher4@edusphere.com', name: 'Vikram Nair', subjects: 'Sciences, Mathematics' },
    { email: 'teacher5@edusphere.com', name: 'Fatima Sheikh', subjects: 'Visual Arts, Spanish B' },
  ];
  for (const t of extraTeachers) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name },
      create: { email: t.email, name: t.name, role: 'SUBJECT_TEACHER', password: 'password123' }
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, subjects: t.subjects, qualifications: 'B.Ed, M.A', yearsExperience: 3 + Math.floor(Math.random() * 10) }
    });
    teacherRecords.push({ id: teacher.id, userId: user.id, name: t.name });
  }

  const firstNames = ['Aarav', 'Ananya', 'Rohan', 'Kavya', 'Kabir', 'Aditi', 'Vivaan', 'Diya', 'Arjun', 'Sanya', 'Sai', 'Mira', 'Krishna', 'Isha', 'Reyansh', 'Neha', 'Aryan', 'Priya', 'Shaurya', 'Riya', 'Dhruv', 'Sneha', 'Ayaan', 'Tanya', 'Ishaan'];
  const lastNames = ['Patel', 'Iyer', 'Desai', 'Singh', 'Verma', 'Sharma', 'Reddy', 'Rao', 'Das', 'Nair', 'Mehta', 'Bose', 'Gupta', 'Chopra', 'Joshi'];
  const curriculums = ['PYP', 'MYP', 'DP']; // IB programmes only
  const genders = ['Male', 'Female'];
  const bgs = ['O+', 'A+', 'B+', 'O-', 'AB+'];
  const communities = ['OC - Other Communities', 'MBC', 'BC - Others', 'ST', 'SC - Others'];
  const tongues = ['HINDI', 'TAMIL', 'GUJARATI', 'PUNJABI', 'TELUGU', 'MARATHI'];

  const students = [];
  for (let i = 1; i <= 30; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const gender = fn.endsWith('a') || fn.endsWith('i') ? 'Female' : 'Male'; // simple heuristic
    students.push({
      name: `${fn} ${ln}`,
      reg: `STU-26-10${i.toString().padStart(2, '0')}`,
      cur: curriculums[Math.floor(Math.random() * curriculums.length)],
      gender: gender,
      dob: `201${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 11) + 1}-15`,
      bg: bgs[Math.floor(Math.random() * bgs.length)],
      nationality: 'INDIAN',
      religion: 'HINDU',
      community: communities[Math.floor(Math.random() * communities.length)],
      motherTongue: tongues[Math.floor(Math.random() * tongues.length)],
      fatherName: `Mr. ${ln}`,
      motherName: `Mrs. ${ln}`,
      motherOccupation: 'Private',
      motherMonthlyIncome: '50000',
      medium: 'English'
    });
  }

  const studentRecords: { id: string; name: string; userId: string | null }[] = [];

  for (const stu of students) {
    // Optionally create User for student
    const sUser = await prisma.user.upsert({
      where: { email: `${stu.reg.toLowerCase()}@student.edusphere.com` },
      update: { name: stu.name },
      create: {
        email: `${stu.reg.toLowerCase()}@student.edusphere.com`,
        name: stu.name,
        role: 'STUDENT',
        password: 'password123'
      }
    });

    const student = await prisma.student.upsert({
      wher