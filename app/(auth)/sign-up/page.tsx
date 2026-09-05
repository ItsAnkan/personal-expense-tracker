"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Sign-up failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.push("/sign-in?created=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 shadow-[0_24px_80px_rgba(27,45,42,0.08)] backdrop-blur-sm">
        <div className="border-b border-border bg-[linear-gradient(135deg,rgba(22,61,53,0.96),rgba(32,76,68,0.88))] p-6 text-primary-foreground">
          <p className="text-[10px] uppercase tracking-[0.26em] text-primary-foreground/75">Create account</p>
          <h1 className="mt-2 text-3xl font-semibold">Start tracking</h1>
          <p className="mt-2 text-sm text-primary-foreground/85">Set up your personal workspace in under a minute.</p>
        </div>

        <div className="p-6">
          <form className="grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Name</span>
              <input
                name="name"
                className="h-12 rounded-xl border border-input bg-background px-3 text-foreground"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Email</span>
              <input
                name="email"
                className="h-12 rounded-xl border border-input bg-background px-3 text-foreground"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Password</span>
              <input
                name="password"
                className="h-12 rounded-xl border border-input bg-background px-3 text-foreground"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            ) : null}

            <Button className="h-12 rounded-xl text-sm font-semibold" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
