"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function SignInForm({ created }: { created: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    const result = await signIn("credentials", {
      email: normalizedEmail,
      password: normalizedPassword,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(result.url ?? "/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 shadow-[0_24px_80px_rgba(27,45,42,0.08)] backdrop-blur-sm">
        <div className="border-b border-border bg-[linear-gradient(135deg,rgba(22,61,53,0.96),rgba(32,76,68,0.88))] p-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-bold">
              E
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-primary-foreground/70">Expense</p>
              <h1 className="font-display text-3xl leading-none">Tracker</h1>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm text-primary-foreground/80">
            Monthly clarity, steady spending, and better decisions without the spreadsheet drama.
          </p>
        </div>

        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Welcome back</p>
          <h2 className="mt-3 font-display text-4xl text-foreground">Sign in</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the seeded demo credentials or your own account.
          </p>
          {created ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Account created. Please sign in.
            </p>
          ) : null}

          <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Email</span>
              <input
                className="h-12 rounded-xl border border-input bg-background px-3 text-foreground shadow-inner shadow-black/5 placeholder:text-muted-foreground"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Password</span>
              <input
                className="h-12 rounded-xl border border-input bg-background px-3 text-foreground shadow-inner shadow-black/5 placeholder:text-muted-foreground"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                minLength={8}
              />
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button className="h-12 rounded-xl text-sm font-semibold" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/sign-up" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
