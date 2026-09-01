import Link from "next/link";

import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { CategoryChip } from "@/components/ui/category-chip";
import { deleteOverallBudgetAction, upsertOverallBudgetAction } from "@/app/(app)/dashboard/actions";
import { requireUserSession } from "@/lib/auth/session";
import { formatInr, formatMonthLabel, monthToParam, parseMonthParam, shiftMonth } from "@/lib/format";
import { getDashboardData } from "@/server/use-cases/get-dashboard";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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

  const budgetProgress = data.overallBudgetStatus
    ? Math.min(data.overallBudgetStatus.utilizationPercent, 100)
    : 0;
  const availableToSpend = data.overallBudgetStatus ? data.overallBudgetStatus.remaining : data.netCashFlow;
  const topCategory = data.categorySpending.slice().sort((left, right) => right.amount - left.amount)[0];
  const previousMonthComparison = data.monthlyComparison[data.monthlyComparison.length - 2];
  const monthDelta = previousMonthComparison ? data.expenses - previousMonthComparison.expenses : 0;

  const insights: string[] = [];
  if (previousMonthComparison) {
    if (monthDelta > 0) {
      insights.push(`Spending is ${formatInr(monthDelta)} higher than last month.`);
    } else if (monthDelta < 0) {
      insights.push(`Spending is ${formatInr(Math.abs(monthDelta))} lower than last month.`);
    }
  }
  if (data.overallBudgetStatus) {
    if (data.overallBudgetStatus.isOverBudget) {
      insights.push(`You are over budget by ${formatInr(Math.abs(data.overallBudgetStatus.remaining))}.`);
    } else {
      insights.push(`You still have ${formatInr(data.overallBudgetStatus.remaining)} left in your monthly budget.`);
    }
  }
  if (topCategory && data.expenses > 0) {
    const percent = ((topCategory.amount / data.expenses) * 100).toFixed(1);
    insights.push(`${topCategory.name} is ${percent}% of your spending this month.`);
  }

  return (
    <main className="w-full space-y-6 md:space-y-7">
      <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#142d42_46%,#1f5d73_100%)] p-4 text-white shadow-[0_30px_60px_rgba(15,23,42,0.18)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-sky-200/85">Overview</p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] md:text-4xl">{formatMonthLabel(month)}</h1>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link
              href={`/dashboard?month=${previousMonth}`}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              ← Prev
            </Link>
            <Link
              href={`/dashboard?month=${nextMonth}`}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              Next →
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-[26px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Available to spend</p>
                <p className="mt-3 text-4xl font-bold tracking-[-0.06em] text-white md:text-5xl">
                  {formatInr(Math.max(availableToSpend, 0))}
                </p>
              </div>
              <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                {data.overallBudgetStatus?.isOverBudget ? "At risk" : "Healthy"}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-200">
              <span>Spent {formatInr(data.expenses)}</span>
              <span>of {data.overallBudgetStatus ? formatInr(data.overallBudgetStatus.budget) : formatInr(data.netCashFlow)}</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  data.overallBudgetStatus?.isOverBudget
                    ? "bg-rose-400"
                    : data.overallBudgetStatus?.isNearLimit
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                }`}
                style={{ width: `${budgetProgress}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200">Income</p>
                <p className="mt-1.5 text-base font-semibold text-white sm:text-xl">{formatInr(data.income)}</p>
              </div>
              <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-rose-200">Spent</p>
                <p className="mt-1.5 text-base font-semibold text-white sm:text-xl">{formatInr(data.expenses)}</p>
              </div>
              <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-sky-200">Net</p>
                <p className="mt-1.5 text-base font-semibold text-white sm:text-xl">{formatInr(data.netCashFlow)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[26px] border border-white/10 bg-[#f8fafc]/8 p-4 backdrop-blur-sm md:p-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Your money</p>
              <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">{formatInr(data.totalAccountBalance)}</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200">Bank & cash</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatInr(data.totalAccountBalance)}</p>
              </div>
              <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-violet-200">Credit cards</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatInr(data.totalCreditCardOutstanding)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Budget</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Monthly spending</h2>
              </div>
              {data.overallBudgetStatus ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    data.overallBudgetStatus.isOverBudget
                      ? "bg-rose-100 text-rose-700"
                      : data.overallBudgetStatus.isNearLimit
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {data.overallBudgetStatus.isOverBudget
                    ? "Over budget"
                    : data.overallBudgetStatus.isNearLimit
                      ? "Near limit"
                      : "On track"}
                </span>
              ) : null}
            </div>

            {data.overallBudgetStatus ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Spent</p>
                    <p className="mt-1 text-3xl font-bold tracking-[-0.05em] text-slate-900">{formatInr(data.overallBudgetStatus.spent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Budget</p>
                    <p className="mt-1 text-lg font-semibold text-slate-800">{formatInr(data.overallBudgetStatus.budget)}</p>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      data.overallBudgetStatus.isOverBudget
                        ? "bg-rose-500"
                        : data.overallBudgetStatus.isNearLimit
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(data.overallBudgetStatus.utilizationPercent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>{data.overallBudgetStatus.utilizationPercent.toFixed(1)}% used</span>
                  <span className={data.overallBudgetStatus.isOverBudget ? "font-semibold text-rose-600" : "font-semibold text-emerald-600"}>
                    {data.overallBudgetStatus.isOverBudget
                      ? `Over by ${formatInr(Math.abs(data.overallBudgetStatus.remaining))}`
                      : `${formatInr(data.overallBudgetStatus.remaining)} left`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No monthly budget set yet.
              </div>
            )}

            <form action={upsertOverallBudgetAction} className="mt-5 flex flex-col gap-2 md:flex-row">
              <input type="hidden" name="month" value={monthParam} />
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Set monthly budget"
                defaultValue={data.overallBudgetAmount ?? ""}
                className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
              <button className="h-12 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                Save budget
              </button>
            </form>

            {data.overallBudgetStatus ? (
              <form action={deleteOverallBudgetAction} className="mt-2">
                <input type="hidden" name="budgetId" value={data.overallBudgetId ?? ""} />
                <button className="text-sm font-medium text-rose-600 transition hover:text-rose-700">Clear budget</button>
              </form>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Breakdown</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Where your money went</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Top {Math.min(data.categorySpending.length, 6)}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {data.categorySpending.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No spending yet for this month.
                </p>
              ) : (
                data.categorySpending
                  .slice()
                  .sort((left, right) => right.amount - left.amount)
                  .slice(0, 6)
                  .map((item) => (
                    <Link
                      key={item.categoryId}
                      href={`/transactions?month=${monthParam}&categoryId=${item.categoryId}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CategoryChip name={item.name} className="max-w-[12rem]" />
                        <span className="text-xs text-slate-500">
                          {data.expenses > 0 ? `${((item.amount / data.expenses) * 100).toFixed(1)}%` : "0%"}
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-sm font-semibold text-slate-800">{formatInr(item.amount)}</span>
                    </Link>
                  ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Position</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Account balances</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Total
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Cash + bank</p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-slate-900">{formatInr(data.totalAccountBalance)}</p>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-violet-700">Credit cards</p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-violet-900">{formatInr(data.totalCreditCardOutstanding)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Signals</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Insights</h2>
            </div>
            <ul className="mt-5 space-y-3">
              {insights.length > 0 ? (
                insights.map((item) => (
                  <li key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                  No activity insights yet for this month.
                </li>
              )}
            </ul>
          </section>
        </div>
      </section>

      <DashboardCharts
        categorySpending={data.categorySpending}
        dailySpending={data.dailySpending}
        monthlyComparison={data.monthlyComparison}
        categoryTrend={data.categoryTrend}
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Category budgets</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Spending control</h2>
          </div>
          <Link href="/categories" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            Manage
          </Link>
        </div>

        <div className="space-y-3">
          {data.categoryBudgetStatuses.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Set category budgets to keep a tighter handle on spending.
            </p>
          ) : (
            data.categoryBudgetStatuses.slice(0, 4).map((item) => (
              <div key={item.budgetId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <CategoryChip name={item.categoryName} />
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      item.isOverBudget ? "bg-rose-100 text-rose-700" : item.isNearLimit ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.utilizationPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>{formatInr(item.spent)} spent</span>
                  <span className={item.isOverBudget ? "font-semibold text-rose-600" : "font-semibold text-emerald-600"}>
                    {item.isOverBudget ? `Over by ${formatInr(Math.abs(item.remaining))}` : `${formatInr(item.remaining)} left`}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      item.isOverBudget ? "bg-rose-500" : item.isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(item.utilizationPercent, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

