import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysisLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-72 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
