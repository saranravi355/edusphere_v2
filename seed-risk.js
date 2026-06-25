const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.student.findFirst();
  const teacher = await prisma.teacher.findFirst();
  if (!student || !teacher) {
    console.log("No student or teacher found");
    return;
  }
  
  await prisma.behaviorIncident.create({
    data: {
      student: { connect: { id: student.id } },
      teacher: { connect: { id: teacher.id } },
      type: "DEMERIT",
      description: "Arrived late to class 3 times this week.",
      points: 5,
      date: new Date(),
      category: "ATTENDANCE"
    }
  });

  await prisma.behaviorIncident.create({
    data: {
      student: { connect: { id: student.id } },
      teacher: { connect: { id: teacher.id } },
      type: "DEMERIT",
      description: "Failed to submit 3 major homework assignments.",
      points: 10,
      date: new Date(),
      category: "ACADEMIC"
    }
  });

  await prisma.behaviorIncident.create({
    data: {
      student: { connect: { id: student.id } },
      teacher: { connect: { id: teacher.id } },
      type: "DEMERIT",
      description: "Disrupting the class during lecture.",
      points: 15,
      date: new Date(),
      category: "DISCIPLINE"
    }
  });

  console.log("Added 3 Demerits to student:", student.name);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
