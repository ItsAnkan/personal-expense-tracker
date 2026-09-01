import Link from "next/link";
import { notFound } from "next/navigation";

import { createAccountingEngine } from "@/domain/accounting/engine";
import { requireUserSession } from "@/lib/auth/session";
import { formatInr } from "@/lib/format";
import { getAccountById, listAccountsByUser } from "@/server/repositories/account-repo";
import { listTransactionsByUser, listTransactionsInRange } from "@/server/repositories/transaction-repo";
import { toLedgerAccounts, toLedgerTransactions } from "@/server/use-cases/shared";

export const dynamic = "force-dynamic";

const accountTypeLabels = {
  BANK_ACCOUNT: "Bank account",
  CASH: "Cash",
  WALLET: "Wallet",
  CREDIT_CARD: "Credit card",
  OTHER: "Other",
} as const;

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const session = await requireUserSession();
  const { accountId } = await params;

  const [account, accounts, allTransactions, accountTransactions] = await Promise.all([
    getAccountById(session.user.id, accountId),
    listAccountsByUser(session.user.id),
    listTransactionsInRange(session.user.id),
    listTransactionsByUser(session.user.id, { accountId }),
  ]);

  if (!account) {
    notFound();
  }

  const summary = createAccountingEngine(
    toLedgerAccounts(accounts),
    toLedgerTransactions(allTransactions),
  ).calculateAccountBalanceSummary();

  const currentBalance = Number(summary.balances[account.id]?.currentBalance ?? 0);
  const month = new Date();
  const monthlyIn = accountTransactions
    .filter(
      (transaction) =>
        transaction.toAccountId === accountId &&
        transaction.occurredAt.getUTCFullYear() === month.getUTCFullYear() &&
        transaction.occurredAt.getUTCMonth() === month.getUTCMonth(),
    )
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const monthlyOut = accountTransactions
    .filter(
      (transaction) =>
        transaction.fromAccountId === accountId &&
        transaction.occurredAt.getUTCFullYear() === month.getUTCFullYear() &&
        transaction.occurredAt.getUTCMonth() === month.getUTCMonth(),
    )
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  return (
    <main className="w-full space-y-5 md:space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] backdrop-blur-sm md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Account detail</p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-slate-900 md:text-3xl">{account.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/accounts"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              ← Back
            </Link>
            <Link
              href={`/transactions?accountId=${account.id}`}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View transactions →
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_30px_rgba(15,23,42,0.03)]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Current balance</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.06em] text-slate-900">
            {account.type === "CREDIT_CARD" ? "Outstanding " : ""}
            {formatInr(currentBalance)}
          </p>
        </article>
        <article className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-[0_18px_30px_rgba(16,185,129,0.06)]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-700">Money in</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.06em] text-emerald-900">{formatInr(monthlyIn)}</p>
        </article>
        <article className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 shadow-[0_18px_30px_rgba(255,151,151,0.06)]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-rose-700">Money out</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.06em] text-rose-900">{formatInr(monthlyOut)}</p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Overview</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{account.name}</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {accountTypeLabels[account.type as keyof typeof accountTypeLabels]}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Account type</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{accountTypeLabels[account.type as keyof typeof accountTypeLabels]}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Currency</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{account.currency}</p>
            </div>
            {account.notes ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{account.notes}</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="rounded-[28px] border border-slate-200 bg-slate-900 p-4 text-white shadow-[0_20px_40px_rgba(15,23,42,0.14)] md:p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Recent activity</p>
          <h2 className="mt-1 text-xl font-bold text-white">{accountTransactions.length} records</h2>
          <div className="mt-4 space-y-2">
            {accountTransactions.slice(0, 6).map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-white">{transaction.notes || transaction.type}</p>
                  <p className={`text-sm font-semibold ${Number(transaction.amount) >= 0 ? "text-emerald-300" : "text-slate-100"}`}>
                    {formatInr(Number(transaction.amount))}
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  {new Date(transaction.occurredAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                </p>
              </div>
            ))}
            {accountTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-3 text-sm text-slate-300">
                No activity yet for this account.
              </div>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
