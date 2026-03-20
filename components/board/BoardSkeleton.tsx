import { Skeleton } from "@/components/ui/skeleton";

function ColumnSkeleton({ cards }: { cards: number }) {
  return (
    <div className="flex flex-col w-[300px] min-w-[280px] max-w-[340px] shrink-0">
      {/* Column header skeleton */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="size-2.5 rounded-full" />
        <Skeleton className="h-4 w-24 rounded" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>

      {/* Card skeletons */}
      <div className="flex-1 space-y-2 p-1 rounded-lg">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/50 bg-card p-3 border-l-[3px] border-l-muted"
            style={{ opacity: 1 - i * 0.15 }}
          >
            <div className="flex items-start gap-2">
              <Skeleton className="size-4 mt-0.5 rounded shrink-0" />
              <div className="flex-1 space-y-2.5">
                <Skeleton
                  className="h-4 rounded"
                  style={{ width: `${65 + ((i * 17) % 25)}%` }}
                />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="size-6 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-4 items-start animate-in fade-in duration-300">
        <ColumnSkeleton cards={3} />
        <ColumnSkeleton cards={2} />
        <ColumnSkeleton cards={4} />
        <ColumnSkeleton cards={1} />
      </div>
    </div>
  );
}
