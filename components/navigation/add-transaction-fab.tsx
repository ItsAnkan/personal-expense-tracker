"use client";

import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";

export function AddTransactionFab() {
  return (
    <Link
      href="/transactions?openAdd=1"
      className="fixed right-3 bottom-24 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 md:right-6 md:bottom-6"
      aria-label="Add transaction"
    >
      <AddIcon className="h-7 w-7" />
    </Link>
  );
}
