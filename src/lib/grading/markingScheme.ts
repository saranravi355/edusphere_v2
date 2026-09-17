import prisma from '@/lib/prisma';

/** A teacher-supplied answer key (questions, model/expected answers, marks per question) for one
 *  specific assessment, keyed by (classroom, subject, title, term) - the same identity teachers
 *  already type into the upload form, so no separate "assessment" record is needed. Uploading a
 *  new file for an assessment that already has one replaces it (upsert), which is deliberate:
 *  the teacher corrected a typo or swapped the version, not created a second answer key for the
 *  same exam. */
export async function upsertMarkingScheme(params: {
  classroomId: string;
  teacherId: string;
  subjectName: string;
  title: string;
  term: string;
  programme: string;
  courseworkType: string;
  fileUrl: string;
  rawText: string;
}): Promise<void> {
  const { classroomId, subjectName, title, term, ...rest } = params;
  await prisma.markingScheme.upsert({
    where: { classroomId_subjectName_title_term: { classroomId, subjectName, title, term } },
    create: { classroomId, subjectName, title, term, ...rest },
    update: { fileUrl: rest.fileUrl, rawText: rest.rawText, programme: rest.programme, courseworkType: rest.courseworkType },
  });
}

/** Looks up the marking scheme for an assessment, if a teacher has uploaded one - grade.ts feeds
 *  its text into the grading prompt when present. Returns null (not an error) when there isn't
 *  one, since a marking scheme is optional: grading still works from the generic IB subject
 *  criteria alone otherwise, same as before this feature existed. */
export async function findMarkingScheme(params: { classroomId: string; subjectName: string; title: string; term: string }): Promise<string | null> {
  const scheme = await prisma.markingScheme.findUnique({
    where: {
      classroomId_subjectName_title_term: {
        classroomId: params.classroomId,
        subjectName: params.subjectName,
        title: params.title,
        term: params.term,
      },
    },
    select: { rawText: true },
  });
  return scheme?.rawText ?? null;
}
