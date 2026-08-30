import type { TransactionInput } from "@/domain/transactions/validators";

export type ImportSource = "MANUAL" | "CSV_IMPORT" | "SMS_IMPORT" | "BANK_IMPORT";

export interface ImportedCandidate {
  raw: Record<string, string>;
  normalized?: Partial<TransactionInput>;
  errors: string[];
  duplicateOfTransactionId?: string;
}

export interface TransactionImporter {
  source: ImportSource;
  parse(input: string): ImportedCandidate[];
}
