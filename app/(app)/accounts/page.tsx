import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";

import { createAccountingEngine } from "@/domain/accounting/engine";
import { createAccountAction } from "@/app/(app)/accounts/actions";
import { requireUserSession } from "@/lib/auth/session";
import { formatInr, parseMonthParam } from "@/lib/format";
import { getSingleQueryParam } from "@/lib/web";
import { listAccountsByUser } from "@/server/repositories/account-repo";
import { listTransactionsByUser, listTransactionsInRange } from "@/server/repositories/transaction-repo";
import { toLedgerAccounts, toLedgerTransactions } from "@/server/use-cases/shared";

export const dynamic = "force-dynamic";

interface AccountsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const session = await requireUserSession();
  const params = (await searchParams) ?? {};
  const accountId = getSingleQueryParam(params.accountId);
  const month = parseMonthParam(getSingleQueryParam(params.month));

  const [accounts, allTransactions, accountTransactions] = await Promise.all([
    listAccountsByUser(session.user.id),
    listTransactionsInRange(session.user.id),
    accountId
      ? listTransactionsByUser(session.user.id, {
          accountId,
        })
      : Promise.resolve([]),
  ]);

  const summary = createAccountingEngine(
    toLedgerAccounts(accounts),
    toLedgerTransactions(allTransactions),
  ).calculateAccountBalanceSummary();

  const selectedAccount = accounts.find((account) => account.id === accountId);
  const monthlyIn = accountTransactions
    .filter(
      (transaction) =>
        transaction.toAccountId === accountId &&
        transaction.occurredAt.getUTCFullYear() === month.year &&
        transaction.occurredAt.getUTCMonth() + 1 === month.month,
    )
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const monthlyOut = accountTransactions
    .filter(
      (transaction) =>
        transaction.fromAccountId === accountId &&
        transaction.occurredAt.getUTCFullYear() === month.year &&
        transaction.occurredAt.getUTCMonth() + 1 === month.month,
    )
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  return (
    <main className="w-full space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Accounts</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts
            .filter((account) => account.type !== "CREDIT_CARD")
            .map((account) => (
              <Link
                key={account.id}
                href={`/accounts?accountId=${account.id}`}
                className="rounded-xl border border-blue-200 bg-white p-3 hover:bg-blue-50"
              >
                <p className="text-sm text-muted-foreground">{account.name}</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatInr(summary.balances[account.id]?.currentBalance ?? 0)}
                </p>
              </Link>
            ))}
        </div>

        <h2 className="mt-6 text-lg font-semibold text-rose-800">Credit cards</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts
            .filter((account) => account.type === "CREDIT_CARD")
            .map((account) => (
              <Link
                key={account.id}
                href={`/accounts?accountId=${account.id}`}
                className="rounded-xl border border-rose-200 bg-white p-3 hover:bg-rose-50"
              >
                <p className="text-sm text-muted-foreground">{account.name}</p>
                <p className="mt-1 text-lg font-semibold">
                  Outstanding {formatInr(summary.balances[account.id]?.currentBalance ?? 0)}
                </p>
              </Link>
            ))}
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

      {selectedAccount ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{selectedAccount.name}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-amber-200 bg-white p-3">
              <p className="text-sm text-muted-foreground">Current balance</p>
              <p className="text-lg font-semibold">
                {selectedAccount.type === "CREDIT_CARD" ? "Outstanding " : ""}
                {formatInr(summary.balances[selectedAccount.id]?.currentBalance ?? 0)}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-white p-3">
              <p className="text-sm text-muted-foreground">Money in ({month.year}-{month.month})</p>
              <p className="text-lg font-semibold">{formatInr(monthlyIn)}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-white p-3">
              <p className="text-sm text-muted-foreground">Money out ({month.year}-{month.month})</p>
              <p className="text-lg font-semibold">{formatInr(monthlyOut)}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {accountTransactions.slice(0, 15).map((transaction) => (
              <div key={transaction.id} className="rounded-md border border-amber-200 bg-white p-3 text-sm">
                <p>
                  {new Date(transaction.occurredAt).toLocaleDateString("en-IN", { timeZone: "UTC" })} -{" "}
                  {transaction.type} - {formatInr(Number(transaction.amount))}
                </p>
                <p className="text-muted-foreground">{transaction.notes ?? "-"}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
