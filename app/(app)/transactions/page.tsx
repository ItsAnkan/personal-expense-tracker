import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import SearchIcon from "@mui/icons-material/Search";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import Link from "next/link";

import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from "@/app/(app)/transactions/actions";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { CategoryChip } from "@/components/ui/category-chip";
import { TransactionTypeBadge } from "@/components/ui/transaction-type-badge";
import { requireUserSession } from "@/lib/auth/session";
import { formatInr, formatMonthLabel, monthBounds, monthToParam, parseMonthParam, shiftMonth } from "@/lib/format";
import { getSingleQueryParam } from "@/lib/web";
import { listAccountsByUser } from "@/server/repositories/account-repo";
import { listCategoriesByUser } from "@/server/repositories/category-repo";
import { listTransactionsByUser } from "@/server/repositories/transaction-repo";

export const dynamic = "force-dynamic";

interface TransactionsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const transactionTypes = [
  "EXPENSE",
  "INCOME",
  "TRANSFER",
  "CREDIT_CARD_PAYMENT",
  "REFUND",
] as const;

type TransactionType = (typeof transactionTypes)[number];

const typeLabelMap: Record<TransactionType, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  TRANSFER: "Transfer",
  CREDIT_CARD_PAYMENT: "Credit card payment",
  REFUND: "Refund",
};

