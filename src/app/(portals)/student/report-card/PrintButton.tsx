"use client";

import { Download } from "lucide-react";

/**
 * Print-to-PDF export: injects a print stylesheet that isolates one region of
 * the page and opens the browser print dialog — Save as PDF gives a clean A4
 * document.
 *
 * Parameterised because the parent grades page needed exactly this and had a
 * dead <button> instead: a Server Component button with no onClick, no form and
 * no type, captioned "Download Official PDF".
 */
export default function PrintButton({
  targetId = "report-print",
  label = "Download PDF",
  className = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg mb-6",
}: {
  /** id of the element to print. Everything else is hidden. */
  targetId?: string;
  label?: string;
  className?: string;
}) {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body * { visibility: hidden !important; }
          #${targetId}, #${targetId} * { visibility: visible !important; }
          #${targetId} {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          aside, header, nav { display: none !important; }
        }
      `}</style>
      <button type="button" onClick={() => window.print()} className={className}>
        <Download size={18} aria-hidden /> {label}
      </button>
    </>
  );
}
