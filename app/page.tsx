import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              E
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Expense</p>
              <h1 className="font-display text-2xl leading-none">Tracker</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="mt-12 grid flex-1 items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
          <div>
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Personal finance
            </span>

            <h2 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Keep your money clear, calm, and under control.
            </h2>

            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Track spending, watch balances, and review your month without the spreadsheet chaos.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Create account
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                <p className="text-lg font-bold text-foreground sm:text-2xl">â‚¹42k</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Spent this month</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                <p className="text-lg font-bold text-foreground sm:text-2xl">â‚¹85k</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Monthly income</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                <p className="text-lg font-bold text-foreground sm:text-2xl">â‚¹7.6k</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Left to spend</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_24px_80px_rgba(27,45,42,0.08)] sm:p-6">
            <div className="rounded-2xl border border-border bg-[linear-gradient(135deg,rgba(22,61,53,0.96),rgba(32,76,68,0.88))] p-5 text-primary-foreground">
              <p className="text-[10px] uppercase tracking-[0.24em] text-primary-foreground/70">This month</p>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-primary-foreground/75">Net cash flow</p>
                  <p className="mt-1 text-3xl font-semibold">â‚¹42,650</p>
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-xs font-medium text-primary-foreground/90">
                  +8.4%
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-3">
                <div>
                  <p className="text-sm text-muted-foreground">Income</p>
                  <p className="text-lg font-semibold text-foreground">â‚¹85,000</p>
                </div>
                <span className="text-xs font-medium text-emerald-600">+2.4%</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-3">
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-lg font-semibold text-foreground">â‚¹42,350</p>
                </div>
                <span className="text-xs font-medium text-amber-600">Budget</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-3">
                <div>
                  <p className="text-sm text-muted-foreground">Balances</p>
                  <p className="text-lg font-semibold text-foreground">â‚¹94,250</p>
                </div>
                <span className="text-xs font-medium text-sky-600">Stable</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