type SortMode = "newest" | "oldest" | "highest" | "lowest";
type DatePreset = "this-month" | "today" | "this-week";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dateInputValue(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

function categoryLabel(
  categoryId: string | null,
  categoryMap: Map<string, { name: string; parentId: string | null }>,
): string {
  if (!categoryId) {
    return "-";
  }
  const category = categoryMap.get(categoryId);
  if (!category) {
    return categoryId;
  }
  if (!category.parentId) {
    return category.name;
  }
  const parent = categoryMap.get(category.parentId);
  return parent ? `${parent.name} / ${category.name}` : category.name;
}

function dayHeading(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (target.getTime() === today.getTime()) {
    return "Today";
  }
  if (target.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function toDayKey(value: Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

function getTransactionSign(type: string): "+" | "-" | "neutral" {
  if (type === "INCOME" || type === "REFUND") {
    return "+";
  }
  if (type === "EXPENSE") {
    return "-";
  }
  return "neutral";
}

const transactionIconMap = {
  INCOME: NorthEastIcon,
  EXPENSE: SouthEastIcon,
  TRANSFER: SwapHorizIcon,
  CREDIT_CARD_PAYMENT: SyncAltIcon,
  REFUND: RotateLeftIcon,
} as const;

function transactionIcon(type: string) {
  return transactionIconMap[type as keyof typeof transactionIconMap] ?? RotateLeftIcon;
}

function typeTone(type: string): string {
  if (type === "INCOME") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (type === "EXPENSE") {
    return "bg-rose-100 text-rose-700";
  }
  if (type === "TRANSFER") {
    return "bg-slate-200 text-slate-700";
  }
  if (type === "CREDIT_CARD_PAYMENT") {
    return "bg-sky-100 text-sky-700";
  }
  return "bg-violet-100 text-violet-700";
}

function asSortMode(value: string | undefined): SortMode {
  if (value === "oldest" || value === "highest" || value === "lowest") {
    return value;
  }
  return "newest";
}

function asDatePreset(value: string | undefined): DatePreset {
  if (value === "today" || value === "this-week") {
    return value;
  }
  return "this-month";
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const session = await requireUserSession();
  const params = (await searchParams) ?? {};

  const month = parseMonthParam(getSingleQueryParam(params.month));
  const q = getSingleQueryParam(params.q);
  const categoryId = getSingleQueryParam(params.categoryId);
  const accountId = getSingleQueryParam(params.accountId);
  const type = getSingleQueryParam(params.type);
  const sort = asSortMode(getSingleQueryParam(params.sort));
  const datePreset = asDatePreset(getSingleQueryParam(params.datePreset));
  const editId = getSingleQueryParam(params.editId);
  const openAdd = getSingleQueryParam(params.openAdd) === "1";
  const confirmDeleteId = getSingleQueryParam(params.confirmDeleteId);
  const minAmountRaw = getSingleQueryParam(params.minAmount);
  const maxAmountRaw = getSingleQueryParam(params.maxAmount);

  const monthParam = monthToParam(month);
  const previousMonth = monthToParam(shiftMonth(month, -1));
  const nextMonth = monthToParam(shiftMonth(month, 1));
  const monthLabel = formatMonthLabel(month);

  const sortBy = sort === "highest" || sort === "lowest" ? "amount" : "occurredAt";
  const sortDirection = sort === "oldest" || sort === "lowest" ? "asc" : "desc";
  const { start: monthStart, end: monthEnd } = monthBounds(month);
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
  const mondayOffset = (todayStart.getUTCDay() + 6) % 7;
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const rangeStart = datePreset === "today" ? todayStart : datePreset === "this-week" ? weekStart : monthStart;
  const rangeEnd = datePreset === "today" ? todayEnd : datePreset === "this-week" ? weekEnd : monthEnd;

  const minAmount = minAmountRaw ? Number(minAmountRaw) : undefined;
  const maxAmount = maxAmountRaw ? Number(maxAmountRaw) : undefined;

  const [accounts, categories, transactions] = await Promise.all([
    listAccountsByUser(session.user.id),
    listCategoriesByUser(session.user.id),
    listTransactionsByUser(session.user.id, {
      monthStart: rangeStart,
      monthEnd: rangeEnd,
      categoryId: categoryId || undefined,
      accountId: accountId || undefined,
      type:
        type && transactionTypes.includes(type as TransactionType)
          ? (type as TransactionType)
          : undefined,
      query: q || undefined,
      sortBy,
      sortDirection,
      minAmount: Number.isFinite(minAmount) ? minAmount : undefined,
      maxAmount: Number.isFinite(maxAmount) ? maxAmount : undefined,
    }),
  ]);

  const categoryMap = new Map(
    categories.map((category) => [
      category.id,
      { name: category.name, parentId: category.parentId },
    ]),
  );

  const accountMap = new Map(accounts.map((account) => [account.id, account.name]));
  const transactionFormAccounts = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
  }));

  const filteredType = type && transactionTypes.includes(type as TransactionType) ? (type as TransactionType) : undefined;
  const currentFilterParams: Record<string, string | undefined> = {
    month: monthParam,
    datePreset,
    q: q || undefined,
    type: filteredType,
    accountId: accountId || undefined,
    categoryId: categoryId || undefined,
    sort,
    minAmount: minAmountRaw || undefined,
    maxAmount: maxAmountRaw || undefined,
  };

  const withParams = (overrides: Record<string, string | null | undefined>) => {
    const merged: Record<string, string | undefined> = { ...currentFilterParams };
    for (const [key, value] of Object.entries(overrides)) {
      if (!value) {
        delete merged[key];
      } else {
        merged[key] = value;
      }
    }
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value && value.length > 0) {
        qs.set(key, value);
      }
    }
    return `/transactions?${qs.toString()}`;
  };

  const withViewState = (overrides: Record<string, string | null | undefined>) =>
    withParams({
      editId: editId || undefined,
      openAdd: openAdd ? "1" : undefined,
      confirmDeleteId: confirmDeleteId || undefined,
      ...overrides,
    });

  const activeFilters: Array<{ key: string; label: string; href: string }> = [];
  if (datePreset !== "this-month") {
    activeFilters.push({
      key: "datePreset",
      label: datePreset === "today" ? "Today" : "This week",
      href: withParams({ datePreset: "this-month" }),
    });
  }
  if (filteredType) {
    activeFilters.push({
      key: "type",
      label: typeLabelMap[filteredType],
      href: withParams({ type: null }),
    });
  }
  if (accountId) {
    activeFilters.push({
      key: "accountId",
      label: accountMap.get(accountId) ?? "Account",
      href: withParams({ accountId: null }),
    });
  }
  if (categoryId) {
    activeFilters.push({
      key: "categoryId",
      label: categoryLabel(categoryId, categoryMap),
      href: withParams({ categoryId: null }),
    });
  }
  if (q?.trim()) {
    activeFilters.push({
      key: "q",
      label: `Search: ${q.trim()}`,
      href: withParams({ q: null }),
    });
  }
  if (minAmountRaw && Number.isFinite(Number(minAmountRaw))) {
    activeFilters.push({
      key: "minAmount",
      label: `Min ${formatInr(Number(minAmountRaw))}`,
      href: withParams({ minAmount: null }),
    });
  }
  if (maxAmountRaw && Number.isFinite(Number(maxAmountRaw))) {
    activeFilters.push({
      key: "maxAmount",
      label: `Max ${formatInr(Number(maxAmountRaw))}`,
      href: withParams({ maxAmount: null }),
    });
  }

  const allowDateGrouping = sortBy === "occurredAt";
  type TransactionRecord = (typeof transactions)[number];
  const groupedTransactions = allowDateGrouping
    ? transactions.reduce<Array<{ day: string; items: TransactionRecord[] }>>((groups, transaction) => {
        const key = toDayKey(transaction.occurredAt);
        const lastGroup = groups[groups.length - 1];
        if (!lastGroup || lastGroup.day !== key) {
          groups.push({ day: key, items: [transaction] });
        } else {
          lastGroup.items.push(transaction);
        }
        return groups;
      }, [])
    : [{ day: "all", items: transactions }];

  const spent = transactions
    .filter((item) => item.type === "EXPENSE" || item.type === "REFUND")
    .reduce((sum, item) => sum + (item.type === "EXPENSE" ? Number(item.amount) : -Number(item.amount)), 0);
  const income = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const dateSummaryLabel =
    datePreset === "today"
      ? "Today"
      : datePreset === "this-week"
        ? "This week"
        : monthLabel;

  return (
    <main id="main-content" className="w-full space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(130deg,#0f172a_0%,#1f3a4f_55%,#3d6673_100%)] p-4 text-white shadow-[0_22px_48px_rgba(15,23,42,0.2)] md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Transactions</p>
            <h1 className="mt-1 text-3xl font-bold text-white md:text-4xl">All financial activity</h1>
            <p className="mt-2 text-sm text-slate-200">
              {dateSummaryLabel} Â· {transactions.length} records Â· {formatInr(spent)} spent Â· {formatInr(income)} income
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Link
              href={withViewState({ openAdd: "1", editId: null, confirmDeleteId: null })}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 md:flex-none"
            >
              + Add transaction
            </Link>
          </div>
        </div>

        <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          <Link href={withParams({ datePreset: "this-month", month: monthParam })} className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-medium text-slate-100 transition hover:bg-white/20 lg:shrink">
            This month
          </Link>
          <Link href={withParams({ datePreset: "today" })} className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-medium text-slate-100 transition hover:bg-white/20 lg:shrink">
            Today
          </Link>
          <Link href={withParams({ datePreset: "this-week" })} className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-medium text-slate-100 transition hover:bg-white/20 lg:shrink">
            This week
          </Link>
          <Link href={withParams({ datePreset: "this-month", month: previousMonth })} className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-medium text-slate-100 transition hover:bg-white/20 lg:shrink">
            Last month
          </Link>
          <Link href={withParams({ type: "EXPENSE" })} className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-medium text-slate-100 transition hover:bg-white/20 lg:shrink">
            Expenses
          </Link>
          <Link href={withParams({ type: "INCOME" })} className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-medium text-slate-100 transition hover:bg-white/20 lg:shrink">
            Income
          </Link>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={withParams({ month: previousMonth, datePreset: "this-month" })}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              aria-label="Previous month"
            >
              <ArrowBackIcon className="h-4 w-4" />
            </Link>
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
              {monthLabel}
            </span>
            <Link
              href={withParams({ month: nextMonth, datePreset: "this-month" })}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              aria-label="Next month"
            >
              <ArrowForwardIcon className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-sm text-slate-500">Find, review, and correct entries in seconds.</p>
        </div>

        <form className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
          <input type="hidden" name="month" value={monthParam} />
          <input type="hidden" name="datePreset" value={datePreset} />
          <label className="relative col-span-2 block">
            <span className="sr-only">Search transactions</span>
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
              <SearchIcon className="h-4 w-4" />
            </span>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search merchant, notes, category, account"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          <select name="type" defaultValue={type ?? ""} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white">
            <option value="">All types</option>
            {transactionTypes.map((txnType) => (
              <option key={txnType} value={txnType}>
                {typeLabelMap[txnType]}
              </option>
            ))}
          </select>

          <select name="accountId" defaultValue={accountId ?? ""} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white">
            <option value="">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <select name="categoryId" defaultValue={categoryId ?? ""} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {categoryLabel(category.id, categoryMap)}
              </option>
            ))}
          </select>

          <select name="sort" defaultValue={sort} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </select>

          <button className="col-span-2 h-12 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 lg:col-span-1">
            Apply
          </button>

          <details className="lg:col-span-6">
            <summary className="mt-1 cursor-pointer list-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              Advanced filters
            </summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Min amount</span>
                <input
                  name="minAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={minAmountRaw ?? ""}
                  placeholder="0"
                  className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Max amount</span>
                <input
                  name="maxAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={maxAmountRaw ?? ""}
                  placeholder="No limit"
                  className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
            </div>
          </details>
        </form>

        {activeFilters.length > 0 ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Active filters</p>
              <Link href={withParams({ q: null, type: null, accountId: null, categoryId: null, datePreset: "this-month", minAmount: null, maxAmount: null })} className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Clear all
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Link key={filter.key} href={filter.href} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100">
                  <span>{filter.label}</span>
                  <span aria-hidden>Ã—</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {openAdd ? (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50/60 p-4 shadow-[0_14px_30px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-emerald-700 uppercase">Quick add</p>
              <h2 className="text-xl font-bold text-emerald-950">Add transaction</h2>
            </div>
            <Link href={withParams({ openAdd: null })} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800">
              Close
            </Link>
          </div>
          <TransactionForm
            mode="create"
            action={createTransactionAction}
            accounts={transactionFormAccounts}
            categories={categories}
            defaultValues={{
              type: "EXPENSE",
              amount: "",
              occurredAt: dateInputValue(new Date()),
              fromAccountId: accounts.find((account) => account.type !== "CREDIT_CARD")?.id ?? "",
              toAccountId: "",
              categoryId: categories[0]?.id ?? "",
              merchant: "",
              notes: "",
              refundForTransactionId: "",
            }}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        {transactions.length === 0 ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
            <p className="text-lg font-semibold text-slate-900">No transactions found</p>
            <p className="mt-1 text-sm text-slate-600">Try changing your search or filters.</p>
            <div className="mt-4 flex justify-center">
              <Link
                href={withParams({ q: null, type: null, accountId: null, categoryId: null, datePreset: "this-month", minAmount: null, maxAmount: null })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Clear filters
              </Link>
            </div>
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <section key={group.day} className="space-y-2">
              {allowDateGrouping ? (
                <div className="flex items-center justify-between px-1 pt-1">
                  <h2 className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">{dayHeading(group.day)}</h2>
                  <span className="text-xs text-slate-400">{group.items.length} item{group.items.length > 1 ? "s" : ""}</span>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                <div className="hidden grid-cols-[7rem_1.9fr_1fr_1fr_8rem_9rem] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase md:grid">
                  <span>Date</span>
                  <span>Transaction</span>
                  <span>Category</span>
                  <span>Account</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Actions</span>
                </div>

                {group.items.map((transaction) => {
                  const isEditing = editId === transaction.id;
                  const categoryName = categoryLabel(transaction.categoryId, categoryMap);
                  const sign = getTransactionSign(transaction.type);
                  const amount = Number(transaction.amount);
                  const amountLabel = sign === "neutral" ? formatInr(amount) : `${sign}${formatInr(amount)}`;
                  const accountLabel =
                    transaction.type === "TRANSFER" || transaction.type === "CREDIT_CARD_PAYMENT"
                      ? `${transaction.fromAccount?.name ?? "-"} â†’ ${transaction.toAccount?.name ?? "-"}`
                      : transaction.type === "INCOME" || transaction.type === "REFUND"
                        ? transaction.toAccount?.name ?? "-"
                        : transaction.fromAccount?.name ?? "-";

                  if (isEditing) {
                    return (
                      <article key={transaction.id} className={`border-t border-slate-200 px-4 py-3 first:border-t-0 ${isViewing ? "bg-slate-50/70" : ""}`}>
                        <div className="hidden grid-cols-[7rem_1.9fr_1fr_1fr_8rem_8rem] items-center gap-3 md:grid">
                          <p className="text-sm text-slate-600">{formatDate(transaction.occurredAt)}</p>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${typeTone(transaction.type)}`}>
                                {(() => {
                                  const Icon = transactionIcon(transaction.type);
                                  return <Icon className="h-4 w-4" />;
                                })()}
                              </span>
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {transaction.merchant ?? (transaction.type === "TRANSFER" ? "Account transfer" : typeLabelMap[transaction.type as TransactionType])}
                              </p>
                      <article key={transaction.id} className="border-t border-slate-200 p-4 first:border-t-0">
                        <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Editing transaction</p>
                        <TransactionForm
                          mode="edit"
                          action={updateTransactionAction}
                          accounts={transactionFormAccounts}
                          categories={categories}
                          transactionId={transaction.id}
                          defaultValues={{
                            type: transaction.type,
                            amount: Number(transaction.amount).toFixed(2),
                            occurredAt: dateInputValue(transaction.occurredAt),
                            fromAccountId: transaction.fromAccountId ?? "",
                            toAccountId: transaction.toAccountId ?? "",
                            categoryId: transaction.categoryId ?? "",
                            merchant: transaction.merchant ?? "",
                            notes: transaction.notes ?? "",
                            refundForTransactionId: transaction.refundForTransactionId ?? "",
                          }}
                        />
                        <div className="mt-3">
                          <Link href={withViewState({ editId: null, confirmDeleteId: null })} className="text-sm font-medium text-slate-700 hover:text-slate-900">
                            Cancel edit
                          </Link>
                        </div>
                      </article>
                    );
                  }

                  return (
                    <article key={transaction.id} className={`border-t border-slate-200 px-4 py-3 first:border-t-0 ${confirmDeleteId === transaction.id ? "bg-rose-50/40" : ""}`}>
                      <details className="group hidden md:block">
                        <summary className="list-none cursor-pointer">
                          <div className="grid grid-cols-[7rem_1.9fr_1fr_1fr_8rem_9rem] items-center gap-3">
                            <p className="text-sm text-slate-600">{formatDate(transaction.occurredAt)}</p>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${typeTone(transaction.type)}`}>
                                  {transactionIcon(transaction.type)}
                                </span>
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {transaction.merchant ?? (transaction.type === "TRANSFER" ? "Account transfer" : typeLabelMap[transaction.type as TransactionType])}
                                </p>
                              </div>
                            </div>
                            <div className="min-w-0">
                              {categoryName === "-" ? (
                                <span className="text-sm text-slate-400">â€”</span>
                              ) : (
                                <CategoryChip name={categoryName} className="max-w-full truncate" />
                              )}
                            </div>
                            <p className="truncate text-sm text-slate-600">{accountLabel}</p>
                            <p className={`text-right text-sm font-semibold ${sign === "+" ? "text-emerald-700" : sign === "-" ? "text-slate-900" : "text-slate-700"}`}>
                              {amountLabel}
                            </p>
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                aria-label="Edit transaction"
                                href={withViewState({ editId: transaction.id, openAdd: null, confirmDeleteId: null })}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-700"
                              >
                                âœŽ
                              </Link>
                              <Link
                                aria-label="Delete transaction"
                                href={withViewState({ editId: null, confirmDeleteId: transaction.id })}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700"
                              >
                                ðŸ—‘
                              </Link>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-2 border-t border-slate-200 pt-2">
                          <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2">
                            {transaction.merchant ? (
                              <p>
                                <span className="font-medium text-slate-800">Merchant:</span> {transaction.merchant}
                              </p>
                            ) : null}
                            <p>
                              <span className="font-medium text-slate-800">Type:</span> {typeLabelMap[transaction.type as TransactionType]}
                            </p>
                            <p>
                              <span className="font-medium text-slate-800">Category:</span> {categoryName === "-" ? "Not set" : categoryName}
                            </p>
                            <p>
                              <span className="font-medium text-slate-800">Account:</span> {accountLabel}
                            </p>
                            <p className="sm:col-span-2">
                              <span className="font-medium text-slate-800">Notes:</span> {transaction.notes ?? "No notes"}
                            </p>
                          </div>

                        <div className="md:hidden">
                          <details className="group rounded-xl">
                            <summary className="list-none rounded-xl p-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${typeTone(transaction.type)}`}>
                                      {(() => {
                                        const Icon = transactionIcon(transaction.type);
                                        return <Icon className="h-4 w-4" />;
                                      })()}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-slate-900">
                                        {transaction.merchant ?? (transaction.type === "TRANSFER" ? "Account transfer" : typeLabelMap[transaction.type as TransactionType])}
                                      </p>
                                      <p className="truncate text-xs text-slate-500">{categoryName === "-" ? typeLabelMap[transaction.type as TransactionType] : categoryName}</p>
                                    </div>
                                  </div>
                                  <p className="mt-1 truncate text-xs text-slate-500">{accountLabel}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-semibold ${sign === "+" ? "text-emerald-700" : sign === "-" ? "text-slate-900" : "text-slate-700"}`}>
                                    {amountLabel}
                          {confirmDeleteId === transaction.id ? (
                            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                              <p className="text-sm font-semibold text-rose-900">Delete this transaction?</p>
                              <p className="mt-1 text-xs text-rose-800">This updates account balances and monthly reports.</p>
                              <div className="mt-3 flex gap-2">
                                <Link
                                  href={withViewState({ confirmDeleteId: null })}
                                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700"
                                >
                                  Cancel
                                </Link>
                                <form action={deleteTransactionAction}>
                                  <input type="hidden" name="transactionId" value={transaction.id} />
                                  <button className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </details>

                      <details className="group md:hidden">
                        <summary className="list-none cursor-pointer rounded-xl border border-slate-200 bg-slate-50/40 p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${typeTone(transaction.type)}`}>
                                  {transactionIcon(transaction.type)}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {transaction.merchant ?? (transaction.type === "TRANSFER" ? "Account transfer" : typeLabelMap[transaction.type as TransactionType])}
                                  </p>
                                  <p className="truncate text-xs text-slate-500">{categoryName === "-" ? typeLabelMap[transaction.type as TransactionType] : categoryName}</p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <TransactionTypeBadge type={transaction.type} />
                                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Details</span>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <p className={`text-sm font-semibold ${sign === "+" ? "text-emerald-700" : sign === "-" ? "text-slate-900" : "text-slate-700"}`}>
                                {amountLabel}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <Link
                                  aria-label="Edit transaction"
                                  href={withViewState({ editId: transaction.id, openAdd: null, confirmDeleteId: null })}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-700"
                                >
                                  âœŽ
                                </Link>
                                <Link
                                  aria-label="Delete transaction"
                                  href={withViewState({ editId: null, confirmDeleteId: transaction.id })}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700"
                                >
                                  ðŸ—‘
                                </Link>
                              </div>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
                          <div className="space-y-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            <p>
                              <span className="font-medium text-slate-800">Date:</span> {formatDate(transaction.occurredAt)}
                            </p>
                            {transaction.merchant ? (
                              <p>
                                <span className="font-medium text-slate-800">Merchant:</span> {transaction.merchant}
                              </p>
                            ) : null}
                            <p>
                              <span className="font-medium text-slate-800">Category:</span> {categoryName === "-" ? "Not set" : categoryName}
                            </p>
                            <p>
                              <span className="font-medium text-slate-800">Account:</span> {accountLabel}
                            </p>
                            <p>
                              <span className="font-medium text-slate-800">Notes:</span> {transaction.notes ?? "No notes"}
                            </p>
                          </div>

                          {confirmDeleteId === transaction.id ? (
                            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                              <p className="text-sm font-semibold text-rose-900">Delete this transaction?</p>
                              <p className="mt-1 text-xs text-rose-800">This updates account balances and monthly reports.</p>
                              <div className="mt-3 flex gap-2">
                                <Link
                                  href={withViewState({ confirmDeleteId: null })}
                                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700"
                                >
                                  Cancel
                                </Link>
                                <form action={deleteTransactionAction}>
                                  <input type="hidden" name="transactionId" value={transaction.id} />
                                  <button className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </details>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </section>
    </main>
  );
}

