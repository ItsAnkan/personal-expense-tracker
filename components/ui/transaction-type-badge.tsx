import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  TRANSFER: "Transfer",
  CREDIT_CARD_PAYMENT: "Card payment",
  REFUND: "Refund",
};

export function getTransactionTypeTone(type: string): string {
  switch (type) {
    case "INCOME":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "EXPENSE":
      return "border border-red-200 bg-red-50 text-red-700";
    case "TRANSFER":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "CREDIT_CARD_PAYMENT":
      return "border border-sky-200 bg-sky-50 text-sky-700";
    case "REFUND":
      return "border border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function TransactionTypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase",
        getTransactionTypeTone(type),
        className,
      )}
    >
      {typeLabels[type] ?? type}
    </span>
  );
}
