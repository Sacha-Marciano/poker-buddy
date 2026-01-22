import { Card, Skeleton } from '@/components/ui';

export function ParticipantCardSkeleton() {
  return (
    <Card variant="outlined">
      <div className="space-y-4">
        {/* Player Info */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>

        {/* Buy-In Controls */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
          {/* Quick Buy-In Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>

          {/* Custom Amount */}
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-10" />
            <Skeleton className="h-10 w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}
