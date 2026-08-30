"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: "dashboard" as const },
  { href: "/transactions", label: "Transactions", mobileLabel: "Txns", icon: "transactions" as const },
  { href: "/accounts", label: "Accounts", mobileLabel: "Accounts", icon: "accounts" as const },
  { href: "/categories", label: "Categories", mobileLabel: "Categories", icon: "categories" as const },
  { href: "/insights", label: "Insights", mobileLabel: "Insights", icon: "insights" as const },
  { href: "/monthly-history", label: "History", mobileLabel: "History", icon: "history" as const },
  { href: "/settings", label: "Settings", mobileLabel: "Settings", icon: "settings" as const },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        <div className="flex h-full flex-col bg-primary px-4 py-5 text-primary-foreground shadow-[0_18px_50px_rgba(15,23,42,0.26)]">
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-primary-foreground/70">Finance</p>
              <p className="mt-1 text-lg font-semibold text-primary-foreground">Tracker</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 text-lg text-primary-foreground">
              ₹
            </div>
          </div>
          <div className="space-y-2">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-accent text-accent-foreground shadow-[0_12px_24px_rgba(16,185,129,0.18)]"
                      : "text-primary-foreground/85 hover:bg-primary-foreground/8 hover:text-primary-foreground",
                  )}
                >
                  <NavIcon icon={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-auto rounded-2xl border border-primary-foreground/25 bg-primary-foreground/12 px-3 py-3 text-xs text-primary-foreground">
            Spend intentionally. Live clearly.
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-12px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-7 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex items-center justify-center rounded-2xl px-1 py-2.5 transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <NavIcon icon={item.icon} />
                <span className="sr-only">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function NavIcon({ icon }: { icon: (typeof navItems)[number]["icon"] }) {
  const common = "h-5 w-5";

  if (icon === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="5" rx="2" />
        <rect x="13" y="10" width="8" height="11" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
      </svg>
    );
  }
  if (icon === "transactions") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
        <path d="M4 7h16" />
        <path d="M4 12h10" />
        <path d="M4 17h7" />
        <path d="M18 11l3 3-3 3" />
      </svg>
    );
  }
  if (icon === "accounts") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
        <rect x="2.5" y="5" width="19" height="14" rx="3" />
        <path d="M2.5 10h19" />
        <path d="M7 15h3" />
      </svg>
    );
  }
  if (icon === "categories") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
        <path d="M4 6h6" />
        <path d="M4 12h10" />
        <path d="M4 18h14" />
        <circle cx="16.5" cy="6" r="1.5" />
        <circle cx="20.5" cy="12" r="1.5" />
        <circle cx="18.5" cy="18" r="1.5" />
      </svg>
    );
  }
  if (icon === "insights") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
        <path d="M6 18V9" />
        <path d="M12 18V5" />
        <path d="M18 18v-7" />
        <path d="M4 18h16" />
      </svg>
    );
  }
  if (icon === "history") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
        <path d="M3 12a9 9 0 1 0 3-6.71" />
        <path d="M3 4v4h4" />
        <path d="M12 7v6l4 2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
