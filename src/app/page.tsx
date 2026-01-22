'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Card, CardTitle } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { GameCard } from '@/components/game/GameCard';
import { useActiveGames } from '@/hooks/useApi';

export default function DashboardPage() {
  const { data: activeGames, isLoading, error } = useActiveGames();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Poker Buddy
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <div className="flex gap-3">
            <Link href="/games/new" className="flex-1">
              <Button fullWidth size="lg">
                New Game
              </Button>
            </Link>
            <Link href="/games/history" className="flex-1">
              <Button variant="secondary" fullWidth size="lg">
                History
              </Button>
            </Link>
          </div>
        </section>

        {/* Active Games */}
        <section>
          <Card variant="outlined" padding="none">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <CardTitle>Active Games</CardTitle>
            </div>

            {error && (
              <div className="p-4">
                <p className="text-red-600">Failed to load games: {error}</p>
              </div>
            )}

            {!error && activeGames && activeGames.length === 0 && (
              <EmptyState
                title="No active games"
                description="Start a new game to begin tracking"
                action={
                  <Link href="/games/new">
                    <Button>Start New Game</Button>
                  </Link>
                }
              />
            )}

            {!error && activeGames && activeGames.length > 0 && (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {activeGames.map((game) => (
                  <div key={game._id} className="p-4">
                    <GameCard game={game} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Quick Links */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/players">
              <Card className="text-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Players
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Manage players
                </p>
              </Card>
            </Link>
            <Link href="/leaderboard">
              <Card className="text-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Leaderboard
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  View rankings
                </p>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
