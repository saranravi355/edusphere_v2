import { redirect } from "next/navigation";

/**
 * The second student profile.
 *
 * This route rendered its own view of a Student — six fields: date of birth,
 * grade level, both parents' names, the mother's occupation and the address —
 * from the same row that /admin/students/registry/[id] renders thirty from. Two
 * pages, one record, and they disagreed in both directions: this one was the
 * only place mother's occupation appeared at all, while the registry profile
 * was the only place with contact details, guardianship, IB subjects,
 * attendance and health.
 *
 * That is how the gap was noticed — the same student looked emptier here than
 * there. Rather than keep two profiles in step, there is one. The missing
 * fields have been added to the registry profile, which also has the editor,
 * the photo upload and the academic record, and this URL sends people to it.
 *
 * Kept as a redirect rather than deleted: the id is the same Student id in both
 * routes, so every existing link and bookmark still lands on the right person.
 * Not `permanentRedirect` — a 308 is cached hard by browsers, and this route may
 * one day become what its path suggests, a *user* account page covering
 * teachers and parents too, rather than a student one.
 */
export default async function UserDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/students/registry/${id}`);
}
