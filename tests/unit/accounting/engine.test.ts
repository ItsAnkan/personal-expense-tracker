import test from "node:test";
import assert from "node:assert/strict";

import { createAccountingEngine } from "@/domain/accounting/engine";
import type { LedgerAccount, LedgerTransaction, MonthRef } from "@/domain/accounting/types";

const userId = "user-1";
const accounts: LedgerAccount[] = [
  {
    id: "hdfc-savings",
    userId,
    name: "HDFC Savings",
    type: "BANK_ACCOUNT",
    openingBalance: 50000,
    currency: "INR",
    isActive: true,
  },
  {
    id: "icici-savings",
    userId,
    name: "ICICI Savings",
    type: "BANK_ACCOUNT",
    openingBalance: 10000,
    currency: "INR",
    isActive: true,
  },
  {
    id: "hdfc-credit-card",
    userId,
    name: "HDFC Credit Card",
    type: "CREDIT_CARD",
    openingBalance: 0,
    currency: "INR",
    isActive: true,
  },
];

function month(year: number, monthValue: number): MonthRef {
  return { year, month: monthValue };
}

function tx(overrides: Partial<LedgerTransaction>): LedgerTransaction {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    userId,
    type: "EXPENSE",
    amount: 1,
    occurredAt: new Date("2026-08-15T00:00:00.000Z"),
    fromAccountId: null,
    toAccountId: null,
    categoryId: "cat-other",
    status: "POSTED",
    ...overrides,
  };
}

test("Normal expense decreases account balance and increases monthly spending", () => {
  const transactions = [
    tx({
      id: "expense-1",
      type: "EXPENSE",
      amount: 500,
      fromAccountId: "hdfc-savings",
      categoryId: "cat-food",
    }),
  ];
  const engine = createAccountingEngine(accounts, transactions);

  const summary = engine.calculateAccountBalanceSummary();
  const spending = engine.calculateMonthlyExpenses(month(2026, 8));

  assert.equal(summary.balances["hdfc-savings"].currentBalance, 49500);
  assert.equal(spending, 500);
});

test("Income increases account balance and monthly income", () => {
  const transactions = [
    tx({
      id: "income-1",
      type: "INCOME",
      amount: 85000,
      toAccountId: "hdfc-savings",
      fromAccountId: null,
      categoryId: "cat-salary",
    }),
  ];
  const engine = createAccountingEngine(accounts, transactions);
  const summary = engine.calculateAccountBalanceSummary();
  const income = engine.calculateMonthlyIncome(month(2026, 8));

  assert.equal(summary.balances["hdfc-savings"].currentBalance, 135000);
  assert.equal(income, 85000);
});

test("Transfer moves money without affecting monthly expenses", () => {
  const transactions = [
    tx({
      id: "transfer-1",
      type: "TRANSFER",
      amount: 10000,
      fromAccountId: "hdfc-savings",
      toAccountId: "icici-savings",
      categoryId: null,
    }),
  ];
  const engine = createAccountingEngine(accounts, transactions);
  const summary = engine.calculateAccountBalanceSummary();

  assert.equal(summary.balances["hdfc-savings"].currentBalance, 40000);
  assert.equal(summary.balances["icici-savings"].currentBalance, 20000);
  assert.equal(engine.calculateMonthlyExpenses(month(2026, 8)), 0);
});

test("Credit-card purchase increases outstanding and spending without reducing bank balance", () => {
  const transactions = [
    tx({
      id: "cc-expense-1",
      type: "EXPENSE",
      amount: 2000,
      fromAccountId: "hdfc-credit-card",
      categoryId: "cat-food",
    }),
  ];
  const engine = createAccountingEngine(accounts, transactions);
  const summary = engine.calculateAccountBalanceSummary();

  assert.equal(summary.balances["hdfc-savings"].currentBalance, 50000);
  assert.equal(summary.balances["hdfc-credit-card"].currentBalance, 2000);
  assert.equal(summary.totalCreditCardOutstanding, 2000);
  assert.equal(engine.calculateMonthlyExpenses(month(2026, 8)), 2000);
});

test("Credit-card payment reduces outstanding and bank balance without increasing spending", () => {
  const transactions = [
    tx({
      id: "cc-expense-1",
      type: "EXPENSE",
      amount: 2000,
      fromAccountId: "hdfc-credit-card",
      categoryId: "cat-food",
    }),
    tx({
      id: "cc-payment-1",
      type: "CREDIT_CARD_PAYMENT",
      amount: 2000,
      fromAccountId: "hdfc-savings",
      toAccountId: "hdfc-credit-card",
      categoryId: null,
    }),
  ];

  const engine = createAccountingEngine(accounts, transactions);
  const summary = engine.calculateAccountBalanceSummary();

  assert.equal(summary.balances["hdfc-savings"].currentBalance, 48000);
  assert.equal(summary.balances["hdfc-credit-card"].currentBalance, 0);
  assert.equal(engine.calculateMonthlyExpenses(month(2026, 8)), 2000);
});

