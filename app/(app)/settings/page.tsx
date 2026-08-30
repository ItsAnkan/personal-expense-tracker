import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ThemePreferences } from "@/components/settings/theme-preferences";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireUserSession();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      defaultCurrency: true,
      timezone: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User record not found.");
  }

  return (
    <main className="w-full space-y-5">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile and application defaults.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="text-muted-foreground">Default currency</dt>
            <dd className="font-medium">{user.defaultCurrency}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="text-muted-foreground">Timezone</dt>
            <dd className="font-medium">{user.timezone}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="font-medium">
              {user.createdAt.toLocaleDateString("en-IN", { timeZone: "UTC" })}
            </dd>
          </div>
        </dl>
      </section>

      <ThemePreferences />
    </main>
  );
}
