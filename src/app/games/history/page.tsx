'use client';

import { PageHeader, Card, CardTitle, EmptyState, LoadingSpinner, Badge } from '@/components/ui';
import { GameCard } from '@/components/game/GameCard';
import { useCompletedGames } from '@/hooks/useApi';

export default function GameHistoryPage() {
  const { data: games, isLoading, error } = useCompletedGames();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Game History" showBack />

      <main className="p-4">
        {error && (
          <div className="mb-4">
            <p className="text-red-600">Failed to load games: {error}</p>
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
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <CardTitle>Completed Games ({games.length})</CardTitle>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
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