test("Refund reduces effective spending", () => {
  const transactions = [
    tx({
      id: "expense-1",
      type: "EXPENSE",
      amount: 1000,
      fromAccountId: "hdfc-savings",
      categoryId: "cat-shopping",
    }),
    tx({
      id: "refund-1",
      type: "REFUND",
      amount: 200,
      toAccountId: "hdfc-savings",
      categoryId: "cat-shopping",
      refundForTransactionId: "expense-1",
    }),
  ];
  const engine = createAccountingEngine(accounts, transactions);

  assert.equal(engine.calculateMonthlyExpenses(month(2026, 8)), 800);
  assert.equal(engine.calculateAccountBalanceSummary().balances["hdfc-savings"].currentBalance, 49200);
});

test("Editing transaction amount/category updates all derived values", () => {
  const original: LedgerTransaction[] = [
    tx({
      id: "expense-1",
      type: "EXPENSE",
      amount: 500,
      fromAccountId: "hdfc-savings",
      categoryId: "cat-food",
    }),
  ];

  const edited: LedgerTransaction[] = [
    {
      ...original[0],
      amount: 800,
      categoryId: "cat-shopping",
    },
  ];

  const originalEngine = createAccountingEngine(accounts, original);
  const editedEngine = createAccountingEngine(accounts, edited);

  assert.equal(originalEngine.calculateMonthlyExpenses(month(2026, 8)), 500);
  assert.equal(editedEngine.calculateMonthlyExpenses(month(2026, 8)), 800);
  assert.equal(
    editedEngine.calculateCategorySpending(month(2026, 8))["cat-shopping"],
    800,
  );
});

test("Deletion of transaction correctly restores balances and expenses", () => {
  const withExpense = [
    tx({
      id: "expense-1",
      type: "EXPENSE",
      amount: 500,
      fromAccountId: "hdfc-savings",
      categoryId: "cat-food",
    }),
  ];

  const withoutExpense: LedgerTransaction[] = [];

  const withExpenseEngine = createAccountingEngine(accounts, withExpense);
  const withoutExpenseEngine = createAccountingEngine(accounts, withoutExpense);

  assert.equal(withExpenseEngine.calculateAccountBalanceSummary().balances["hdfc-savings"].currentBalance, 49500);
  assert.equal(withoutExpenseEngine.calculateAccountBalanceSummary().balances["hdfc-savings"].currentBalance, 50000);
  assert.equal(withoutExpenseEngine.calculateMonthlyExpenses(month(2026, 8)), 0);
});

test("Transactions are classified into correct monthly period", () => {
  const transactions = [
    tx({
      id: "july-expense",
      type: "EXPENSE",
      amount: 1000,
      fromAccountId: "hdfc-savings",
      categoryId: "cat-food",
      occurredAt: new Date("2026-07-31T20:00:00.000Z"),
    }),
    tx({
      id: "aug-expense",
      type: "EXPENSE",
      amount: 2000,
      fromAccountId: "hdfc-savings",
      categoryId: "cat-food",
      occurredAt: new Date("2026-08-10T20:00:00.000Z"),
    }),
  ];
  const engine = createAccountingEngine(accounts, transactions);

  assert.equal(engine.calculateMonthlyExpenses(month(2026, 7)), 1000);
  assert.equal(engine.calculateMonthlyExpenses(month(2026, 8)), 2000);
});

test("Opening balances are never treated as monthly income", () => {
  const engine = createAccountingEngine(accounts, []);
  const summary = engine.calculateAccountBalanceSummary();

  assert.equal(summary.balances["hdfc-savings"].currentBalance, 50000);
  assert.equal(summary.balances["icici-savings"].currentBalance, 10000);
  assert.equal(engine.calculateMonthlyIncome(month(2026, 8)), 0);
});

test("Budget status flags near-limit and over-budget correctly", () => {
  const engine = createAccountingEngine(accounts, []);
  const near = engine.calculateBudgetStatus(10000, 8400);
  const over = engine.calculateBudgetStatus(10000, 11000);

  assert.equal(near.isNearLimit, true);
  assert.equal(near.isOverBudget, false);
  assert.equal(over.isOverBudget, true);
  assert.equal(over.remaining, -1000);
});
