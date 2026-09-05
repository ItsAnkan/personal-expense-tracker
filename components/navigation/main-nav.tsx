"use client";

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import InsightsIcon from "@mui/icons-material/Insights";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: "dashboard" as const },
  { href: "/transactions", label: "Transactions", mobileLabel: "Txns", icon: "transactions" as const },
  { href: "/accounts", label: "Accounts", mobileLabel: "Accts", icon: "accounts" as const },
  { href: "/categories", label: "Categories", mobileLabel: "Cats", icon: "categories" as const },
  { href: "/insights", label: "Insights", mobileLabel: "Insig", icon: "insights" as const },
  { href: "/monthly-history", label: "History", mobileLabel: "Hist", icon: "history" as const },
  { href: "/settings", label: "Settings", mobileLabel: "Set", icon: "settings" as const },
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
        <div className="grid grid-cols-7 gap-0 px-1 py-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <NavIcon icon={item.icon} />
                <span className="mt-0.5 text-[9px] font-medium leading-none tracking-tight">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

const navIconMap = {
  dashboard: DashboardIcon,
  transactions: ReceiptLongIcon,
  accounts: AccountBalanceWalletIcon,
  categories: CategoryIcon,
  insights: InsightsIcon,
  history: HistoryIcon,
  settings: SettingsIcon,
} as const;

function NavIcon({ icon }: { icon: (typeof navItems)[number]["icon"] }) {
  const Icon = navIconMap[icon];
  return <Icon className="h-5 w-5" />;
}

