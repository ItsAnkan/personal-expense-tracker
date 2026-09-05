import type { InsightAIResponse, InsightAnalytics, InsightObservation } from "@/lib/ai/insight-analytics";

export interface AIInsightProvider {
  generate(analytics: InsightAnalytics): Promise<InsightAIResponse>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function sanitizeResponse(payload: unknown): InsightAIResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid response shape");
  }

  const typed = payload as { summary?: unknown; observations?: unknown };
  const summary =
    typeof typed.summary === "string"
      ? typed.summary
      : "Not enough historical data to identify a clear pattern yet.";
  const observations = Array.isArray(typed.observations) ? typed.observations : [];

  const cleaned: InsightObservation[] = observations
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const title = typeof item.title === "string" ? item.title : "Key observation";
      const description =
        typeof item.description === "string" ? item.description : "No additional detail provided.";
      const severity =
        item.severity === "positive" || item.severity === "attention" || item.severity === "neutral"
          ? item.severity
          : "neutral";
      return { title, description, severity } satisfies InsightObservation;
    })
    .slice(0, 3);

  return { summary, observations: cleaned };
}

export class GeminiInsightProvider implements AIInsightProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? "";
    this.model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    this.baseUrl = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";
  }

  async generate(analytics: InsightAnalytics): Promise<InsightAIResponse> {
    if (!this.apiKey) {
      throw new AIProviderError("GEMINI_API_KEY is not configured");
    }

    const endpoint = `${this.baseUrl.replace(/\/$/, "")}/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: [
                    "You are a personal finance assistant.",
                    "Analyze the structured financial data provided and return strict JSON only.",
                    "Shape: {\"summary\": string, \"observations\": [{\"title\": string, \"description\": string, \"severity\": \"neutral\" | \"positive\" | \"attention\"}] }.",
                    "Rules: use only the facts provided; never invent numbers; no investment advice; keep it concise and factual.",
                    "Data:",
                    JSON.stringify(analytics),
                  ].join("\n"),
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new AIProviderError(
          `AI gateway rejected the request: ${response.status} ${text.slice(0, 200)}`,
          response.status,
        );
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new AIProviderError("AI response was empty");
      }

      const parsed = JSON.parse(content) as unknown;
      return sanitizeResponse(parsed);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AIProviderError("AI request timed out", 504);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export class LocalInsightProvider implements AIInsightProvider {
  async generate(analytics: InsightAnalytics): Promise<InsightAIResponse> {
    const netPositionChange = analytics.financialPosition.change ?? 0;
    const cardChange = analytics.creditCards.change ?? 0;
    const incomeChange = analytics.income.changePercent ?? 0;
    const category = analytics.categoryFocus.name ?? "your top spending category";
    const categoryShare = analytics.categoryFocus.shareOfSpend || 0;

    const summaryBits: string[] = [];

    if (netPositionChange !== 0) {
      summaryBits.push(
        netPositionChange > 0
          ? `Your overall financial position improved by ${formatCurrency(Math.abs(netPositionChange))}.`
          : `Your overall financial position decreased by ${formatCurrency(Math.abs(netPositionChange))}.`,
      );
    } else {
      summaryBits.push("Your overall financial position stayed broadly stable.");
    }

    if (cardChange !== 0) {
      summaryBits.push(
        cardChange > 0
          ? `Credit-card outstanding increased by ${formatCurrency(Math.abs(cardChange))}.`
          : `Credit-card outstanding fell by ${formatCurrency(Math.abs(cardChange))}.`,
      );
    } else {
      summaryBits.push("Credit-card outstanding is steady compared with the previous period.");
    }

    if (Math.abs(incomeChange) > 0) {
      summaryBits.push(
        incomeChange > 0
          ? `Income was ${incomeChange.toFixed(1)}% higher than last month.`
          : `Income was ${Math.abs(incomeChange).toFixed(1)}% lower than last month.`,
      );
    } else {
      summaryBits.push("Income remained relatively stable compared with the prior period.");
    }

    const observations: InsightObservation[] = [
      {
        title: "Net position",
        description:
          netPositionChange > 0
            ? `Net position increased by ${formatCurrency(Math.abs(netPositionChange))} compared with the prior period.`
            : netPositionChange < 0
              ? `Net position declined by ${formatCurrency(Math.abs(netPositionChange))} compared with the prior period.`
              : "Net position was stable compared with the prior period.",
        severity: netPositionChange > 0 ? "positive" : netPositionChange < 0 ? "attention" : "neutral",
      },
      {
        title: "Credit cards",
        description:
          cardChange > 0
            ? `Outstanding balance increased by ${formatCurrency(Math.abs(cardChange))}.`
            : cardChange < 0
              ? `Outstanding balance fell by ${formatCurrency(Math.abs(cardChange))}.`
              : "Outstanding balance remained consistent with the previous period.",
        severity: cardChange > 0 ? "attention" : cardChange < 0 ? "positive" : "neutral",
      },
      {
        title: "Income movement",
        description:
          incomeChange > 0
            ? `Income was ${incomeChange.toFixed(1)}% higher than last month.`
            : incomeChange < 0
              ? `Income was ${Math.abs(incomeChange).toFixed(1)}% lower than last month.`
              : "Income remained steady compared with the previous period.",
        severity: incomeChange > 0 ? "positive" : incomeChange < 0 ? "attention" : "neutral",
      },
      {
        title: "Top category",
        description:
          categoryShare > 0
            ? `${category} represents ${categoryShare.toFixed(1)}% of spending this period.`
            : "Not enough spending data to identify a dominant category yet.",
        severity: categoryShare > 35 ? "attention" : "neutral",
      },
    ].slice(0, 3) as InsightObservation[];

    return {
      summary: summaryBits.join(" ") || "Not enough historical data to identify a clear pattern yet.",
      observations,
    };
  }
}

export function createInsightProvider(): AIInsightProvider {
  if (process.env.GEMINI_API_KEY) {
    return new GeminiInsightProvider();
  }

  return new LocalInsightProvider();
}