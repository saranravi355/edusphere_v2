import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getPoolStatus } from '@/lib/ai/pool';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  healthy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'cooling-down': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  disabled: 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400',
  unknown: 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400'
};

function formatWhen(ts: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

/**
 * Read-only view into the AI failover pool's in-memory health state - built specifically to
 * see the REAL error message an account is cooling down for (Groq's actual auth/rate-limit
 * text), instead of guessing from the generic "cooling down for Ns" summary the grading
 * queue shows. Health state is per-instance and resets on cold start, so this only ever
 * reflects whatever instance served this request - not a durable history.
 */
export default async function ProviderStatusPage() {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) redirect('/');

  const accounts = getPoolStatus();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="AI Provider Status"
        description="Live health of each configured Groq/Gemini/OpenAI account, from this server instance's own memory."
        action={
          <Link
            href="/teacher/grading/ai-grader"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200"
          >
            <ArrowLeft size={14} aria-hidden /> Back to grader
          </Link>
        }
      />

      {accounts.length === 0 ? (
        <p className="text-sm text-slate-500">
          No AI provider accounts are configured. Set GROQ_API_KEY (and optionally GEMINI_API_KEY, OPENAI_API_KEY) in the environment.
        </p>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                  <th className="p-4 font-medium">Account</th>
                  <th className="p-4 font-medium">Key</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Requests</th>
                  <th className="p-4 font-medium min-w-[280px]">Last error</th>
                  <th className="p-4 font-medium">Last success</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {accounts.map(a => (
                  <tr key={a.accountId}>
                    <td className="p-4">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{a.label}</p>
                      <p className="text-xs text-slate-500">priority {a.priority}</p>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-500">{a.maskedKey}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_STYLE[a.health.status] ?? ''}`}>
                        {a.health.status}
                      </span>
                      {a.health.status === 'cooling-down' && a.health.cooldownUntil && (
                        <p className="text-[11px] text-red-500 mt-1">
                          until {formatWhen(a.health.cooldownUntil)}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {a.health.successCount}/{a.health.requestCount} ok
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300 max-w-[320px]">
                      {a.health.lastError ? (
                        <>
                          <p className="break-words">{a.health.lastError}</p>
                          <p className="text-slate-400 mt-1">{formatWhen(a.health.lastErrorAt)}</p>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500">{formatWhen(a.health.lastSuccessAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">
        This reflects only the server instance that handled this request - Vercel's Fluid Compute can route different
        requests to different warm instances, each with its own memory of failures. If this shows no error at all but
        the grader still reports a cooldown, the failing instance is a different one; refresh a few times or wait for
        the next real deployment.
      </p>
    </div>
  );
}
