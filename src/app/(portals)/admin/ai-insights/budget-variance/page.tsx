"use client";

import AIDemoPage from "@/components/ai/AIDemoPage";
import { IndianRupee } from "lucide-react";

export default function BudgetVariancePage() {
  return (
    <AIDemoPage
      title="Budget Variance Analyzer"
      description="Explains why actual spend differs from budget, line by line, rather than only reporting that it does."
      icon={IndianRupee}
      accent="amber"
      panelTitle="Variance Explainer"
      panelDescription="Decomposes each variance into price, volume and timing, and separates one-off causes from ones that will repeat."
      runLabel="Explain Variances"
      runningLabel="Decomposing Spend..."
      completeLabel="Analysis Complete"
      completeSubLabel="Year to date · 6 lines above threshold"
      emptyTitle="Nothing Explained Yet"
      emptySubtitle="Run the analyser to see what is driving each budget variance."
      result={{
        kind: "findings",
        heading: "Variances above threshold",
        items: [
          {
            title: "Transport — over by 18%",
            meta: "Year to date",
            tone: "high",
            badgeLabel: "Will repeat",
            body: "Volume, not price: 34 more riders than budgeted across two routes. Fuel cost per kilometre is within 2% of plan, so this recurs every month until the route plan changes.",
          },
          {
            title: "Salaries — under by 4%",
            meta: "Year to date",
            tone: "medium",
            badgeLabel: "Timing",
            body: "Two vacancies unfilled for a combined five months. The underspend closes as soon as the posts are filled and should not be treated as a saving.",
          },
          {
            title: "Laboratory consumables — over by 26%",
            meta: "Term 1",
            tone: "medium",
            badgeLabel: "One-off",
            body: "A single restocking order placed in one month rather than spread across the year. Full-year spend is tracking close to budget.",
          },
          {
            title: "Utilities — over by 9%",
            meta: "Year to date",
            tone: "medium",
            badgeLabel: "Price",
            body: "Consumption is flat against last year; the unit tariff rose in the second quarter. No operational change would recover this.",
          },
        ],
      }}
    />
  );
}
