import { TooltipProvider } from "@/components/ui/tooltip";
import { AppHeader } from "@/components/layout/app-header";
import { UsageMeter } from "@/components/resumeiq/usage-meter";
import { requireUser } from "@/server/auth/current-user";
import { usageService } from "@/server/services/usage.service";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const usage = await usageService.getUsage(user.id, user.plan);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background">
        <AppHeader
          usage={
            <UsageMeter
              used={usage.used}
              limit={usage.limit}
              unlimited={usage.unlimited}
            />
          }
        />
        <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
      </div>
    </TooltipProvider>
  );
}
