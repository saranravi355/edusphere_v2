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
    { email: 'teacher6@edusphere.com', name: 'Devika Menon', subjects: 'Mathematics, Sciences' },
    { email: 'teacher7@edusphere.com', name: 'Arvind Rao', subjects: 'English, Individuals & Societies' },
    { email: 'teacher8@edusphere.com', name: 'Neha Kapoor', subjects: 'Sciences, Visual Arts' },
    { email: 'teacher9@edusphere.com', name: 'Suresh Iyer', subjects: 'Mathematics, Spanish B' },
    { email: 'teacher10@edusphere.com', name: 'Priyanka Das', subjects: 'English, Sciences' },
    { email: 'teacher11@edusphere.com', name: 'Rahul Chopra', subjects: 'Individuals & Societies, Mathematics' },
    { email: 'teacher12@edusphere.com', name: 'Lakshmi Venkatesh', subjects: 'Visual Arts, English' },
    { email: 'teacher13@edusphere.com', name: 'Manish Joshi', subjects: 'Sciences, Individuals & Societies' },
    { email: 'teacher14@edusphere.com', name: 'Divya Pillai', subjects: 'Mathematics, English' },
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
  for (let i = 1; i <= 150; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const gender = fn.endsWith('a') || fn.endsWith('i') ? 'Female' : 'Male'; // simple heuristic
    students.push({
      name: `${fn} ${ln}`,
      reg: `STU-26-${(1000 + i)}`,
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
      where: { registrationNo: stu.reg },
      update: {
        name: stu.name,
        dateOfBirth: new Date(stu.dob),
        gender: stu.gender,
        bloodGroup: stu.bg,
        curriculum: stu.cur,
        nationality: stu.nationality,
        religion: stu.religion,
        community: stu.community,
        motherTongue: stu.motherTongue,
        fatherName: stu.fatherName,
        motherName: stu.motherName,
        motherOccupation: stu.motherOccupation,
        motherMonthlyIncome: stu.motherMonthlyIncome,
        medium: stu.medium
      },
      create: {
        registrationNo: stu.reg,
        name: stu.name,
        dateOfBirth: new Date(stu.dob),
        gender: stu.gender,
        bloodGroup: stu.bg,
        curriculum: stu.cur,
        nationality: stu.nationality,
        religion: stu.religion,
        community: stu.community,
        motherTongue: stu.motherTongue,
        fatherName: stu.fatherName,
        motherName: stu.motherName,
        motherOccupation: stu.motherOccupation,
        motherMonthlyIncome: stu.motherMonthlyIncome,
        medium: stu.medium,
        isActive: true,
        userId: sUser.id,
        address: '123 School Lane, City',
        emergencyContactName: 'Parent of ' + stu.name,
        emergencyContactPhone: '+1234567890'
      }
    });
    studentRecords.push({ id: student.id, name: student.name, userId: sUser.id });
  }

  console.log('Seeding academic structure (classrooms, subjects, timetable)...');

  // ---- Classrooms (IB Programme naming: MYP1-5, DP1-2, with A/B sections) ----
  const classroomDefs = [
    { name: 'MYP1A', gradeLevel: 6 },
    { name: 'MYP1B', gradeLevel: 6 },
    { name: 'MYP2A', gradeLevel: 7 },
    { name: 'MYP2B', gradeLevel: 7 },
    { name: 'MYP3A', gradeLevel: 8 },
    { name: 'MYP3B', gradeLevel: 8 },
    { name: 'MYP4A', gradeLevel: 9 },
    { name: 'MYP4B', gradeLevel: 9 },
    { name: 'MYP5A', gradeLevel: 10 },
    { name: 'MYP5B', gradeLevel: 10 },
    { name: 'DP1A', gradeLevel: 11 },
    { name: 'DP1B', gradeLevel: 11 },
    { name: 'DP2A', gradeLevel: 12 },
    { name: 'DP2B', gradeLevel: 12 },
  ];

  const classroomRecords: { id: string; name: string; gradeLevel: number }[] = [];
  for (let i = 0; i < classroomDefs.length; i++) {
    const def = classroomDefs[i];
    const classTeacher = teacherRecords[i % teacherRecords.length];
    const existing = await prisma.classroom.findFirst({ where: { name: def.name } });
    const classroom = existing || await prisma.classroom.create({
      data: { name: def.name, gradeLevel: def.gradeLevel, teacherId: classTeacher.id }
    });
    classroomRecords.push({ id: classroom.id, name: classroom.name, gradeLevel: classroom.gradeLevel });
  }

  // Assign each student to a classroom round-robin
  for (let i = 0; i < studentRecords.length; i++) {
    const classroom = classroomRecords[i % classroomRecords.length];
    await prisma.student.update({
      where: { id: studentRecords[i].id },
      data: { classroomId: classroom.id }
    });
  }

  // ---- Subjects (IB subject groups) ----
  const subjectDefs = [
    { name: 'English A: Language & Literature', code: 'ENG-A' },
    { name: 'Spanish B', code: 'SPA-B' },
    { name: 'Individuals & Societies', code: 'I-AND-S' },
    { name: 'Sciences', code: 'SCI' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Visual Arts', code: 'ARTS' },
  ];
  const subjectRecords: { id: string; name: string; code: string }[] = [];
  for (const s of subjectDefs) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: { name: s.name, code: s.code }
    });
    subjectRecords.push({ id: subject.id, name: subject.name, code: subject.code });
  }

  // ---- Timetable: 4 periods/day, 5 days, per classroom ----
  const periodTimes = [
    { period: 1, start: '08:00', end: '08:45' },
    { period: 2, start: '08:50', end: '09:35' },
    { period: 3, start: '09:50', end: '10:35' },
    { period: 4, start: '10:40', end: '11:25' },
  ];
  const existingTimetableCount = await prisma.timetableEntry.count();
  if (existingTimetableCount === 0) {
    for (const classroom of classroomRecords) {
      for (let day = 1; day <= 5; day++) {
        for (const pt of periodTimes) {
          const subject = pick(subjectRecords);
          const teacher = pick(teacherRecords);
          await prisma.timetableEntry.create({
            data: {
              classroomId: classroom.id,
              subjectId: subject.id,
              teacherId: teacher.id,
              dayOfWeek: day,
              period: pt.period,
              startTime: pt.start,
              endTime: pt.end,
              room: `Room ${100 + Math.floor(Math.random() * 20)}`
            }
          });
        }
      }
    }
  }

  console.log('Seeding attendance history (last 20 school days)...');

  // ---- Attendance: last 20 weekdays per student ----
  const recordedByUserId = teacherRecords[0].userId;
  const existingAttendanceCount = await prisma.attendance.count();
  if (existingAttendanceCount === 0) {
    const attendanceDates: Date[] = [];
    let dCursor = 0;
    while (attendanceDates.length < 20) {
      const d = daysAgo(dCursor);
      if (d.getDay() !== 0 && d.getDay() !== 6) attendanceDates.push(d);
      dCursor++;
    }
    for (const student of studentRecords) {
      for (const date of attendanceDates) {
        const roll = Math.random();
        const status = roll < 0.87 ? 'PRESENT' : roll < 0.95 ? 'ABSENT' : 'LATE';
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            date,
            status,
            session: 'FULL_DAY',
            recordedBy: recordedByUserId,
          }
        });
      }
    }
  }

  console.log('Seeding grades (IB 1-7 scale)...');

  // ---- Grades: 2 exams x 6 subjects per student, IB 1-7 scale ----
  const existingGradeCount = await prisma.grade.count();
  if (existingGradeCount === 0) {
    for (const student of studentRecords) {
      for (const subject of subjectRecords) {
        for (const examName of ['Formative Assessment 1', 'Summative Assessment 1']) {
          await prisma.grade.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              examName,
              score: 3 + Math.floor(Math.random() * 5), // 3-7
              maxScore: 7,
              date: daysAgo(Math.floor(Math.random() * 60)),
            }
          });
        }
      }
    }
  }

  console.log('Seeding fees, invoices and payments...');

  // ---- Fee Structures + Invoices + Payments ----
  const feeStructureDefs = [
    { name: 'MYP Annual Tuition', amount: 285000, academicYear: '2025-2026' },
    { name: 'DP Annual Tuition', amount: 340000, academicYear: '2025-2026' },
  ];
  for (const fs of feeStructureDefs) {
    const exists = await prisma.feeStructure.findFirst({ where: { name: fs.name, academicYear: fs.academicYear } });
    if (!exists) {
      await prisma.feeStructure.create({ data: fs });
    }
  }

  const existingInvoiceCount = await prisma.feeInvoice.count();
  if (existingInvoiceCount === 0) {
    for (const student of studentRecords) {
      const amount = 60000 + Math.floor(Math.random() * 40000);
      const roll = Math.random();
      const status = roll < 0.55 ? 'PAID' : roll < 0.85 ? 'PENDING' : 'OVERDUE';
      const dueDate = daysAgo(-15 + Math.floor(Math.random() * 30));
      const invoice = await prisma.feeInvoice.create({
        data: {
          studentId: student.id,
          title: 'Term 2 Fee Invoice',
          amount,
          dueDate,
          status,
          paidAt: status === 'PAID' ? daysAgo(Math.floor(Math.random() * 20)) : null,
          createdAt: daysAgo(30),
        }
      });
      if (status === 'PAID') {
        await prisma.paymentTransaction.create({
          data: {
            invoiceId: invoice.id,
            amount,
            method: pick(['UPI', 'CARD']),
            status: 'SUCCESS',
            createdAt: invoice.paidAt || daysAgo(5),
          }
        });
      }
    }
  }

  console.log('Seeding behavior incidents, leave requests, homework, clubs...');

  // ---- Behavior Incidents ----
  const existingIncidentCount = await prisma.behaviorIncident.count();
  if (existingIncidentCount === 0) {
    const meritReasons = [
      { category: 'Helpful', description: 'Assisted a classmate with a difficult Math problem.' },
      { category: 'Leadership', description: 'Led the CAS beach clean-up initiative.' },
      { category: 'Academic', description: 'Outstanding Extended Essay draft submission.' },
    ];
    const demeritReasons = [
      { category: 'Attendance', description: 'Arrived late to class 3 times this week.' },
      { category: 'Academic', description: 'Failed to submit a major homework assignment.' },
      { category: 'Discipline', description: 'Disrupted class during instruction time.' },
    ];
    for (let i = 0; i < 20; i++) {
      const student = pick(studentRecords);
      const teacher = pick(teacherRecords);
      const isMerit = Math.random() < 0.4;
      const reason = isMerit ? pick(meritReasons) : pick(demeritReasons);
      await prisma.behaviorIncident.create({
        data: {
          studentId: student.id,
          teacherId: teacher.id,
          type: isMerit ? 'MERIT' : 'DEMERIT',
          category: reason.category,
          description: reason.description,
          points: isMerit ? 5 + Math.floor(Math.random() * 10) : 5 + Math.floor(Math.random() * 10),
          date: daysAgo(Math.floor(Math.random() * 45)),
        }
      });
    }
  }

  // ---- Leave Requests ----
  const existingLeaveCount = await prisma.leaveRequest.count();
  if (existingLeaveCount === 0) {
    const leaveReasons = ['Medical appointment', 'Family emergency', 'Conference attendance', 'Personal leave', 'Wedding function'];
    const statuses = ['PENDING', 'PENDING', 'APPROVED', 'APPROVED', 'REJECTED'];
    for (let i = 0; i < 6; i++) {
      const teacher = pick(teacherRecords);
      const start = daysAgo(-5 - Math.floor(Math.random() * 20));
      const end = new Date(start);
      end.setDate(end.getDate() + 1 + Math.floor(Math.random() * 3));
      await prisma.leaveRequest.create({
        data: {
          teacherId: teacher.id,
          startDate: start,
          endDate: end,
          reason: pick(leaveReasons),
          status: statuses[i % statuses.length],
          appliedAt: daysAgo(10 + i),
        }
      });
    }
  }

  // ---- Homework + Submissions ----
  const existingHomeworkCount = await prisma.homework.count();
  if (existingHomeworkCount === 0) {
    for (const classroom of classroomRecords) {
      const classroomStudents = studentRecords.filter((_, idx) => idx % classroomRecords.length === classroomRecords.indexOf(classroom));
      for (let h = 0; h < 2; h++) {
        const subject = pick(subjectRecords);
        const teacher = pick(teacherRecords);
        const homework = await prisma.homework.create({
          data: {
            title: `${subject.name} — Assignment ${h + 1}`,
            description: `Complete the assigned problem set / reading for ${subject.name}.`,
            dueDate: daysAgo(-3 - h * 4),
            subjectId: subject.id,
            classroomId: classroom.id,
            teacherId: teacher.id,
          }
        });
        for (const student of classroomStudents) {
          const submitted = Math.random() < 0.7;
          if (submitted) {
            const graded = Math.random() < 0.5;
            await prisma.homeworkSubmission.create({
              data: {
                homeworkId: homework.id,
                studentId: student.id,
                content: 'Submission attached.',
                submittedAt: daysAgo(1 + h),
                grade: graded ? 60 + Math.floor(Math.random() * 40) : null,
              }
            });
          }
        }
      }
    }
  }

  // ---- Clubs + Memberships (CAS) ----
  const existingClubCount = await prisma.club.count();
  if (existingClubCount === 0) {
    const clubDefs = [
      { name: 'Robotics Club', description: 'Design, build and program competitive robots.' },
      { name: 'Debate Society', description: 'Weekly practice debates on global issues (TOK-adjacent).' },
      { name: 'Basketball', description: 'Competitive and recreational basketball training.' },
      { name: 'Community Service (CAS)', description: 'Local outreach and service-learning projects.' },
    ];
    for (const c of clubDefs) {
      const teacher = pick(teacherRecords);
      const club = await prisma.club.create({
        data: { name: c.name, description: c.description, teacherId: teacher.id }
      });
      const members = studentRecords.sort(() => 0.5 - Math.random()).slice(0, 6);
      for (const m of members) {
        await prisma.clubMembership.create({
          data: { studentId: m.id, clubId: club.id, joinedAt: daysAgo(30 + Math.floor(Math.random() * 60)) }
        });
      }
    }
  }

  console.log('Seeding wallet, clinic, hostel, assets and resources...');

  // ---- Wallet Transactions ----
  const existingWalletCount = await prisma.walletTransaction.count();
  if (existingWalletCount === 0) {
    for (const student of studentRecords.slice(0, 15)) {
      await prisma.walletTransaction.create({
        data: { studentId: student.id, type: 'TOP_UP', amount: 500, description: 'Parent Top-up', date: daysAgo(10) }
      });
      await prisma.walletTransaction.create({
        data: { studentId: student.id, type: 'PURCHASE', amount: 80 + Math.floor(Math.random() * 100), description: 'Canteen - Lunch', date: daysAgo(2) }
      });
    }
  }

  // ---- Clinic Visits ----
  const existingClinicCount = await prisma.clinicVisit.count();
  if (existingClinicCount === 0) {
    const clinicReasons = [
      { reason: 'Headache', treatment: 'Rest and hydration' },
      { reason: 'Minor fall during PE', treatment: 'First aid, ice pack applied' },
      { reason: 'Fever', treatment: 'Paracetamol administered, parent notified' },
    ];
    for (let i = 0; i < 6; i++) {
      const student = pick(studentRecords);
      const c = pick(clinicReasons);
      await prisma.clinicVisit.create({
        data: { studentId: student.id, reason: c.reason, treatment: c.treatment, date: daysAgo(Math.floor(Math.random() * 30)) }
      });
    }
  }

  // ---- Hostel ----
  const existingHostelRoomCount = await prisma.hostelRoom.count();
  if (existingHostelRoomCount === 0) {
    const rooms = [
      { roomNumber: 'A-101', block: 'Block A', capacity: 2, type: 'AC' },
      { roomNumber: 'A-102', block: 'Block A', capacity: 2, type: 'AC' },
      { roomNumber: 'B-201', block: 'Block B', capacity: 3, type: 'NON_AC' },
      { roomNumber: 'B-202', block: 'Block B', capacity: 3, type: 'NON_AC' },
    ];
    const roomRecords = [];
    for (const r of rooms) {
      const room = await prisma.hostelRoom.create({ data: r });
      roomRecords.push(room);
    }
    const boarders = studentRecords.slice(0, 8);
    for (let i = 0; i < boarders.length; i++) {
      const room = roomRecords[i % roomRecords.length];
      await prisma.hostelStudent.create({
        data: { studentId: boarders[i].id, roomId: room.id, joinedAt: daysAgo(90) }
      });
    }
  }

  // ---- Assets ----
  const existingAssetCount = await prisma.asset.count();
  if (existingAssetCount === 0) {
    const assets = [
      { name: 'MacBook Air M2', category: 'LAPTOP', serialNo: 'AST-LAP-001' },
      { name: 'MacBook Air M2', category: 'LAPTOP', serialNo: 'AST-LAP-002' },
      { name: 'iPad Pro 11"', category: 'IPAD', serialNo: 'AST-IPD-001' },
      { name: 'iPad Pro 11"', category: 'IPAD', serialNo: 'AST-IPD-002' },
      { name: 'Chemistry Lab Kit', category: 'LAB_EQUIPMENT', serialNo: 'AST-LAB-001' },
    ];
    const assetRecords = [];
    for (const a of assets) {
      const asset = await prisma.asset.create({ data: { ...a, status: 'AVAILABLE' } });
      assetRecords.push(asset);
    }
    const checkoutUser = teacherRecords[0].userId;
    await prisma.assetCheckout.create({
      data: { assetId: assetRecords[0].id, userId: checkoutUser, checkoutDate: daysAgo(5), status: 'ACTIVE' }
    });
    await prisma.asset.update({ where: { id: assetRecords[0].id }, data: { status: 'CHECKED_OUT' } });
  }

  // ---- Resources ----
  const existingResourceCount = await prisma.resource.count();
  if (existingResourceCount === 0) {
    const resources = [
      { name: 'Chemistry Lab 1', type: 'FACILITY', status: 'AVAILABLE', capacity: 30 },
      { name: 'Projector A', type: 'EQUIPMENT', status: 'IN_USE', capacity: null },
      { name: 'Advanced Physics Vol 1', type: 'LIBRARY_BOOK', status: 'AVAILABLE', capacity: null },
      { name: 'Main Auditorium', type: 'FACILITY', status: 'AVAILABLE', capacity: 300 },
    ];
    for (const r of resources) {
      await prisma.resource.create({ data: r });
    }
  }

  // ---- Exam Engine: quizzes/exams across the moderation + grade-release lifecycle ----
  type SeedQuestion = {
    type: 'MCQ' | 'SHORT_ANSWER' | 'ESSAY';
    text: string;
    points: number;
    options?: string[];
    correctIdx?: number;
    rubric?: { criterion: string; maxPoints: number }[];
    difficulty?: string;
    bloomsLevel?: string;
  };

  async function createSeedExam(opts: {
    title: string;
    classroomId: string;
    subjectId: string;
    teacherId: string;
    moderatorTeacherId?: string;
    examType: string;
    dueDate: Date;
    timeLimitMinutes?: number;
    questions: SeedQuestion[];
    attemptStudentIds: string[];
    targetStatus: 'DRAFT' | 'PUBLISHED' | 'PENDING_MODERATION' | 'MODERATED' | 'GRADES_RELEASED';
  }) {
    const totalMarks = opts.questions.reduce((s, q) => s + q.points, 0);
    const quiz = await prisma.quiz.create({
      data: {
        title: opts.title,
        teacherId: opts.teacherId,
        classroomId: opts.classroomId,
        subjectId: opts.subjectId,
        examType: opts.examType,
        dueDate: opts.dueDate,
        timeLimitMinutes: opts.timeLimitMinutes,
        totalMarks,
        status: opts.targetStatus === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      }
    });

    const questionRecords = [];
    for (const q of opts.questions) {
      const question = await prisma.question.create({
        data: {
          quizId: quiz.id,
          text: q.text,
          type: q.type,
          points: q.points,
          options: q.options ? JSON.stringify(q.options) : null,
          correctIdx: q.correctIdx ?? null,
          rubricCriteria: q.rubric ? JSON.stringify(q.rubric) : null,
          difficulty: q.difficulty ?? null,
          bloomsLevel: q.bloomsLevel ?? null,
        }
      });
      questionRecords.push(question);
    }

    if (opts.targetStatus === 'DRAFT') return quiz;

    const isGraded = ['PENDING_MODERATION', 'MODERATED', 'GRADES_RELEASED'].includes(opts.targetStatus);
    const attemptStatus = opts.targetStatus === 'GRADES_RELEASED' ? 'RELEASED' : isGraded ? 'GRADED' : 'SUBMITTED';

    for (const studentId of opts.attemptStudentIds) {
      let totalAwarded = 0;
      const responseInputs: { questionId: string; selectedIdx: number | null; textAnswer: string | null; marksAwarded: number | null; rubricScores?: string | null; feedback?: string | null }[] = [];

      for (const question of questionRecords) {
        if (question.type === 'MCQ') {
          const isCorrect = Math.random() < 0.72;
          const optionCount = question.options ? JSON.parse(question.options).length : 4;
          const selectedIdx = isCorrect ? question.correctIdx! : (question.correctIdx! + 1) % optionCount;
          const marks = isCorrect ? question.points : 0;
          totalAwarded += isGraded ? marks : 0;
          responseInputs.push({ questionId: question.id, selectedIdx, textAnswer: null, marksAwarded: isGraded ? marks : null });
        } else {
          const criteria: { criterion: string; maxPoints: number }[] = question.rubricCriteria ? JSON.parse(question.rubricCriteria) : [];
          const rubricScores = criteria.map((c) => ({ criterion: c.criterion, points: isGraded ? Math.round(c.maxPoints * (0.6 + Math.random() * 0.4)) : 0 }));
          const marks = rubricScores.reduce((s, c) => s + c.points, 0);
          totalAwarded += isGraded ? marks : 0;
          responseInputs.push({
            questionId: question.id,
            selectedIdx: null,
            textAnswer: 'Sample response covering the key concepts discussed in class, with supporting examples.',
            marksAwarded: isGraded ? marks : null,
            rubricScores: isGraded ? JSON.stringify(rubricScores) : null,
            feedback: isGraded ? 'Solid effort - see rubric breakdown for detail.' : null,
          });
        }
      }

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          studentId,
          score: Math.round(totalAwarded),
          totalScore: totalMarks,
          status: attemptStatus,
          submittedAt: opts.dueDate,
          startedAt: opts.dueDate,
        }
      });

      await prisma.quizResponse.createMany({
        data: responseInputs.map((r) => ({ ...r, attemptId: attempt.id }))
      });
    }

    if (isGraded) {
      await prisma.quiz.update({
        where: { id: quiz.id },
        data: {
          status: opts.targetStatus,
          moderatedByTeacherId: opts.targetStatus !== 'PENDING_MODERATION' ? (opts.moderatorTeacherId ?? null) : null,
          moderatedAt: opts.targetStatus !== 'PENDING_MODERATION' ? opts.dueDate : null,
          gradesReleasedAt: opts.targetStatus === 'GRADES_RELEASED' ? opts.dueDate : null,
        }
      });
    }

    return quiz;
  }

  const existingQuizCount = await prisma.quiz.count();
  if (existingQuizCount === 0) {
    console.log('Seeding exam engine (quizzes, questions, attempts, moderation)...');

    const studentsInClassroom = (classroomId: string) => studentRecords.filter((_, idx) => classroomRecords[idx % classroomRecords.length].id === classroomId);
    const mathSubject = subjectRecords.find((s) => s.code === 'MATH')!;
    const engSubject = subjectRecords.find((s) => s.code === 'ENG-A')!;
    const sciSubject = subjectRecords.find((s) => s.code === 'SCI')!;
    const iasSubject = subjectRecords.find((s) => s.code === 'I-AND-S')!;
    const artsSubject = subjectRecords.find((s) => s.code === 'ARTS')!;

    const mcq = (text: string, options: string[], correctIdx: number, points = 5): SeedQuestion => ({ type: 'MCQ', text, options, correctIdx, points, difficulty: pick(['EASY', 'MEDIUM', 'HARD']), bloomsLevel: pick(['Remember', 'Understand', 'Apply']) });
    const essay = (text: string, points: number, rubric: { criterion: string; maxPoints: number }[]): SeedQuestion => ({ type: 'ESSAY', text, points, rubric, difficulty: pick(['MEDIUM', 'HARD']), bloomsLevel: pick(['Analyze', 'Evaluate', 'Create']) });

    // 1. Fully released exam
    const myp1a = classroomRecords.find((c) => c.name === 'MYP1A')!;
    await createSeedExam({
      title: 'Algebra Unit Test',
      classroomId: myp1a.id,
      subjectId: mathSubject.id,
      teacherId: teacherRecords[0].id,
      moderatorTeacherId: teacherRecords[1].id,
      examType: 'UNIT_TEST',
      dueDate: daysAgo(18),
      timeLimitMinutes: 45,
      questions: [
        mcq('Solve for x: 2x + 4 = 12', ['2', '4', '6', '8'], 1),
        mcq('Which expression simplifies to 3x?', ['x + x + x', '3 + x', 'x/3', 'x - 3'], 0),
        mcq('What is the slope of y = 3x + 2?', ['1', '2', '3', '4'], 2),
        essay('Explain, step by step, how you would solve a system of two linear equations.', 10, [
          { criterion: 'Correct method identified', maxPoints: 4 },
          { criterion: 'Steps clearly shown', maxPoints: 3 },
          { criterion: 'Correct final answer', maxPoints: 3 },
        ]),
      ],
      attemptStudentIds: studentsInClassroom(myp1a.id).map((s) => s.id),
      targetStatus: 'GRADES_RELEASED',
    });

    // 2. Moderated, awaiting release
    const myp2a = classroomRecords.find((c) => c.name === 'MYP2A')!;
    await createSeedExam({
      title: 'Literature Midterm',
      classroomId: myp2a.id,
      subjectId: engSubject.id,
      teacherId: teacherRecords[2].id,
      moderatorTeacherId: teacherRecords[3].id,
      examType: 'MIDTERM',
      dueDate: daysAgo(9),
      timeLimitMinutes: 60,
      questions: [
        mcq('Identify the narrative perspective used in the excerpt.', ['First person', 'Second person', 'Third person limited', 'Third person omniscient'], 2),
        mcq('Which literary device is exemplified by "the wind whispered"?', ['Simile', 'Personification', 'Metaphor', 'Hyperbole'], 1),
        essay('Analyze how the author develops the theme of isolation in the assigned text.', 15, [
          { criterion: 'Thesis clarity', maxPoints: 5 },
          { criterion: 'Use of textual evidence', maxPoints: 5 },
          { criterion: 'Organization and style', maxPoints: 5 },
        ]),
      ],
      attemptStudentIds: studentsInClassroom(myp2a.id).map((s) => s.id),
      targetStatus: 'MODERATED',
    });

    // 3. Graded, pending moderation
    const dp1a = classroomRecords.find((c) => c.name === 'DP1A')!;
    await createSeedExam({
      title: 'Biology Final Exam',
      classroomId: dp1a.id,
      subjectId: sciSubject.id,
      teacherId: teacherRecords[4].id,
      examType: 'FINAL',
      dueDate: daysAgo(4),
      timeLimitMinutes: 90,
      questions: [
        mcq('Which organelle is responsible for ATP production?', ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'], 1),
        mcq('What is the primary function of chlorophyll?', ['Water transport', 'Light absorption', 'Nutrient storage', 'Cell division'], 1),
        mcq('DNA replication is described as:', ['Conservative', 'Semi-conservative', 'Dispersive', 'Random'], 1),
        essay('Describe the process of natural selection using a real-world example.', 12, [
          { criterion: 'Accurate description of mechanism', maxPoints: 5 },
          { criterion: 'Relevant real-world example', maxPoints: 4 },
          { criterion: 'Scientific vocabulary used correctly', maxPoints: 3 },
        ]),
      ],
      attemptStudentIds: studentsInClassroom(dp1a.id).map((s) => s.id),
      targetStatus: 'PENDING_MODERATION',
    });

    // 4. Published, some submissions still ungraded
    const dp2a = classroomRecords.find((c) => c.name === 'DP2A')!;
    const dp2aStudents = studentsInClassroom(dp2a.id).map((s) => s.id);
    await createSeedExam({
      title: 'Global Politics Quiz',
      classroomId: dp2a.id,
      subjectId: iasSubject.id,
      teacherId: teacherRecords[5].id,
      examType: 'QUIZ',
      dueDate: daysAgo(1),
      timeLimitMinutes: 25,
      questions: [
        mcq('Which body is primarily responsible for international peacekeeping?', ['WTO', 'United Nations', 'IMF', 'WHO'], 1),
        mcq('A "failed state" is best defined by:', ['High GDP growth', 'Loss of effective governance', 'Strong military', 'EU membership'], 1),
      ],
      attemptStudentIds: dp2aStudents.slice(0, Math.max(1, Math.floor(dp2aStudents.length * 0.6))),
      targetStatus: 'PUBLISHED',
    });

    // 5. Draft, not yet published
    const myp3a = classroomRecords.find((c) => c.name === 'MYP3A')!;
    await createSeedExam({
      title: 'Design Portfolio Project',
      classroomId: myp3a.id,
      subjectId: artsSubject.id,
      teacherId: teacherRecords[6].id,
      examType: 'PROJECT',
      dueDate: daysAgo(-14),
      questions: [
        essay('Present your design process journal covering ideation through final piece.', 20, [
          { criterion: 'Ideation and research', maxPoints: 7 },
          { criterion: 'Technical execution', maxPoints: 7 },
          { criterion: 'Reflection and evaluation', maxPoints: 6 },
        ]),
      ],
      attemptStudentIds: [],
      targetStatus: 'DRAFT',
    });
  }

  // ---- Alumni & Progression Tracking ----
  const existingAlumniCount = await prisma.alumni.count();
  if (existingAlumniCount === 0) {
    console.log('Seeding alumni registry...');
    const alumniDefs = [
      { name: 'Ishaan Mehta', year: 2023, dp: 41, uni: 'University of Toronto', course: 'Computer Science', country: 'Canada', status: 'STUDYING', achievements: 'National Robotics Champion 2022; DP top scorer in graduating cohort.', featured: true },
      { name: 'Aisha Rahman', year: 2023, dp: 38, uni: 'University of Edinburgh', course: 'Medicine', country: 'United Kingdom', status: 'STUDYING', achievements: 'Founded the school Community Service (CAS) outreach program.', featured: true },
      { name: 'Rohan Kapoor', year: 2023, dp: 34, uni: 'IIT Bombay', course: 'Mechanical Engineering', country: 'India', status: 'STUDYING', achievements: 'State-level chess champion.', featured: false },
      { name: 'Meera Nair', year: 2024, dp: 43, uni: 'Stanford University', course: 'Economics', country: 'United States', status: 'STUDYING', achievements: 'Model UN Secretary-General; full merit scholarship recipient.', featured: true },
      { name: 'Karan Malhotra', year: 2024, dp: 36, uni: 'National University of Singapore', course: 'Business Analytics', country: 'Singapore', status: 'STUDYING', achievements: 'Regional debate champion 2023.', featured: false },
      { name: 'Zara Khan', year: 2024, dp: 39, uni: 'McGill University', course: 'Environmental Science', country: 'Canada', status: 'STUDYING', achievements: 'Published research note on urban biodiversity with local university.', featured: true },
      { name: 'Aditya Bhatt', year: 2024, dp: 31, uni: 'Manipal Institute of Technology', course: 'Computer Science', country: 'India', status: 'STUDYING', achievements: 'Built and open-sourced a school timetabling tool.', featured: false },
      { name: 'Naomi Fernandes', year: 2024, dp: 40, uni: 'University of Melbourne', course: 'Architecture', country: 'Australia', status: 'STUDYING', achievements: 'Design portfolio exhibited at a regional youth art fair.', featured: false },
      { name: 'Vikrant Sethi', year: 2025, dp: 44, uni: 'University of Cambridge', course: 'Natural Sciences', country: 'United Kingdom', status: 'STUDYING', achievements: 'Highest DP score in school history at time of graduation.', featured: true },
      { name: 'Simran Kaur', year: 2025, dp: 37, uni: 'University of British Columbia', course: 'Psychology', country: 'Canada', status: 'STUDYING', achievements: 'Peer counselling program founder.', featured: false },
      { name: 'Farhan Ali', year: 2025, dp: 33, uni: 'Delhi University', course: 'Economics', country: 'India', status: 'STUDYING', achievements: 'School basketball team captain, 2 years.', featured: false },
      { name: 'Elena Costa', year: 2025, dp: 42, uni: 'Bocconi University', course: 'International Management', country: 'Italy', status: 'STUDYING', achievements: 'Erasmus exchange scholarship; MUN best delegate award.', featured: true },
      { name: 'Yusuf Ibrahim', year: 2025, dp: 30, uni: null, course: null, country: 'India', status: 'GAP_YEAR', achievements: 'Taking a gap year for a national-level cricket program before university.', featured: false },
      { name: 'Priyansha Rao', year: 2025, dp: 35, uni: 'Amrita Vishwa Vidyapeetham', course: 'Biotechnology', country: 'India', status: 'STUDYING', achievements: 'School science fair grand prize, two consecutive years.', featured: false },
      { name: 'Daniel Wong', year: 2025, dp: null, uni: null, course: null, country: 'India', status: 'WORKING', achievements: 'Joined a Bangalore-based startup as a junior analyst straight after graduation.', featured: false },
      { name: 'Ananya Krishnan', year: 2025, dp: 39, uni: 'University of Amsterdam', course: 'Liberal Arts and Sciences', country: 'Netherlands', status: 'STUDYING', achievements: 'Editor-in-chief of the school newsletter for two years.', featured: false },
    ];

    for (const a of alumniDefs) {
      const reg = `ALU-${a.year}-${Math.floor(1000 + Math.random() * 9000)}`;
      const alumStudent = await prisma.student.create({
        data: {
          registrationNo: reg,
          name: a.name,
          curriculum: 'DP',
          isActive: false,
          dateOfBirth: new Date(`${a.year - 18}-05-15`),
        }
      });
      await prisma.alumni.create({
        data: {
          studentId: alumStudent.id,
          graduationYear: a.year,
          finalProgramme: 'DP',
          finalDpScore: a.dp,
          university: a.uni,
          courseOfStudy: a.course,
          country: a.country,
          currentStatus: a.status,
          achievements: a.achievements,
          isFeatured: a.featured,
        }
      });
    }
  }

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
