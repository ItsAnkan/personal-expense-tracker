import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";

import { createAccountingEngine } from "@/domain/accounting/engine";
import { createAccountAction } from "@/app/(app)/accounts/actions";
import { requireUserSession } from "@/lib/auth/session";
import { formatInr } from "@/lib/format";
import { listAccountsByUser } from "@/server/repositories/account-repo";
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

function accountTone(type: string) {
  if (type === "CREDIT_CARD") {
    return "border-rose-200 bg-rose-50/80 text-rose-900";
  }
  if (type === "CASH") {
    return "border-amber-200 bg-amber-50/80 text-amber-900";
  }
  if (type === "WALLET") {
    return "border-violet-200 bg-violet-50/80 text-violet-900";
  }
  return "border-slate-200 bg-slate-50/80 text-slate-800";
}

export default async function AccountsPage() {
  const session = await requireUserSession();

  const [accounts, allTransactions] = await Promise.all([
    listAccountsByUser(session.user.id),
    listTransactionsInRange(session.user.id),
  ]);

  const summary = createAccountingEngine(
    toLedgerAccounts(accounts),
    toLedgerTransactions(allTransactions),
  ).calculateAccountBalanceSummary();

  const assetAccounts = accounts.filter((account) => account.type !== "CREDIT_CARD");
  const creditAccounts = accounts.filter((account) => account.type === "CREDIT_CARD");

  const totalAssets = assetAccounts.reduce(
    (sum, account) => sum + Number(summary.balances[account.id]?.currentBalance ?? 0),
    0,
  );
  const totalLiabilities = creditAccounts.reduce(
    (sum, account) => sum + Number(summary.balances[account.id]?.currentBalance ?? 0),
    0,
  );
  const netPosition = totalAssets - totalLiabilities;

  return (
    <main className="w-full space-y-5 md:space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] backdrop-blur-sm md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Accounts</p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-slate-900 md:text-3xl">Your money, all in one place</h1>
          </div>
          <a
            href="#add-account"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Add account
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Create account</h2>
        <form action={createAccountAction} className="mt-3 grid gap-2 md:grid-cols-3">
          <input
            name="name"
            placeholder="HDFC Savings"
            required
            className="h-10 rounded-md border border-emerald-200 bg-white px-3"
          />
          <select name="type" defaultValue="BANK_ACCOUNT" className="h-10 rounded-md border border-emerald-200 bg-white px-3">
            <option value="BANK_ACCOUNT">Bank Account</option>
            <option value="CASH">Cash</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="WALLET">Wallet</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            name="openingBalance"
            type="number"
            step="0.01"
            defaultValue="0"
            className="h-10 rounded-md border border-emerald-200 bg-white px-3"
          />
          <input name="currency" defaultValue="INR" className="h-10 rounded-md border border-emerald-200 bg-white px-3" />
          <input
            name="notes"
            placeholder="Optional notes"
            className="h-10 rounded-md border border-emerald-200 bg-white px-3 md:col-span-2"
          />
          <button className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 md:col-span-3">
            <AddIcon className="h-4 w-4" />
            <span>Add account</span>
          </button>
        </form>
      </section>
      <section className="grid grid-cols-3 gap-3">
        <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_30px_rgba(15,23,42,0.03)]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Total assets</p>
          <p className="mt-2 truncate text-sm font-bold tracking-tight text-slate-900 sm:text-xl">{formatInr(totalAssets)}</p>
        </article>
        <article className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 shadow-[0_18px_30px_rgba(255,151,151,0.06)]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-rose-700">Credit card liabilities</p>
          <p className="mt-2 truncate text-sm font-bold tracking-tight text-rose-900 sm:text-xl">{formatInr(totalLiabilities)}</p>
        </article>
        <article className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-[0_18px_30px_rgba(16,185,129,0.06)]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-700">Net position</p>
          <p className="mt-2 truncate text-sm font-bold tracking-tight text-emerald-900 sm:text-xl">{formatInr(netPosition)}</p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Cash & bank</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Accounts</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {assetAccounts.length} active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {assetAccounts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No bank or cash accounts yet.
                </div>
              ) : (
                assetAccounts.map((account) => (
                  <Link
                    key={account.id}
                    href={`/accounts/${account.id}`}
                    className={`flex items-center justify-between gap-3 rounded-[22px] border p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm ${accountTone(account.type)}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-sm font-semibold shadow-sm">
                          {account.type === "CREDIT_CARD" ? "C" : account.type === "CASH" ? "â‚¹" : account.type === "WALLET" ? "W" : "A"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-900">{account.name}</p>
                          <p className="text-xs text-slate-500">{accountTypeLabels[account.type as keyof typeof accountTypeLabels]}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-900">{formatInr(Number(summary.balances[account.id]?.currentBalance ?? 0))}</p>
                      <p className="text-[11px] text-slate-500">{account.notes ? account.notes : "Ready"}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {creditAccounts.length > 0 ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Liabilities</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Credit cards</h2>
                </div>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                  {creditAccounts.length} cards
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {creditAccounts.map((account) => (
                  <Link
                    key={account.id}
                    href={`/accounts/${account.id}`}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-rose-200 bg-rose-50/80 p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-sm font-semibold text-rose-700 shadow-sm">
                        C
                      </span>
                      <div>
                        <p className="text-base font-semibold text-slate-900">{account.name}</p>
                        <p className="text-xs text-rose-700">Outstanding</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-rose-900">{formatInr(Number(summary.balances[account.id]?.currentBalance ?? 0))}</p>
                      <p className="text-[11px] text-rose-700">Due</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-slate-900 p-4 text-white shadow-[0_20px_40px_rgba(15,23,42,0.14)] md:p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Quick read</p>
            <h2 className="mt-1 text-xl font-bold text-white">Financial picture</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-300">Assets</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatInr(totalAssets)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-300">Liabilities</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatInr(totalLiabilities)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3">
                <p className="text-emerald-200">Net position</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatInr(netPosition)}</p>
              </div>
            </div>
          </section>

          <section id="add-account" className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Add account</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">New account</h2>
            <form action={createAccountAction} className="mt-4 space-y-3">
              <input
                name="name"
                aria-label="Account name"
                placeholder="HDFC Savings"
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
              <select
                name="type"
                defaultValue="BANK_ACCOUNT"
                aria-label="Account type"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="BANK_ACCOUNT">Bank account</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit card</option>
                <option value="WALLET">Wallet</option>
                <option value="OTHER">Other</option>
              </select>
              <input
                name="openingBalance"
                type="number"
                step="0.01"
                defaultValue="0"
                aria-label="Opening balance"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
              <input
                name="currency"
                defaultValue="INR"
                aria-label="Currency"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
              <textarea
                name="notes"
                aria-label="Account notes"
                placeholder="Optional notes"
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
              <button className="h-12 w-full rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                Save account
              </button>
            </form>
          </section>
        </aside>
      </section>
    </main>
  );
}


