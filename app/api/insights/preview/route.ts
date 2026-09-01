import { NextResponse } from "next/server";

import type { InsightAnalytics } from "@/lib/ai/insight-analytics";
import { AIProviderError, LocalInsightProvider, createInsightProvider } from "@/lib/ai/insight-provider";
import { requireUserSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    await requireUserSession();

    const body = (await request.json()) as { analytics?: unknown };
    const analytics = body.analytics;

    if (!analytics || typeof analytics !== "object") {
      return NextResponse.json(
        {
          summary: "Not enough historical data to identify a clear pattern yet.",
          observations: [],
        },
        { status: 400 },
      );
    }

    const provider = createInsightProvider();
    const analyticsData = analytics as InsightAnalytics;

    try {
      const result = await provider.generate(analyticsData);
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AIProviderError) {
        const fallbackProvider = new LocalInsightProvider();
        const fallbackResult = await fallbackProvider.generate(analyticsData);
        return NextResponse.json({
          ...fallbackResult,
          metadata: {
            source: "fallback",
            reason: error.status === 429 ? "rate_limited" : "provider_unavailable",
          },
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("AI insight generation failed", error);

    return NextResponse.json(
      {
        summary: "AI insights are temporarily unavailable.",
        observations: [],
      },
      { status: 500 },
    );
  }
}