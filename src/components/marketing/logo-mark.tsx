import { cn } from "@/lib/utils";
import { logoSvg } from "@/lib/brand";

/** The ResumeIQ AI brand mark (icon only). Scales to its container. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: logoSvg() }}
    />
  );
}
