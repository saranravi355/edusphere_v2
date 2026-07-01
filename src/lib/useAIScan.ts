"use client";

import { useState, useCallback } from "react";

/**
 * Shared hook for the "run AI scan" mock interaction used across every
 * AI mockup page (early warning, workload balancer, attrition risk, etc).
 * Mirrors the setTimeout-based pattern already used in the existing
 * AI mock pages (ai-grader, sentiment-ai, predictive-ai) for consistency.
 */
export function useAIScan(durationMs: number = 2400) {
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);

  const run = useCallback(() => {
    setComplete(false);
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setComplete(true);
    }, durationMs);
  }, [durationMs]);

  const reset = useCallback(() => {
    setRunning(false);
    setComplete(false);
  }, []);

  return { running, complete, run, reset };
}
