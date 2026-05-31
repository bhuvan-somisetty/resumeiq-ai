import { TooltipProvider } from "@/components/ui/tooltip";
import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
      </div>
    </TooltipProvider>
  );
}
