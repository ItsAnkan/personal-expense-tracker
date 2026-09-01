import Link from "next/link";

import { AIInsightPreview } from "@/components/insights/ai-insight-preview";
import { buildInsightAnalytics } from "@/lib/ai/insight-analytics";
import { requireUserSession } from "@/lib/auth/session";
import { formatInr, formatMonthLabel, monthBounds, monthToParam, parseMonthParam, shiftMonth } from "@/lib/format";
import { listTransactionsByUser } from "@/server/repositories/transaction-repo";
import { getDashboardData } from "@/server/use-cases/get-dashboard";

export const dynamic = "force-dynamic";

interface InsightsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function isPositive(value: number) {
  return value > 0;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const session = await requireUserSession();
  const params = (await searchParams) ?? {};
  const monthQueryParam =
    typeof params.month === "string"
      ? params.month
      : Array.isArray(params.month)
        ? params.month[0]
        : undefined;
  const month = parseMonthParam(monthQueryParam);

  const currentMonthBounds = monthBounds(month);
  const previousMonthRef = shiftMonth(month, -1);
  const previousMonthBounds = monthBounds(previousMonthRef);

  const [data, previousData, currentTransactions, previousTransactions] = await Promise.all([
    getDashboardData(session.user.id, month),
    getDashboardData(session.user.id, previousMonthRef),
    listTransactionsByUser(session.user.id, {
      monthStart: currentMonthBounds.start,
      monthEnd: currentMonthBounds.end,
    }),
    listTransactionsByUser(session.user.id, {
      monthStart: previousMonthBounds.start,
      monthEnd: previousMonthBounds.end,
    }),
  ]);

  const previousMonth = monthToParam(previousMonthRef);
  const nextMonth = monthToParam(shiftMonth(month, 1));
  const insightAnalytics = buildInsightAnalytics(
    data,
    previousData,
    currentTransactions.map((transaction) => ({ amount: Number(transaction.amount), type: transaction.type })),
    previousTransactions.map((transaction) => ({ amount: Number(transaction.amount), type: transaction.type })),
  );

  const topCategory = data.categorySpending
    .slice()
    .sort((left, right) => right.amount - left.amount)[0];

  const monthlyTrend = data.monthlyComparison.slice().reverse();
  const maxSpend = Math.max(...monthlyTrend.map((item) => item.expenses || 0), 1);
  const lastComparison = data.monthlyComparison[data.monthlyComparison.length - 1];
  const previousComparison = data.monthlyComparison[data.monthlyComparison.length - 2];
  const trendDelta =
    lastComparison && previousComparison ? lastComparison.expenses - previousComparison.expenses : null;

  const highlightCards = [
    {
      title: "Top category",
      value: topCategory ? topCategory.name : "No data",
      detail: topCategory ? `${formatInr(topCategory.amount)} this month` : "Add a few expenses to begin",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      title: "Budget status",
      value: data.overallBudgetStatus
        ? data.overallBudgetStatus.isOverBudget
          ? "Over budget"
          : "On track"
        : "No budget",
      detail: data.overallBudgetStatus
        ? `${formatInr(Math.abs(data.overallBudgetStatus.remaining))} ${data.overallBudgetStatus.isOverBudget ? "over" : "left"}`
        : "Set a monthly budget to track spend",
      tone: data.overallBudgetStatus && data.overallBudgetStatus.isOverBudget
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-sky-200 bg-sky-50 text-sky-900",
    },
    {
      title: "Cash flow",
      value: isPositive(data.netCashFlow) ? "Positive" : "Tight",
      detail: `${formatInr(Math.abs(data.netCashFlow))} ${isPositive(data.netCashFlow) ? "saved" : "negative"}`,
      tone: isPositive(data.netCashFlow)
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-amber-200 bg-amber-50 text-amber-900",
    },
    {
      title: "Credit card",
      value: formatInr(data.totalCreditCardOutstanding),
      detail: data.totalCreditCardOutstanding > 0 ? "Outstanding balance" : "No card balance due",
      tone: data.totalCreditCardOutstanding > 0
        ? "border-violet-200 bg-violet-50 text-violet-900"
        : "border-slate-200 bg-slate-100 text-slate-900",
    },
  ];

