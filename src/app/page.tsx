'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PageHeader, Button, Input, Card, CardTitle, EmptyState, Skeleton } from '@/components/ui';
import { GameCard } from '@/components/game/GameCard';
import { gameApi } from '@/lib/api';
import { createGameSchema } from '@/schemas/game';
import { useActiveGames } from '@/hooks/useApi';

export default function CreateGamePage() {
  const router = useRouter();
  const { data: activeGames, isLoading: gamesLoading, error: gamesError } = useActiveGames();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state with defaults
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(format(now, "yyyy-MM-dd'T'HH:mm"));
  const [minCashoutTime, setMinCashoutTime] = useState(format(midnight, 'HH:mm'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Build minimum cashout datetime
    const startDate = new Date(startTime);
    const [hours, minutes] = minCashoutTime.split(':').map(Number);
    const minCashoutDate = new Date(startDate);
    minCashoutDate.setHours(hours, minutes, 0, 0);

    // If min cashout time is earlier than start time, assume next day
    if (minCashoutDate < startDate) {
      minCashoutDate.setDate(minCashoutDate.getDate() + 1);
    }

    // Validate
    const validation = createGameSchema.safeParse({
      location: location || undefined,
      startTime: startDate.toISOString(),
      minimumCashoutTime: minCashoutDate.toISOString(),
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid input');
      return;
    }

    // Submit
    setIsSubmitting(true);
    const result = await gameApi.create(validation.data);
    setIsSubmitting(false);

    if (result.success) {
      router.push(`/games/${result.data._id}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Create New Game" />

      <main className="p-4 space-y-6">
        {/* Create Game Form */}
        <section>
          <form onSubmit={handleSubmit}>
            <Card variant="outlined">
              <div className="space-y-4">
                <Input
                  label="Location"
                  placeholder="e.g., John's place"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                  hint="Optional"
                />

                <Input
                  label="Start Time"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />

                <Input
                  label="Minimum Cashout Time (24h format)"
                  type="time"
                  value={minCashoutTime}
                  onChange={(e) => setMinCashoutTime(e.target.value)}
                  hint="Cashouts blocked until this time"
                />

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    fullWidth
                    size="lg"
                  >
                    Create Game
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        </section>

        {/* Active Games */}
        <section>
          <Card variant="outlined" padding="none">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <CardTitle>Active Games</CardTitle>
            </div>

            {gamesLoading && (
              <div className="p-4 space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}

            {gamesError && (
              <div className="p-4">
                <p className="text-red-600">Failed to load games: {gamesError}</p>
              </div>
            )}

            {!gamesLoading && !gamesError && activeGames && activeGames.length === 0 && (
              <div className="p-4">
                <EmptyState
                  title="No active games"
                  description="Create a game above to start tracking"
                />
              </div>
            )}

            {!gamesLoading && !gamesError && activeGames && activeGames.length > 0 && (
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
      </main>
    </div>
  );
}
