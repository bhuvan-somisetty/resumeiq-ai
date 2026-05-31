import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(50%_50%_at_50%_40%,black,transparent)]"
      />
      <p className="text-7xl font-semibold tracking-tight text-gradient">404</p>
      <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
