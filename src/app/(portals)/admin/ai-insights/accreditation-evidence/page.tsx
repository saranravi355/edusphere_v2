import { redirect } from "next/navigation";

/**
 * This was the "Accreditation Evidence Finder" preview: a scripted screen that
 * described coverage it had not measured. /admin/accreditation now computes the
 * same judgement from real tags, so the preview is superseded rather than
 * merely duplicated.
 *
 * Kept as a redirect because the AI Insights hub, the sidebar and any
 * bookmark still point here.
 */
export default function AccreditationEvidencePage() {
  redirect("/admin/accreditation");
}