  const categoryRanking = data.categorySpending
    .slice()
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 4);

  return (
    <main className="w-full space-y-5 md:space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] backdrop-blur-sm md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Insights</p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-slate-900 md:text-3xl">Understand your financial patterns</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/insights?month=${previousMonth}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
              ← Prev
            </Link>
            <Link href={`/insights?month=${nextMonth}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
              Next →
            </Link>
          </div>
        </div>
        <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
          {formatMonthLabel(month)}
        </div>
      </section>

      <AIInsightPreview analytics={insightAnalytics} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlightCards.map((card) => (
          <article key={card.title} className={`rounded-[24px] border p-4 shadow-[0_18px_30px_rgba(15,23,42,0.02)] ${card.tone}`}>
            <p className="text-[10px] uppercase tracking-[0.18em] opacity-75">{card.title}</p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.05em]">{card.value}</p>
            <p className="mt-2 text-sm opacity-80">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Cash flow</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Spending trend</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              6 months
            </span>
          </div>

          <div className="mt-6 flex h-52 items-end gap-2 sm:gap-3">
            {monthlyTrend.map((point) => {
              const height = Math.max((point.expenses / maxSpend) * 100, 8);
              const label = new Date(Date.UTC(point.month.year, point.month.month - 1, 1)).toLocaleDateString("en-IN", {
                month: "short",
                timeZone: "UTC",
              });

              return (
                <div key={`${point.month.year}-${point.month.month}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-full w-full items-end justify-center rounded-t-2xl bg-slate-100 p-1">
                    <div
                      className="w-full rounded-t-xl bg-[linear-gradient(180deg,#0f172a_0%,#334155_100%)]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">{label}</span>
                </div>
              );
            })}
          </div>
        </article>

        <aside className="space-y-5">
          <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Key signal</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">What stands out</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-700">Income</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{formatInr(data.income)}</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-rose-700">Spend</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{formatInr(data.expenses)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">Net</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{formatInr(data.netCashFlow)}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-slate-900 p-4 text-white shadow-[0_20px_40px_rgba(15,23,42,0.14)] md:p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Balance</p>
            <h2 className="mt-1 text-xl font-bold text-white">Total account picture</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-300">Accounts</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatInr(data.totalAccountBalance)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-300">Cards</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatInr(data.totalCreditCardOutstanding)}</p>
              </div>
            </div>
          </article>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Spending mix</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Top categories</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {categoryRanking.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No category spending yet for this month.
              </div>
            ) : (
              categoryRanking.map((item) => {
                const share = data.expenses > 0 ? (item.amount / data.expenses) * 100 : 0;
                return (
                  <div key={item.categoryId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">{item.name}</span>
                      <span className="font-semibold text-slate-900">{formatInr(item.amount)}</span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#0ea5e9)]" style={{ width: `${Math.min(share, 100)}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">{share.toFixed(1)}% of spend</p>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article id="insights-analysis" className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Summary</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Financial snapshot</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              {topCategory ? (
                <>
                  <p className="font-medium text-slate-800">Top driver</p>
                  <p className="mt-2">{topCategory.name} leads your spending this month at {formatInr(topCategory.amount)}.</p>
                </>
              ) : (
                <p>No spending data for this period yet.</p>
              )}
            </div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              {trendDelta !== null ? (
                <>
                  <p className="font-medium text-slate-800">Trend</p>
                  <p className="mt-2">
                    {trendDelta > 0
                      ? `Spending is ${formatInr(trendDelta)} higher than last month.`
                      : `Spending is ${formatInr(Math.abs(trendDelta))} lower than last month.`}
                  </p>
                </>
              ) : (
                <p>Not enough historical data to compare a prior month.</p>
              )}
            </div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-800">Balance health</p>
              <p className="mt-2">
                {data.totalCreditCardOutstanding > 0
                  ? `You currently carry ${formatInr(data.totalCreditCardOutstanding)} in card debt.`
                  : "Your card balances are clear this month."}
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
