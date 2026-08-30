"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface HistoryRow {
  month: { year: number; month: number };
  income: number;
  expenses: number;
  netCashFlow: number;
}

export function MonthlyHistoryChart({ rows }: { rows: HistoryRow[] }) {
  const chartRows = rows
    .slice()
    .reverse()
    .map((row) => ({
      label: `${String(row.month.month).padStart(2, "0")}/${String(row.month.year).slice(2)}`,
      income: row.income,
      expenses: row.expenses,
    }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartRows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="income" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
