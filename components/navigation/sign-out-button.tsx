"use client";

import LogoutIcon from "@mui/icons-material/Logout";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        signOut({
          callbackUrl: "/sign-in",
        })
      }
    >
      <LogoutIcon className="h-4 w-4" />
      <span>Sign out</span>
    </Button>
  );
}
