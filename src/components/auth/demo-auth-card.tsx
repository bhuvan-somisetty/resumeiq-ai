"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Local demo sign-in. Replaces Clerk's hosted forms when running with
 * placeholder credentials — one click starts a cookie session and enters the app
 * so the full journey is reachable offline.
 */
export function DemoAuthCard({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/session", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start session");
      router.push("/app");
      router.refresh();
    } catch {
      toast.error("Could not start the demo session.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="size-4 text-primary" />
        </span>
        <div className="text-sm">
          <p className="font-medium">Local demo mode</p>
          <p className="mt-1 text-muted-foreground">
            Clerk isn&apos;t configured, so authentication runs locally. No
            password needed — continue to explore the full product with sample
            data stored only in memory.
          </p>
        </div>
      </div>

      <Button onClick={start} disabled={loading} className="w-full" size="lg">
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {mode === "sign-up" ? "Start the demo" : "Continue to the demo"}
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Add real Clerk keys to <code className="font-mono">.env.local</code> to
        enable production authentication.
      </p>
    </div>
  );
}
