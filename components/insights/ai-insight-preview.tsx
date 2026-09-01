"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { InsightAIResponse, InsightAnalytics } from "@/lib/ai/insight-analytics";

interface AIInsightPreviewProps {
  analytics: InsightAnalytics;
}

const severityStyles = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
  attention: "border-amber-200 bg-amber-50 text-amber-900",
} as const;

export function AIInsightPreview({ analytics }: AIInsightPreviewProps) {
  const [insight, setInsight] = useState<InsightAIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const loadedKeyRef = useRef<string | null>(null);
  const analyticsKey = useMemo(() => JSON.stringify(analytics), [analytics]);

  const loadInsight = useCallback(async (force = false) => {
    if (!force && loadedKeyRef.current === analyticsKey) {
      return;
    }

    setLoading(true);
    setError(false);
    setRateLimited(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/insights/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analytics }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Unavailable");
      }

      const data = (await response.json()) as InsightAIResponse & {
        metadata?: {
          reason?: string;
        };
      };

      setInsight(data);
      setRateLimited(data.metadata?.reason === "rate_limited");
      loadedKeyRef.current = analyticsKey;
    } catch {
      setError(true);
      setInsight(null);
      loadedKeyRef.current = null;
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [analytics, analyticsKey]);

  useEffect(() => {
    void loadInsight();
  }, [loadInsight]);

  if (loading && !insight) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span className="text-base text-slate-500">*</span>
            <span>AI financial brief</span>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
            onClick={() => void loadInsight(true)}
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 animate-pulse space-y-3">
          <div className="h-3 w-2/3 rounded-full bg-slate-200" />
          <div className="h-3 w-full rounded-full bg-slate-200" />
          <div className="h-3 w-5/6 rounded-full bg-slate-200" />
        </div>
        <p className="mt-4 text-sm text-slate-500">Analyzing your financial data...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="text-base text-slate-500">*</span>
          <span>AI financial brief</span>
        </div>
        <p className="mt-4 text-sm text-slate-600">AI insights are temporarily unavailable.</p>
        <button
          type="button"
          className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void loadInsight(true)}
        >
          Try again
        </button>
      </section>
    );
  }

  const summary = insight?.summary ?? "Not enough historical data to identify a clear pattern yet.";
  const observations = insight?.observations ?? [];

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="text-base text-slate-500">*</span>
          <span>AI financial brief</span>
        </div>
        <button
          type="button"
          onClick={() => void loadInsight(true)}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      <h2 className="mt-4 text-base font-semibold text-slate-900">What stands out this month</h2>
      <p className="mt-3 text-sm leading-6 text-slate-700">{summary}</p>

      <div className="mt-4 space-y-2">
        {observations.slice(0, 3).map((observation) => (
          <div key={observation.title} className={`rounded-2xl border p-3 ${severityStyles[observation.severity]}`}>
            <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{observation.title}</p>
            <p className="mt-2 text-sm leading-5">{observation.description}</p>
          </div>
        ))}
      </div>

      {rateLimited ? (
        <p className="mt-3 text-xs text-slate-500">
          Live AI is rate-limited right now, so this brief is generated from the same financial facts using fallback mode.
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">AI-generated</p>
        <a href="#insights-analysis" className="text-sm font-medium text-slate-700 hover:text-slate-900">
          View full analysis
        </a>
      </div>
    </section>
  );
}