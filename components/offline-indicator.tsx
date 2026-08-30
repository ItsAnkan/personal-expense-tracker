"use client";

import { useOffline } from "@/lib/use-offline";

export function OfflineIndicator() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
      ⚠ You are offline. Changes may not sync.
    </div>
  );
}
