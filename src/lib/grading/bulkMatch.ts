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

/** Tries to match one bulk-uploaded file to exactly one student on the class roster, from its
 *  filename alone. Only returns a match when exactly one student fits - an ambiguous or absent
 *  match returns null and is left for a teacher to assign by hand (see assignStudent in
 *  actions.ts) rather than risk silently grading the wrong student's paper as someone else's. */
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

/** Answer sheets often carry the student's own handwritten "Name: ..." / "Roll No: ..." line
 *  near the top - pulls out plausible identity strings from the first few OCR'd lines. This is
 *  the least reliable source available (OCR of handwriting is no more trustworthy here than
 *  anywhere else on the page), so callers only try it after filename matching has already
 *  failed, and still only accept a candidate that resolves to exactly one roster student. */
function candidateIdentityStrings(ocrText: string): string[] {
  const lines = ocrText.split('\n').slice(0, 15);
  const candidates: string[] = [];
  for (const line of lines) {
    const nameMatch = line.match(/(?:name|student)\s*[:\-]\s*(.+)/i);
    if (nameMatch?.[1]) candidates.push(nameMatch[1].trim());
    const idMatch = line.match(/(?:roll|reg(?:istration)?)\s*(?:no\.?|number)?\s*[:\-]?\s*([A-Za-z0-9\-/]+)/i);
    if (idMatch?.[1]) candidates.push(idMatch[1].trim());
  }
  return candidates;
}

export function matchStudentFromOcrText(ocrText: string, roster: RosterStudent[]): RosterStudent | null {
  for (const candidate of candidateIdentityStrings(ocrText)) {
    const normalizedCandidate = normalize(candidate);
    if (!normalizedCandidate) continue;

    const regnoMatches = roster.filter(s => s.registrationNo && normalize(s.registrationNo) === normalizedCandidate);
    if (regnoMatches.length === 1) return regnoMatches[0];

    const candidateTokens = new Set(tokens(candidate));
    const nameMatches = roster.filter(s => {
      const nameTokens = tokens(s.name);
      return nameTokens.length > 0 && nameTokens.every(t => candidateTokens.has(t));
    });
    if (nameMatches.length === 1) return nameMatches[0];
  }
  return null;
}
