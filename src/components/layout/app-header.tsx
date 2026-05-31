"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, FileText, CreditCard } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/billing", label: "Billing", icon: CreditCard, exact: false },
];

export function AppHeader({ usage }: { usage?: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {usage}
          <ThemeToggle />
          <UserButton
            appearance={{ elements: { avatarBox: "size-8" } }}
          />
        </div>
      </div>
      <nav className="flex items-center gap-1 border-t border-border px-5 py-2 sm:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium",
              isActive(item.href, item.exact)
                ? "bg-secondary text-foreground"
                : "text-muted-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <FileText className="size-3.5" /> Resumes
        </span>
      </nav>
    </header>
  );
}
