import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/marketing/logo-mark";
import { BRAND } from "@/lib/brand";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="ResumeIQ AI home"
    >
      <LogoMark className="size-8 transition-transform duration-200 group-hover:scale-105" />
      <span className="text-[15px] font-semibold tracking-tight">
        {BRAND.name}
        <span className="text-muted-foreground"> {BRAND.suffix}</span>
      </span>
    </Link>
  );
}
