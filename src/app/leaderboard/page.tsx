'use client';

import { PageHeader, Card, EmptyState, Badge, Skeleton } from '@/components/ui';
import { useLeaderboard } from '@/hooks/useApi';
import { formatCurrency, formatProfitLoss, getProfitLossColor } from '@/lib/utils';

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading, error } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Leaderboard" showBack />
        <main className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="outlined">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-6 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Leaderboard" showBack />

      <main className="p-4">
        {error && (
          <div className="mb-4">
            <p className="text-[#c0392b]">Failed to load leaderboard: {error}</p>
          </div>
        )}

        {!error && leaderboard && leaderboard.length === 0 && (
          <EmptyState
            title="No data yet"
            description="Play some games to see the leaderboard"
          />
        )}

        {!error && leaderboard && leaderboard.length > 0 && (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <Card key={entry.playerId} variant="outlined">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="shrink-0 w-12 h-12 flex items-center justify-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white"
                      style={{ backgroundColor: entry.avatarColor || '#6B7280' }}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#e8e0d4] truncate">
                      {entry.playerName}
                    </h3>
                    <p className="text-sm text-[#9a9088]">
                      {entry.totalGamesPlayed} games • Avg:{' '}
                      {entry.averageProfitPerSession !== null
                        ? formatProfitLoss(entry.averageProfitPerSession)
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Total P/L */}
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${getProfitLossColor(
                        entry.totalProfitLoss
                      )}`}
                    >
                      {formatProfitLoss(entry.totalProfitLoss)}
                    </p>
                    <p className="text-xs text-[#9a9088]">
                      {formatCurrency(entry.totalBuyIns)} played
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
