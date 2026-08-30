export type AccountType = "BANK_ACCOUNT" | "CASH" | "CREDIT_CARD" | "WALLET" | "OTHER";

export type TransactionType =
  | "EXPENSE"
  | "INCOME"
  | "TRANSFER"
  | "CREDIT_CARD_PAYMENT"
  | "REFUND";

export type TransactionStatus = "POSTED" | "VOIDED";

export interface LedgerAccount {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currency: string;
  isActive: boolean;
}

export interface LedgerTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  occurredAt: Date | string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  categoryId?: string | null;
  status?: TransactionStatus;
  refundForTransactionId?: string | null;
}

export interface MonthRef {
  year: number;
  month: number;
}

export interface AccountComputation {
  accountId: string;
  accountType: AccountType;
  openingBalance: number;
  currentBalance: number;
  moneyIn: number;
  moneyOut: number;
}

export interface MonthlySnapshot {
  month: MonthRef;
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface BudgetStatus {
  budget: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
  isNearLimit: boolean;
  isOverBudget: boolean;
}

export interface AccountingSummary {
  balances: Record<string, AccountComputation>;
  totalAccountBalance: number;
  totalCreditCardOutstanding: number;
}
