import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding 5 Staff and 5 Students...')

  // Create Staff (1 Principal, 2 Super Admins, 2 Teachers)
  const staffs = [
    { email: 'principal@edusphere.com', name: 'Dr. Sarah Jenkins', role: 'PRINCIPAL' },
    { email: 'admin1@edusphere.com', name: 'Mark Admin', role: 'SUPER_ADMIN' },
    { email: 'admin2@edusphere.com', name: 'Lisa Admin', role: 'SUPER_ADMIN' },
    { email: 'teacher1@edusphere.com', name: 'David Smith', role: 'CLASS_TEACHER' },
    { email: 'teacher2@edusphere.com', name: 'Emily Clark', role: 'SUBJECT_TEACHER' }
  ];

  for (const staff of staffs) {
    const user = await prisma.user.upsert({
      where: { email: staff.email },
      update: {},
      create: {
        email: staff.email,
        name: staff.name,
        role: staff.role
      }
    });

    if (staff.role === 'CLASS_TEACHER' || staff.role === 'SUBJECT_TEACHER') {
      await prisma.teacher.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          subjects: 'Mathematics, Science',
          qualifications: 'B.Ed, M.Sc',
          yearsExperience: 5
        }
      });
    }
  }

  // Create 5 Students
  const students = [
    { name: 'John Doe', reg: 'STU-26-101', cur: 'CBSE', gender: 'Male', dob: '2010-05-15', bg: 'O+' },
    { name: 'Jane Smith', reg: 'STU-26-102', cur: 'IGCSE', gender: 'Female', dob: '2011-02-20', bg: 'A+' },
    { name: 'Michael Brown', reg: 'STU-26-103', cur: 'IB', gender: 'Male', dob: '2009-11-10', bg: 'B+' },
    { name: 'Emma Wilson', reg: 'STU-26-104', cur: 'CBSE', gender: 'Female', dob: '2010-08-05', bg: 'O-' },
    { name: 'Lucas Taylor', reg: 'STU-26-105', cur: 'ICSE', gender: 'Male', dob: '2011-12-01', bg: 'AB+' }
  ];

  for (const stu of students) {
    // Optionally create User for student
    const sUser = await prisma.user.upsert({
      where: { email: `${stu.reg.toLowerCase()}@student.edusphere.com` },
      update: {},
      create: {
        email: `${stu.reg.toLowerCase()}@student.edusphere.com`,
        name: stu.name,
        role: 'STUDENT'
      }
    });

    await prisma.student.upsert({
      where: { registrationNo: stu.reg },
      update: {},
      create: {
        registrationNo: stu.reg,
        name: stu.name,
        dateOfBirth: new Date(stu.dob),
        gender: stu.gender,
        bloodGroup: stu.bg,
        curriculum: stu.cur,
        userId: sUser.id,
        address: '123 School Lane, City',
        emergencyContactName: 'Parent of ' + stu.name,
        emergencyContactPhone: '+1234567890'
      }
    });
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
