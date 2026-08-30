import { requireUserSession } from "@/lib/auth/session";
import { formatInr, formatMonthLabel, monthToParam, parseMonthParam, shiftMonth } from "@/lib/format";
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

  const data = await getDashboardData(session.user.id, month);
  const previousMonth = monthToParam(shiftMonth(month, -1));
  const nextMonth = monthToParam(shiftMonth(month, 1));
  const monthParam = monthToParam(month);

  const topCategory = data.categorySpending
    .slice()
    .sort((left, right) => right.amount - left.amount)[0];

  const lastComparison = data.monthlyComparison[data.monthlyComparison.length - 1];
  const previousComparison = data.monthlyComparison[data.monthlyComparison.length - 2];

  const insightCards = [
    {
      title: "Top category",
      value: topCategory ? topCategory.name : "No data",
      detail: topCategory ? `${formatInr(topCategory.amount)} this month` : "Add a few expenses to begin",
      tone: "bg-emerald-50 text-emerald-900 border-emerald-200",
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
        ? "bg-rose-50 text-rose-900 border-rose-200"
        : "bg-sky-50 text-sky-900 border-sky-200",
    },
    {
      title: "Cash flow",
      value: isPositive(data.netCashFlow) ? "Positive" : "Tight",
      detail: `${formatInr(Math.abs(data.netCashFlow))} ${isPositive(data.netCashFlow) ? "saved" : "negative"}`,
      tone: isPositive(data.netCashFlow)
        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
        : "bg-amber-50 text-amber-900 border-amber-200",
    },
    {
      title: "Credit card",
      value: formatInr(data.totalCreditCardOutstanding),
      detail: data.totalCreditCardOutstanding > 0 ? "Outstanding balance" : "No card balance due",
      tone: data.totalCreditCardOutstanding > 0
        ? "bg-violet-50 text-violet-900 border-violet-200"
        : "bg-slate-100 text-slate-900 border-slate-200",
    },
  ];

  const trendDelta =
    lastComparison && previousComparison ? lastComparison.expenses - previousComparison.expenses : null;

  return (
    <main className="w-full space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Insights</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{formatMonthLabel(month)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/insights?month=${previousMonth}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">← Prev</a>
            <a href={`/insights?month=${nextMonth}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Next →</a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insightCards.map((card) => (
          <article key={card.title} className={`rounded-2xl border p-4 ${card.tone}`}>
            <p className="text-[11px] uppercase tracking-[0.18em] opacity-75">{card.title}</p>
            <p className="mt-3 text-2xl font-bold">{card.value}</p>
            <p className="mt-2 text-sm opacity-80">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">What changed</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Monthly comparison</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{formatMonthLabel(month)}</span>
          </div>

          <div className="mt-6 space-y-4">
            {trendDelta !== null ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Compared with last month</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {trendDelta > 0 ? `+${formatInr(trendDelta)}` : `${formatInr(trendDelta)}`}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {trendDelta > 0 ? "You spent more than last month." : "You spent less than last month."}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Not enough prior-month data yet.
              </div>
            )}

            <div className="space-y-3">
              {data.categorySpending
                .slice()
                .sort((left, right) => right.amount - left.amount)
                .slice(0, 5)
                .map((item) => {
                  const share = data.expenses > 0 ? (item.amount / data.expenses) * 100 : 0;
                  return (
                    <div key={item.categoryId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        <span className="text-sm font-semibold text-slate-700">{formatInr(item.amount)}</span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#0ea5e9)]" style={{ width: `${Math.min(share, 100)}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{share.toFixed(1)}% of this month’s spending</p>
                    </div>
                  );
                })}
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-[#0f172a] p-5 text-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Quick read</p>
          <h2 className="mt-1 text-xl font-bold text-white">This month at a glance</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-300">Income</p>
              <p className="mt-1 text-2xl font-bold text-white">{formatInr(data.income)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-300">Spent</p>
              <p className="mt-1 text-2xl font-bold text-white">{formatInr(data.expenses)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
              <p className="text-emerald-200">Net cash flow</p>
              <p className="mt-1 text-2xl font-bold text-white">{formatInr(data.netCashFlow)}</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
