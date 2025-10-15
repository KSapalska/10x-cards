import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 3 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-4" role="status" aria-label="Ładowanie propozycji fiszek">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border rounded-lg p-6 bg-card">
          <div className="space-y-4">
            {/* Front of the flashcard skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>

            {/* Back of the flashcard skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Generowanie fiszek, proszę czekać...</span>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted/50", className)} aria-hidden="true" />;
}
