"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function getTeacher() {
  const session = await getSession();
  if (!session) return null;
  return prisma.teacher.findUnique({ where: { userId: session.user.id } });
}

export async function createLessonPlan(formData: FormData) {
  const teacher = await getTeacher();
  if (!teacher) return { error: "No teacher profile found." };

  const title = formData.get("title") as string;
  const subjectName = formData.get("subjectName") as string;
  const date = formData.get("date") as string;

  if (!title || !subjectName || !date) return { error: "Title, subject and date are required." };

  await prisma.lessonPlan.create({
    data: {
      teacherId: teacher.id,
      title,
      subjectName,
      className: (formData.get("className") as string) || null,
      date: new Date(date),
      durationMinutes: parseInt(formData.get("durationMinutes") as string) || 60,
      ibUnit: (formData.get("ibUnit") as string) || null,
      atlSkills: (formData.get("atlSkills") as string) || null,
      learnerProfile: (formData.get("learnerProfile") as string) || null,
      objectives: (formData.get("objectives") as string) || null,
      activities: (formData.get("activities") as string) || null,
      resources: (formData.get("resources") as string) || null,
      assessment: (formData.get("assessment") as string) || null,
    },
  });

  revalidatePath("/teacher/planner");
  return { success: true };
}

export async function setLessonStatus(planId: string, status: string) {
  await prisma.lessonPlan.update({ where: { id: planId }, data: { status } });
  revalidatePath("/teacher/planner");
  return { success: true };
}

export async function deleteLessonPlan(planId: string) {
  await prisma.lessonPlan.delete({ where: { id: planId } });
  revalidatePath("/teacher/planner");
  return { success: true };
}

// Generates a structured substitute-teacher plan from the lesson plan content
export async function generateSubPlan(planId: string) {
  const plan = await prisma.lessonPlan.findUnique({ where: { id: planId } });
  if (!plan) return { error: "Plan not found." };

  const lines: string[] = [];
  lines.push(`SUBSTITUTE TEACHER PLAN — ${plan.subjectName}${plan.className ? ` (${plan.className})` : ""}`);
  lines.push(`Lesson: ${plan.title} · ${new Date(plan.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · ${plan.durationMinutes} minutes`);
  if (plan.ibUnit) lines.push(`IB unit/topic: ${plan.ibUnit}`);
  lines.push("");
  lines.push("BEFORE CLASS");
  lines.push("• Collect the class list from reception; note any students with IEP accommodations (see IEP tab).");
  if (plan.resources) lines.push(`• Materials needed: ${plan.resources}`);
  lines.push("");
  lines.push("LESSON FLOW");
  lines.push(`• Starter (5-10 min): settle the class, take attendance, introduce the objective${plan.objectives ? `: "${plan.objectives.split("\n")[0]}"` : "."}`);
  if (plan.activities) {
    for (const [i, act] of plan.activities.split("\n").filter(Boolean).entries()) {
      lines.push(`• Activity ${i + 1}: ${act}`);
    }
  } else {
    lines.push("• Main task: students continue current unit work independently or in pairs.");
  }
  lines.push("• Students work independently — no new content needs to be taught. Circulate and keep them on task.");
  if (plan.assessment) lines.push(`• Assessment note: ${plan.assessment}`);
  lines.push("• Exit (5 min): students note one thing learned and one question on paper — collect and leave in my tray.");
  lines.push("");
  lines.push("NOTES FOR THE SUBSTITUTE");
  if (plan.atlSkills) lines.push(`• ATL focus this lesson: ${plan.atlSkills} — encourage students to self-manage.`);
  lines.push("• If work is finished early: reading or revision from the textbook chapter on the board.");
  lines.push("• Emergencies: contact the front office (ext. 100) or the head of department.");

  const subPlan = lines.join("\n");
  await prisma.lessonPlan.update({ where: { id: planId }, data: { subPlan } });
  revalidatePath("/teacher/planner");
  return { success: true, subPlan };
}
