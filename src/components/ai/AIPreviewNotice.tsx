import { Info } from "lucide-react";

/**
 * Says, on the page itself, that what follows is a mock-up.
 *
 * The AI screens show grades, risk levels and named students. Sample output of
 * that shape is indistinguishable from real analysis at a glance, and a teacher
 * who believes a fabricated risk score about a child has been actively misled
 * by the software. Writing "these pages are illustrative" in a project document
 * does not help anyone standing in front of the screen.
 *
 * This is deliberately quiet rather than a red warning: the page is a working
 * demonstration, not a fault. It just has to be honest about which it is.
 */
export default function AIPreviewNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
      <Info size={16} className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" aria-hidden />
      <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
        <span className="font-semibold">Preview.</span>{" "}
        {children ?? (
          <>
            The output below is sample content that shows what this feature would produce. It is not
            an analysis of your school&rsquo;s data, and nothing here is saved or sent to anyone.
          </>
        )}
      </p>
    </div>
  );
}
