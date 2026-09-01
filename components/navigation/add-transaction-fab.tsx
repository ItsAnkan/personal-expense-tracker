"use client";

import Link from "next/link";

export function AddTransactionFab() {
  return (
    <Link
      href="/transactions?openAdd=1"
      className="fixed right-3 bottom-[5.5rem] z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg transition-transform hover:scale-110 md:right-6 md:bottom-6"
      aria-label="Add transaction"
    >
      +
    </Link>
  );
}

