import PageHeader from '@/components/ui/PageHeader';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import WritingAssistantClient from './WritingAssistantClient';

export const dynamic = 'force-dynamic';

export default async function WritingAssistantPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') redirect('/');

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Writing Assistant"
        description="Paste a draft — a paragraph, a section, or the whole thing — and get feedback on clarity, structure, argument and grammar before you submit it."
      />
      <WritingAssistantClient />
    </div>
  );
}
