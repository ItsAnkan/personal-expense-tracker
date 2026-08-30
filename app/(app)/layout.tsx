import Link from "next/link";
import type { ReactNode } from "react";

import { OfflineIndicator } from "@/components/offline-indicator";
import { AddTransactionFab } from "@/components/navigation/add-transaction-fab";
import { MainNav } from "@/components/navigation/main-nav";
import { SignOutButton } from "@/components/navigation/sign-out-button";
import { requireUserSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireUserSession();

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <OfflineIndicator />
      <MainNav />
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 md:px-5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                ₹
              </span>
              <p className="text-sm font-medium text-muted-foreground">Money overview</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="hidden rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-sm md:block">
                {session.user.email}
              </p>
              <Link
                href="/settings"
                className="hidden rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm transition hover:text-foreground sm:inline-flex"
              >
                Settings
              </Link>
              <SignOutButton />
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl px-2 py-5 md:px-5 md:py-6">
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <AddTransactionFab />
    </div>
  );
}
