"use client";

import { useMemo, useState } from "react";

const transactionTypes = [
  "EXPENSE",
  "INCOME",
  "TRANSFER",
  "CREDIT_CARD_PAYMENT",
  "REFUND",
] as const;

type TransactionType = (typeof transactionTypes)[number];

const typeLabels: Record<TransactionType, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  TRANSFER: "Transfer",
  CREDIT_CARD_PAYMENT: "Card payment",
  REFUND: "Refund",
};

interface AccountOption {
  id: string;
  name: string;
  type: "BANK_ACCOUNT" | "CASH" | "CREDIT_CARD" | "WALLET" | "OTHER";
}

interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
}

interface TransactionFormProps {
  mode: "create" | "edit";
  action: (formData: FormData) => Promise<void>;
  accounts: AccountOption[];
  categories: CategoryOption[];
  transactionId?: string;
  defaultValues: {
    type: string;
    amount: string;
    occurredAt: string;
    fromAccountId: string;
    toAccountId: string;
    categoryId: string;
    merchant: string;
    notes: string;
    refundForTransactionId: string;
  };
}

function asTransactionType(value: string): TransactionType {
  return transactionTypes.includes(value as TransactionType) ? (value as TransactionType) : "EXPENSE";
}

export function TransactionForm({
  mode,
  action,
  accounts,
  categories,
  transactionId,
  defaultValues,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(asTransactionType(defaultValues.type));

  const shouldShowFromAccount = type === "EXPENSE" || type === "TRANSFER" || type === "CREDIT_CARD_PAYMENT";
  const shouldShowToAccount = type === "INCOME" || type === "TRANSFER" || type === "CREDIT_CARD_PAYMENT" || type === "REFUND";
  const shouldShowCategory = type === "EXPENSE" || type === "REFUND";

  const fromAccountOptions = useMemo(() => {
    if (type === "TRANSFER" || type === "CREDIT_CARD_PAYMENT") {
      return accounts.filter((account) => account.type !== "CREDIT_CARD");
    }
    return accounts;
  }, [accounts, type]);

  const toAccountOptions = useMemo(() => {
    if (type === "CREDIT_CARD_PAYMENT") {
      return accounts.filter((account) => account.type === "CREDIT_CARD");
    }
    if (type === "TRANSFER") {
      return accounts.filter((account) => account.type !== "CREDIT_CARD");
    }
    if (type === "INCOME") {
      return accounts.filter((account) => account.type !== "CREDIT_CARD");
    }
    return accounts;
  }, [accounts, type]);

  return (
    <form action={action} className="mt-3 grid gap-3 md:grid-cols-3">
      {transactionId ? <input type="hidden" name="transactionId" value={transactionId} /> : null}
      <input type="hidden" name="type" value={type} />

      <fieldset className="grid gap-2 text-sm md:col-span-3">
        <legend className="font-medium text-slate-700">Type</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {transactionTypes.map((txnType) => {
            const active = type === txnType;
            return (
              <button
                key={txnType}
                type="button"
                onClick={() => setType(txnType)}
                aria-pressed={active}
                className={`h-11 rounded-xl border px-2 text-xs font-semibold tracking-[0.12em] uppercase transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {typeLabels[txnType]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Amount ₹</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          autoFocus={mode === "create"}
          defaultValue={defaultValues.amount}
          className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
          placeholder="0.00"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Date</span>
        <input
          name="occurredAt"
          type="date"
          required
          defaultValue={defaultValues.occurredAt}
          className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
        />
      </label>

      {shouldShowFromAccount ? (
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">{type === "EXPENSE" ? "Account" : "From account"}</span>
          <select
            name="fromAccountId"
            defaultValue={defaultValues.fromAccountId}
            required
            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="">Select account</option>
            {fromAccountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {shouldShowToAccount ? (
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">
            {type === "INCOME" ? "Account" : type === "REFUND" ? "Refund to account" : "To account"}
          </span>
          <select
            name="toAccountId"
            defaultValue={defaultValues.toAccountId}
            required
            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="">Select account</option>
            {toAccountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {shouldShowCategory ? (
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Category</span>
          <select
            name="categoryId"
            defaultValue={defaultValues.categoryId}
            required
            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <details className="md:col-span-3">
        <summary className="cursor-pointer list-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          More options
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Merchant</span>
            <input
              name="merchant"
              defaultValue={defaultValues.merchant}
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Optional"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Notes</span>
            <input
              name="notes"
              defaultValue={defaultValues.notes}
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Optional"
            />
          </label>
          {type === "REFUND" ? (
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Refund for transaction</span>
              <input
                name="refundForTransactionId"
                defaultValue={defaultValues.refundForTransactionId}
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Optional transaction ID"
              />
            </label>
          ) : (
            <input type="hidden" name="refundForTransactionId" value={defaultValues.refundForTransactionId} />
          )}
        </div>
      </details>

      <div className="md:col-span-3">
        <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 md:w-auto">
          {mode === "create" ? "Save transaction" : "Update transaction"}
        </button>
      </div>
    </form>
  );
}
