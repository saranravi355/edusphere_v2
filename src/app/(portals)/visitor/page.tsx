import prisma from "@/lib/prisma";
import { coverageSummary, type TagFact } from "@/lib/accreditation/coverage";
import { sourceOf } from "@/lib/accreditation/source";
import { CATEGORY_ORDER, EVIDENCE_KIND_LABELS, PRACTICES } from "@/lib/accreditation/standards";
import VisitorClient from "./VisitorClient";

export const dynamic = "force-dynamic";

/**
 * What the visiting team sees: confirmed evidence only.
 *
 * Suggested and rejected tags are filtered out in the query rather than in the
 * component, so the internal triage never reaches the browser at all. A team
 * should see the school's evidence, not its workings.
 */
export default async function VisitorPage() {
  const tags = await prisma.evidenceTag.findMany({
    where: { status: "CONFIRMED" },
    include: {
      lessonPlan: { select: { title: true, subjectName: true } },
      portfolioItem: { select: { title: true, student: { select: { name: true } } } },
      assessmentResult: { select: { title: true, student: { select: { name: true } } } },
      // Teacher has no `name` column of its own — it lives on the related User.
      observation: { select: { focusArea: true, teacher: { select: { user: { select: { name: true } } } } } },
      document: { select: { title: true, fileUrl: true } },
    },
    orderBy: { taggedAt: "desc" },
  });

  const facts: TagFact[] = tags.map((t) => ({
    standardKey: t.standardKey,
    kind: sourceOf(t).kind,
    status: t.status,
    taggedAt: t.taggedAt,
  }));
  const summary = coverageSummary(facts);

  const practices = PRACTICES.map((p) => {
    const cell = summary.byPractice.get(p.key)!;
    return {
      key: p.key,
      category: p.category,
      title: p.title,
      description: p.description,
      tone: cell.tone,
      count: cell.count,
      evidence: tags
        .filter((t) => t.standardKey === p.key)
        .map((t) => {
          const { kind } = sourceOf(t);
          const label =
            kind === "LESSON_PLAN"
              ? `${t.lessonPlan!.title} · ${t.lessonPlan!.subjectName}`
              : kind === "PORTFOLIO_ITEM"
              ? `${t.portfolioItem!.title} · ${t.portfolioItem!.student.name}`
              : kind === "ASSESSMENT_RESULT"
              ? `${t.assessmentResult!.title} · ${t.assessmentResult!.student.name}`
              : kind === "OBSERVATION"
              ? `${t.observation!.focusArea ?? "Lesson observation"} · ${t.observation!.teacher.user.name}`
              : t.document!.title;
          return {
            id: t.id,
            kindLabel: EVIDENCE_KIND_LABELS[kind],
            label,
            href: kind === "DOCUMENT" ? t.document!.fileUrl : null,
            note: t.note,
          };
        }),
    };
  });

  return (
    <VisitorClient
      practices={practices}
      summary={{ wellEvidenced: summary.wellEvidenced, thin: summary.thin, gaps: summary.gaps, total: PRACTICES.length }}
      categoryOrder={[...CATEGORY_ORDER]}
      hasAnyEvidence={tags.length > 0}
    />
  );
}
