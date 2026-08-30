"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#0f172a", "#334155", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

interface CategorySpendingItem {
  categoryId: string;
  name: string;
  amount: number;
}

interface DailySpendingItem {
  date: string;
  amount: number;
}

interface MonthlyComparisonItem {
  month: { year: number; month: number };
  income: number;
  expenses: number;
}

interface CategoryTrendData {
  categoryId: string;
  categoryName: string;
  points: Array<{ year: number; month: number; amount: number }>;
}

interface DashboardChartsProps {
  categorySpending: CategorySpendingItem[];
  dailySpending: DailySpendingItem[];
  monthlyComparison: MonthlyComparisonItem[];
  categoryTrend: CategoryTrendData | null;
}

export function DashboardCharts({
  categorySpending,
  dailySpending,
  monthlyComparison,
  categoryTrend,
}: DashboardChartsProps) {
  const categoryData = categorySpending
    .filter((item) => item.amount > 0)
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 7);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Category mix</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Spending by category</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {categoryData.length} groups
          </span>
        </div>

        {categoryData.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No category spend available yet.
          </div>
        ) : (
          <>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={86}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.categoryId} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      borderColor: "#e2e8f0",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.map((item, index) => (
                <div key={item.categoryId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-2.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{item.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Trend</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Spending over time</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Daily
          </span>
        </div>
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySpending}>
              <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                }}
              />
              <Line type="monotone" dataKey="amount" stroke="#0f172a" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Comparison</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Monthly comparison</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            6m
          </span>
        </div>
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyComparison.map((item) => ({
                label: `${String(item.month.month).padStart(2, "0")}/${String(item.month.year).slice(2)}`,
                expenses: item.expenses,
                income: item.income,
              }))}
            >
              <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                }}
              />
              <Bar dataKey="income" fill="#34d399" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="#0f172a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {categoryTrend ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Category trend</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{categoryTrend.categoryName}</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              6m
            </span>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={categoryTrend.points.map((point) => ({
                  label: `${String(point.month).padStart(2, "0")}/${String(point.year).slice(2)}`,
                  amount: point.amount,
                }))}
              >
                <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    borderColor: "#e2e8f0",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Line type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}
    </div>
  );
}
