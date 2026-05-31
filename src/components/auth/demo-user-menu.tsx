"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Demo-mode account control shown in the app header in place of Clerk's
 * <UserButton>. Displays the demo avatar and signs out by clearing the cookie.
 */
export function DemoUserMenu() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await fetch("/api/demo/session", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out.");
      setLoading(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={signOut}
          disabled={loading}
          aria-label="Sign out of demo"
          className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          {loading ? (
            <LogOut className="size-4 animate-pulse" />
          ) : (
            <span className="group-hover:hidden">D</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>Sign out (demo)</TooltipContent>
    </Tooltip>
  );
}
