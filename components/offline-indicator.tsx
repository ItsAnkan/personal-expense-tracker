"use client";

import WarningIcon from "@mui/icons-material/Warning";

import { useOffline } from "@/lib/use-offline";

export function OfflineIndicator() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
      <WarningIcon className="h-4 w-4" />
      <span>You are offline. Changes may not sync.</span>
    </div>
  );
}
