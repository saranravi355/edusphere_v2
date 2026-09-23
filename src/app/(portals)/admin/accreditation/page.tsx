import { redirect } from "next/navigation";

import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/dates";
import { coverageSummary, type TagFact } from "@/lib/accreditation/coverage";
import { sourceOf } from "@/lib/accreditation/source";
import {
  CATEGORY_ORDER,
  EVIDENCE_KIND_LABELS,
  PRACTICES,
  practiceByKey,
  type EvidenceKind,
} from "@/lib/accreditation/standards";
import AccreditationClient from "./AccreditationClient";

export const dynamic = "force-dynamic";

/**
 * The IB coordinator's view of the school's evidence.
 *
 * Coverage is computed here on every load rather than stored. Eighteen
 * practices against a few hundred tags is nothing to query, and a stored count
 * is a thing that can go stale and then lie about how well evidenced the
 * school is — which is the one failure this module cannot afford.
 */
export default async function AccreditationPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const tags = await prisma.evidenceTag.findMany({
    include: {
      taggedBy: { select: { name: true } },
      lessonPlan: { select: { id: true, title: true, subjectName: true } },
      portfolioItem: { select: { id: true, title: true, student: { select: { name: true } } } },
      assessmentResult: { select: { id: true, title: true, student: { select: { name: true } } } },
      observation: {
        select: { id: true, focusArea: true, teacher: { select: { user: { select: { name: true } } } } },
      },
      document: { select: { id: true, title: true, fileUrl: true } },
    },
    orderBy: { taggedAt: "desc" },
  });

  /** One human-readable line per tag, plus where to go to see it. */
  function describe(t: (typeof tags)[number]): { kind: EvidenceKind; label: string; href: string | null } {
    const { kind } = sourceOf(t);
    if (kind === "LESSON_PLAN") {
      return {
        kind,
        label: `${t.lessonPlan!.title} · ${t.lessonPlan!.subjectName}`,
        href: "/teacher/planner",
      };
    }
    if (kind === "PORTFOLIO_ITEM") {
      return {
        kind,
        label: `${t.portfolioItem!.title} · ${t.portfolioItem!.student.name}`,
        href: null,
      };
    }
    if (kind === "ASSESSMENT_RESULT") {
      return {
        kind,
        label: `${t.assessmentResult!.title} · ${t.assessmentResult!.student.name}`,
        href: null,
      };
    }
    if (kind === "OBSERVATION") {
      return {
        kind,
        label: `${t.observation!.focusArea ?? "Lesson observation"} · ${t.observation!.teacher.user.name}`,
        href: "/admin/staff/appraisal",
      };
    }
    return { kind, label: t.document!.title, href: t.document!.fileUrl };
  }

  const facts: TagFact[] = tags.map((t) => ({
    standardKey: t.standardKey,
    kind: sourceOf(t).kind,
    status: t.status,
    taggedAt: t.taggedAt,
  }));
  const summary = coverageSummary(facts);

  const queue = tags
    .filter((t) => t.status === "SUGGESTED")
    .map((t) => {
      const described = describe(t);
      return {
        id: t.id,
        standardKey: t.standardKey,
        practiceTitle: practiceByKey(t.standardKey)?.title ?? t.standardKey,
        kind: described.kind,
        sourceLabel: described.label,
        note: t.note,
        taggedBy: t.taggedBy.name ?? "Unknown",
        taggedAt: formatDate(t.taggedAt, "weekdayDMon"),
      };
    });

  const practices = PRACTICES.map((p) => {
    const cell = summary.byPractice.get(p.key)!;
    return {
      key: p.key,
      category: p.category,
      title: p.title,
      description: p.description,
      tone: cell.tone,
      count: cell.count,
      expects: p.expects.map((k) => EVIDENCE_KIND_LABELS[k]),
      evidence: tags
        .filter((t) => t.standardKey === p.key && t.status === "CONFIRMED")
        .map((t) => {
          const d = describe(t);
          return { id: t.id, kind: d.kind, label: d.label, href: d.href };
        }),
    };
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Accreditation & Evidence"
        description="Evidence for the IB Programme Standards and Practices, tagged by teachers as they work and confirmed here. A practice evidenced only one way still reads as thin."
      />
      <AccreditationClient
        queue={queue}
        practices={practices}
        summary={{
          wellEvidenced: summary.wellEvidenced,
          thin: summary.thin,
          gaps: summary.gaps,
          total: PRACTICES.length,
          orphanKeys: summary.orphanKeys,
        }}
        categoryOrder={[...CATEGORY_ORDER]}
      />
    </div>
  );
}
