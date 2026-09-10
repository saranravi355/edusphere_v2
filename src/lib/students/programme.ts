import { cache } from "react";
import prisma from "@/lib/prisma";
import type { StudentProgramme } from "@/components/students/ProgrammeProvider";

/**
 * The programme a student is in, for choosing between the DP and MYP versions
 * of the student previews.
 *
 * Anything that is not DP gets the MYP version: the school has no PYP students,
 * and if it enrols some the MYP content is the nearer of the two. Cached per
 * request, so the layout and a server page asking the same question cost one
 * query.
 */
export const getStudentProgramme = cache(async (userId: string): Promise<StudentProgramme> => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { curriculum: true },
  });
  return student?.curriculum === "DP" ? "DP" : "MYP";
});
