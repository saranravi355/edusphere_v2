"use client";

import { createContext, useContext } from "react";

/**
 * Which programme the signed-in student is in.
 *
 * The student AI previews were written for a Diploma student — Extended Essays,
 * internal assessments, university offers — while 110 of the school's 157
 * students are in the MYP. Each preview now carries an MYP version as well and
 * picks between them with this. The value is read once, on the server, in the
 * student layout and handed down here, so the client pages do not each have to
 * look the student up.
 */
export type StudentProgramme = "DP" | "MYP";

const ProgrammeContext = createContext<StudentProgramme>("DP");

export default function ProgrammeProvider({
  programme,
  children,
}: {
  programme: StudentProgramme;
  children: React.ReactNode;
}) {
  return <ProgrammeContext.Provider value={programme}>{children}</ProgrammeContext.Provider>;
}

export function useProgramme(): StudentProgramme {
  return useContext(ProgrammeContext);
}
