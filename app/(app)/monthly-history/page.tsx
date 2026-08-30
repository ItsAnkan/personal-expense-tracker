import Link from "next/link";

import { MonthlyHistoryChart } from "@/components/charts/monthly-history-chart";
import { requireUserSession } from "@/lib/auth/session";
import { formatInr, formatMonthLabel, monthToParam, parseMonthParam, shiftMonth } from "@/lib/format";
import { getSingleQueryParam } from "@/lib/web";
import { getMonthlyHistoryData } from "@/server/use-cases/get-monthly-history";

export const dynamic = "force-dynamic";

interface MonthlyHistoryPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MonthlyHistoryPage({ searchParams }: MonthlyHistoryPageProps) {
  const session = await requireUserSession();
  const params = (await searchParams) ?? {};
  const selectedMonth = parseMonthParam(getSingleQueryParam(params.month));

  const months = Array.from({ length: 6 }, (_, index) => shiftMonth(selectedMonth, -index));
  const rows = await getMonthlyHistoryData(session.user.id, months);

  return (
    <main className="w-full space-y-5">
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Monthly History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare income, expense and net cash flow month over month.
        </p>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
        <MonthlyHistoryChart rows={rows} />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
        <div className="space-y-3">
          {rows.map((row) => (
            <Link
              key={monthToParam(row.month)}
              href={`/dashboard?month=${monthToParam(row.month)}`}
              className="block rounded-lg border border-amber-200 bg-white p-3 hover:bg-amber-50"
            >
              <p className="font-semibold">{formatMonthLabel(row.month)}</p>
              <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
                <p>Income: {formatInr(row.income)}</p>
                <p>Expenses: {formatInr(row.expenses)}</p>
                <p>Net Cash Flow: {formatInr(row.netCashFlow)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
