import type { MonthRef } from "@/domain/accounting/types";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatInr(value: number): string {
  return inrFormatter.format(value);
}

export function parseMonthParam(
  monthParam: string | undefined,
  fallbackDate = new Date(),
): MonthRef {
  if (!monthParam) {
    return { year: fallbackDate.getUTCFullYear(), month: fallbackDate.getUTCMonth() + 1 };
  }

  const match = monthParam.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid month parameter: ${monthParam}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month parameter: ${monthParam}`);
  }

  return { year, month };
}

export function monthToParam(month: MonthRef): string {
  return `${month.year}-${String(month.month).padStart(2, "0")}`;
}

export function formatMonthLabel(month: MonthRef): string {
  const date = new Date(Date.UTC(month.year, month.month - 1, 1));
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function shiftMonth(month: MonthRef, delta: number): MonthRef {
  const date = new Date(Date.UTC(month.year, month.month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function monthBounds(month: MonthRef): { start: Date; end: Date } {
  const start = new Date(Date.UTC(month.year, month.month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(month.year, month.month, 1, 0, 0, 0, 0));
  return { start, end };
}
