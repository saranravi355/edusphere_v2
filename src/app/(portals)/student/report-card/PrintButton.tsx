"use client";

import { Download } from "lucide-react";

/**
 * Print-to-PDF export: injects a print stylesheet that isolates the transcript
 * (#report-print) and opens the browser print dialog — Save as PDF gives the
 * student a clean A4 report card.
 */
export default function PrintButton() {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body * { visibility: hidden !important; }
          #report-print, #report-print * { visibility: visible !important; }
          #report-print {
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
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg mb-6"
      >
        <Download size={18} /> Download PDF
      </button>
    </>
  );
}
