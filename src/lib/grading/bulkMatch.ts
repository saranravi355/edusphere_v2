export interface RosterStudent {
  id: string;
  name: string;
  registrationNo: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokens(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean);
}

/** Matches one bulk-uploaded file to exactly one student on the class roster, from its filename
 *  alone - the only matching path bulk upload uses: teachers are expected to save each file
 *  named with that student's registration number or full name before uploading, and
 *  bulkUploadAndGrade (bulkActions.ts) rejects the whole batch up front if any file doesn't
 *  resolve to exactly one student, rather than uploading a partially-identified queue. */
export function matchStudentByFilename(fileName: string, roster: RosterStudent[]): RosterStudent | null {
  const base = fileName.replace(/\.[^.]+$/, '');
  if (!normalize(base)) return null;

  // 1. Registration number appearing anywhere in the filename - highest confidence, since reg
  //    numbers are unique (e.g. "2610-042_unit-test-2.pdf" or "26-10-042.jpg").
  const normalizedBase = normalize(base);
  const regnoMatches = roster.filter(s => s.registrationNo && normalizedBase.includes(normalize(s.registrationNo)));
  if (regnoMatches.length === 1) return regnoMatches[0];

  // 2. Every token of the student's full name appears somewhere in the filename (e.g.
  //    "aarav_patel_ut2.pdf" matches "Aarav Patel"). Requires ALL name tokens, not just one, so
  //    a single common first name shared by several students doesn't produce a false match.
  const fileTokens = new Set(tokens(base));
  const nameMatches = roster.filter(s => {
    const nameTokens = tokens(s.name);
    return nameTokens.length > 0 && nameTokens.every(t => fileTokens.has(t));
  });
  if (nameMatches.length === 1) return nameMatches[0];

  return null;
}
