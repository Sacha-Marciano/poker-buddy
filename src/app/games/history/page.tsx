'use client';

import { PageHeader, Card, CardTitle, EmptyState, Badge, Skeleton } from '@/components/ui';
import { GameCard } from '@/components/game/GameCard';
import { useCompletedGames } from '@/hooks/useApi';

export default function GameHistoryPage() {
  const { data: games, isLoading, error } = useCompletedGames();

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Game History" showBack />
        <main className="p-4">
          <Card variant="outlined" padding="none">
            <div className="p-4 border-b border-[#3a3530]">
              <CardTitle>Completed Games</CardTitle>
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Game History" showBack />

      <main className="p-4">
        {error && (
          <div className="mb-4">
            <p className="text-[#c0392b]">Failed to load games: {error}</p>
          </div>
        )}

        {!error && games && games.length === 0 && (
          <EmptyState
            title="No completed games"
            description="Complete a game to see it here"
          />
        )}

        {!error && games && games.length > 0 && (
          <Card variant="outlined" padding="none">
            <div className="p-4 border-b border-[#3a3530]">
              <CardTitle>Completed Games ({games.length})</CardTitle>
            </div>
            <div className="divide-y divide-[#3a3530]">
              {games.map((game) => (
                <div key={game._id} className="p-4">
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
