# Phase 7: Screen Implementations

## Objective

Implement all application screens using the UI components and API hooks created in previous phases. Each screen will be a Next.js App Router page with proper loading states, error handling, and mobile-first design.

## Prerequisites

- Phase 5 completed (State management)
- Phase 6 completed (UI components)
- API routes functional (Phase 3)

## Scope

### In Scope
- All page implementations per specification
- Loading states and error handling
- Form validation with Zod
- Mobile-first responsive layouts
- Connection of UI to API

### Out of Scope
- Bottom navigation (Phase 8)
- Advanced animations
- PWA features

## Implementation Details

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/app/page.tsx` | Dashboard screen | ~120 |
| `src/app/games/new/page.tsx` | Create game form | ~150 |
| `src/app/games/[id]/page.tsx` | Game detail screen | ~200 |
| `src/app/games/[id]/cashout/page.tsx` | Cashout screen | ~180 |
| `src/app/games/[id]/complete/page.tsx` | Complete game screen | ~150 |
| `src/app/games/[id]/layout.tsx` | Game layout with provider | ~20 |
| `src/app/games/history/page.tsx` | Game history list | ~80 |
| `src/app/players/page.tsx` | Players list | ~120 |
| `src/app/players/[id]/page.tsx` | Player detail | ~150 |
| `src/app/leaderboard/page.tsx` | Leaderboard | ~100 |

### Dashboard (`src/app/page.tsx`)

```typescript
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { GameCard } from '@/components/game/GameCard';
import { useActiveGames } from '@/hooks/useApi';

export default function DashboardPage() {
  const { data: activeGames, isLoading, error } = useActiveGames();

  if (isLoading) {
    return <LoadingPage />;
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
      </main>
    </div>
  );
}
```

### Create Game (`src/app/games/new/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { gameApi } from '@/lib/api';
import { createGameSchema } from '@/schemas/game';

export default function CreateGamePage() {
  const router = useRouter();
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

    // Build minimum cashout datetime (same date as start time, but with min cashout hours)
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
      setError(validation.error.errors[0]?.message || 'Invalid input');
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
      <PageHeader title="New Game" showBack />

      <main className="p-4">
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
                label="Minimum Cashout Time"
                type="time"
                value={minCashoutTime}
                onChange={(e) => setMinCashoutTime(e.target.value)}
                hint="Cashouts blocked until this time"
              />

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  fullWidth
                >
                  Create Game
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
}
```

### Game Detail Layout (`src/app/games/[id]/layout.tsx`)

```typescript
'use client';

import { GameProvider } from '@/contexts/GameContext';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GameProvider>{children}</GameProvider>;
}
```

### Game Detail (`src/app/games/[id]/page.tsx`)

```typescript
'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FAB } from '@/components/ui/FAB';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BalanceSummary } from '@/components/game/BalanceSummary';
import { TransactionLog } from '@/components/game/TransactionLog';
import { QuickBuyInModal } from '@/components/game/QuickBuyInModal';
import { Select, type SelectOption } from '@/components/ui/Select';
import { useGame, useGameActions } from '@/hooks/useGame';
import { usePlayers } from '@/hooks/useApi';
import { formatCurrency, formatProfitLoss, getProfitLossColor } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GameDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { game, isLoading, error, isGameInProgress, canCashout } = useGame(id);
  const { addParticipant, addBuyIn, updateBuyIn, deleteBuyIn } = useGameActions();
  const { data: players } = usePlayers();

  const [isBuyInModalOpen, setIsBuyInModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  // Get players not yet in this game
  const availablePlayers: SelectOption[] = players
    ?.filter((p) => !game?.participants.some((gp) => gp.playerId === p._id))
    .map((p) => ({ value: p._id, label: p.name })) || [];

  const handleAddPlayer = async () => {
    if (!selectedPlayer) return;
    setIsAddingPlayer(true);
    await addParticipant(selectedPlayer);
    setSelectedPlayer('');
    setIsAddingPlayer(false);
  };

  const handleBuyIn = async (participantId: string, amount: number) => {
    return addBuyIn(participantId, amount);
  };

  const handleEditBuyIn = (buyInId: string, currentAmount: number) => {
    const newAmount = window.prompt('Enter new amount:', currentAmount.toString());
    if (newAmount) {
      const amount = parseInt(newAmount, 10);
      if (!isNaN(amount) && amount >= 1 && amount <= 1000000) {
        updateBuyIn(buyInId, amount);
      }
    }
  };

  const handleDeleteBuyIn = (buyInId: string) => {
    if (window.confirm('Delete this buy-in?')) {
      deleteBuyIn(buyInId);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !game) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Game" showBack />
        <main className="p-4">
          <EmptyState
            title="Game not found"
            description={error || 'This game does not exist'}
          />
        </main>
      </div>
    );
  }

  const isCompleted = game.status === 'COMPLETED';
  const gameTitle = game.location || format(new Date(game.startTime), 'MMM d, yyyy');

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={gameTitle}
        showBack
        rightAction={
          isCompleted ? (
            <Badge variant="default">Completed</Badge>
          ) : (
            <Badge variant="success">Live</Badge>
          )
        }
      />

      <main className="p-4 space-y-4">
        {/* Game Info */}
        <Card variant="outlined">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Started</span>
              <p className="font-medium">
                {format(new Date(game.startTime), 'h:mm a')}
              </p>
            </div>
            {isCompleted && game.endTime && (
              <div>
                <span className="text-zinc-500">Ended</span>
                <p className="font-medium">
                  {format(new Date(game.endTime), 'h:mm a')}
                </p>
              </div>
            )}
            <div>
              <span className="text-zinc-500">Min Cashout</span>
              <p className="font-medium">
                {format(new Date(game.minimumCashoutTime), 'h:mm a')}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Players</span>
              <p className="font-medium">{game.participants.length}</p>
            </div>
          </div>
        </Card>

        {/* Balance Summary */}
        <BalanceSummary
          totalBuyIns={game.totalBuyIns}
          totalCashouts={game.totalCashouts}
          balanceDiscrepancy={game.balanceDiscrepancy}
          balanceStatus={game.balanceStatus}
          showDiscrepancy={isCompleted}
        />

        {/* Discrepancy Notes (completed games only) */}
        {isCompleted && game.discrepancyNotes && (
          <Card variant="outlined">
            <CardTitle>Discrepancy Notes</CardTitle>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {game.discrepancyNotes}
            </p>
          </Card>
        )}

        {/* Add Player (in-progress only) */}
        {isGameInProgress && availablePlayers.length > 0 && (
          <Card variant="outlined">
            <CardTitle>Add Player</CardTitle>
            <div className="flex gap-2 mt-3">
              <div className="flex-1">
                <Select
                  options={availablePlayers}
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  placeholder="Select player"
                />
              </div>
              <Button
                onClick={handleAddPlayer}
                disabled={!selectedPlayer}
                isLoading={isAddingPlayer}
              >
                Add
              </Button>
            </div>
          </Card>
        )}

        {/* Participants */}
        <Card variant="outlined" padding="none">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <CardTitle>Players</CardTitle>
          </div>
          {game.participants.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">
              No players yet. Add players to get started.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {game.participants.map((p) => (
                <li key={p._id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {p.playerName}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {p.buyInCount} buy-in{p.buyInCount !== 1 ? 's' : ''} - {formatCurrency(p.totalBuyIns)}
                      </p>
                    </div>
                    <div className="text-right">
                      {p.hasCashedOut ? (
                        <>
                          <p className="text-sm text-zinc-500">
                            Cashout: {formatCurrency(p.totalCashouts)}
                          </p>
                          <p className={`font-mono font-medium ${getProfitLossColor(p.profitLoss)}`}>
                            {formatProfitLoss(p.profitLoss)}
                          </p>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-500">Not cashed out</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Transaction Log */}
        <TransactionLog
          transactions={game.transactions}
          isEditable={isGameInProgress}
          onEditBuyIn={handleEditBuyIn}
          onDeleteBuyIn={handleDeleteBuyIn}
        />

        {/* Action Buttons (in-progress only) */}
        {isGameInProgress && (
          <div className="flex gap-3">
            <Link href={`/games/${game._id}/cashout`} className="flex-1">
              <Button
                variant="secondary"
                fullWidth
                disabled={!canCashout}
              >
                Cash Out Players
              </Button>
            </Link>
            <Link href={`/games/${game._id}/complete`} className="flex-1">
              <Button fullWidth>
                Complete Game
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* FAB for quick buy-in (in-progress only) */}
      {isGameInProgress && game.participants.length > 0 && (
        <>
          <FAB
            onClick={() => setIsBuyInModalOpen(true)}
            label="Record buy-in"
          />
          <QuickBuyInModal
            isOpen={isBuyInModalOpen}
            onClose={() => setIsBuyInModalOpen(false)}
            participants={game.participants}
            onSubmit={handleBuyIn}
          />
        </>
      )}
    </div>
  );
}
```

### Cashout Screen (`src/app/games/[id]/cashout/page.tsx`)

```typescript
'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGame } from '@/hooks/useGame';
import { cashoutApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CashoutPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { game, isLoading, error, canCashout, refreshGame } = useGame(id);

  const [cashouts, setCashouts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Initialize cashout values when game loads
  if (game && Object.keys(cashouts).length === 0 && game.participants.length > 0) {
    const initial: Record<string, string> = {};
    game.participants.forEach((p) => {
      initial[p._id] = p.hasCashedOut ? p.totalCashouts.toString() : '0';
    });
    setCashouts(initial);
  }

  const handleCashoutChange = (participantId: string, value: string) => {
    setCashouts((prev) => ({ ...prev, [participantId]: value }));
    setSubmitError('');
  };

  const handleSubmit = async () => {
    if (!game) return;

    // Validate all cashouts
    const cashoutData = game.participants
      .filter((p) => !p.hasCashedOut)
      .map((p) => {
        const amount = parseInt(cashouts[p._id] || '0', 10);
        return {
          gameParticipantId: p._id,
          amount: isNaN(amount) ? 0 : amount,
        };
      });

    // Check for invalid amounts
    const invalid = cashoutData.find((c) => c.amount < 0 || c.amount > 1000000);
    if (invalid) {
      setSubmitError('All amounts must be between 0 and 1,000,000');
      return;
    }

    setIsSubmitting(true);
    const result = await cashoutApi.createBatch({
      gameId: game._id,
      cashouts: cashoutData,
    });
    setIsSubmitting(false);

    if (result.success) {
      await refreshGame();
      router.push(`/games/${game._id}`);
    } else {
      setSubmitError(result.error);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !game) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Cash Out" showBack />
        <main className="p-4">
          <EmptyState
            title="Game not found"
            description={error || 'This game does not exist'}
          />
        </main>
      </div>
    );
  }

  if (game.status === 'COMPLETED') {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Cash Out" showBack />
        <main className="p-4">
          <EmptyState
            title="Game completed"
            description="This game has already been completed"
          />
        </main>
      </div>
    );
  }

  const uncashedOutPlayers = game.participants.filter((p) => !p.hasCashedOut);

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Cash Out Players" showBack />

      <main className="p-4 space-y-4">
        {/* Time Check */}
        {!canCashout && (
          <Card variant="outlined" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
            <div className="flex items-center gap-3">
              <Badge variant="warning">Too Early</Badge>
              <span className="text-sm">
                Cashouts allowed after {format(new Date(game.minimumCashoutTime), 'h:mm a')}
              </span>
            </div>
          </Card>
        )}

        {/* Info */}
        <Card variant="outlined">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter the final chip count for each player. Use 0 if a player left early.
          </p>
        </Card>

        {/* Cashout Form */}
        {uncashedOutPlayers.length === 0 ? (
          <EmptyState
            title="All players cashed out"
            description="All players have already cashed out"
            action={
              <Button onClick={() => router.push(`/games/${game._id}`)}>
                Back to Game
              </Button>
            }
          />
        ) : (
          <Card variant="outlined" padding="none">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {uncashedOutPlayers.map((p) => (
                <div key={p._id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {p.playerName}
                    </span>
                    <span className="text-sm text-zinc-500">
                      Bought in: {formatCurrency(p.totalBuyIns)}
                    </span>
                  </div>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1000000}
                    value={cashouts[p._id] || '0'}
                    onChange={(e) => handleCashoutChange(p._id, e.target.value)}
                    disabled={!canCashout}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {submitError && (
          <p className="text-red-600 text-sm text-center">{submitError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!canCashout || uncashedOutPlayers.length === 0}
            fullWidth
          >
            Save Cashouts
          </Button>
        </div>
      </main>
    </div>
  );
}
```

### Complete Game (`src/app/games/[id]/complete/page.tsx`)

```typescript
'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BalanceSummary } from '@/components/game/BalanceSummary';
import { useGame } from '@/hooks/useGame';
import { gameApi } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CompleteGamePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { game, isLoading, error } = useGame(id);

  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleComplete = async () => {
    if (!game) return;

    setIsSubmitting(true);
    const result = await gameApi.complete(game._id, {
      discrepancyNotes: discrepancyNotes || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      router.push(`/games/${game._id}`);
    } else {
      setSubmitError(result.error);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !game) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Complete Game" showBack />
        <main className="p-4">
          <EmptyState
            title="Game not found"
            description={error || 'This game does not exist'}
          />
        </main>
      </div>
    );
  }

  if (game.status === 'COMPLETED') {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Complete Game" showBack />
        <main className="p-4">
          <EmptyState
            title="Already completed"
            description="This game has already been completed"
          />
        </main>
      </div>
    );
  }

  const statusLabels = {
    GREEN: 'Balanced - No discrepancy',
    YELLOW: 'Extra chips - More money in than out',
    RED: 'Missing chips - More money out than in',
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Complete Game" showBack />

      <main className="p-4 space-y-4">
        {/* Balance Summary */}
        <BalanceSummary
          totalBuyIns={game.totalBuyIns}
          totalCashouts={game.totalCashouts}
          balanceDiscrepancy={game.balanceDiscrepancy}
          balanceStatus={game.balanceStatus}
        />

        {/* Status Explanation */}
        <Card variant="outlined">
          <div className="flex items-start gap-3">
            <Badge variant="status" status={game.balanceStatus}>
              {game.balanceStatus}
            </Badge>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {statusLabels[game.balanceStatus]}
            </p>
          </div>
        </Card>

        {/* Discrepancy Notes */}
        {game.balanceStatus !== 'GREEN' && (
          <Card variant="outlined">
            <CardTitle>Discrepancy Notes</CardTitle>
            <p className="text-sm text-zinc-500 mt-1 mb-3">
              Optional: Explain what happened with the difference
            </p>
            <textarea
              value={discrepancyNotes}
              onChange={(e) => setDiscrepancyNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 text-base rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Someone took extra chips, counting error..."
            />
            <p className="text-xs text-zinc-500 mt-1 text-right">
              {discrepancyNotes.length}/500
            </p>
          </Card>
        )}

        {/* Warning */}
        <Card variant="outlined" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Warning: Completed games cannot be edited. Make sure all cashouts are recorded correctly.
          </p>
        </Card>

        {submitError && (
          <p className="text-red-600 text-sm text-center">{submitError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            isLoading={isSubmitting}
            fullWidth
          >
            Complete Game
          </Button>
        </div>
      </main>
    </div>
  );
}
```

### Game History (`src/app/games/history/page.tsx`)

```typescript
'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { GameCard } from '@/components/game/GameCard';
import { useCompletedGames } from '@/hooks/useApi';

export default function GameHistoryPage() {
  const { data: games, isLoading, error } = useCompletedGames();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Game History" showBack />

      <main className="p-4">
        {error && (
          <p className="text-red-600 text-center">{error}</p>
        )}

        {!error && games && games.length === 0 && (
          <EmptyState
            title="No completed games"
            description="Completed games will appear here"
          />
        )}

        {!error && games && games.length > 0 && (
          <div className="space-y-3">
            {games.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

### Players List (`src/app/players/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePlayers, useApiMutation } from '@/hooks/useApi';
import { playerApi } from '@/lib/api';
import { formatCurrency, formatProfitLoss, getProfitLossColor } from '@/lib/utils';
import { createPlayerSchema } from '@/schemas/player';

export default function PlayersPage() {
  const { data: players, isLoading, error, refetch } = usePlayers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [formError, setFormError] = useState('');

  const createMutation = useApiMutation(playerApi.create);

  const handleAddPlayer = async () => {
    const validation = createPlayerSchema.safeParse({ name: newPlayerName });
    if (!validation.success) {
      setFormError(validation.error.errors[0]?.message || 'Invalid name');
      return;
    }

    const result = await createMutation.mutate({ name: validation.data.name });
    if (result.success) {
      setNewPlayerName('');
      setFormError('');
      setIsModalOpen(false);
      refetch();
    } else {
      setFormError(result.error);
    }
  };

  const handleCloseModal = () => {
    setNewPlayerName('');
    setFormError('');
    setIsModalOpen(false);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title="Players"
        rightAction={
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            Add Player
          </Button>
        }
      />

      <main className="p-4">
        {error && (
          <p className="text-red-600 text-center mb-4">{error}</p>
        )}

        {!error && players && players.length === 0 && (
          <EmptyState
            title="No players yet"
            description="Add your first player to get started"
            action={
              <Button onClick={() => setIsModalOpen(true)}>Add Player</Button>
            }
          />
        )}

        {!error && players && players.length > 0 && (
          <div className="space-y-3">
            {players.map((player) => (
              <Link key={player._id} href={`/players/${player._id}`}>
                <Card variant="outlined" className="hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {player.name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {player.totalGamesPlayed} game{player.totalGamesPlayed !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-medium ${getProfitLossColor(player.totalProfitLoss)}`}>
                        {formatProfitLoss(player.totalProfitLoss)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Add Player Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add Player"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCloseModal} fullWidth>
              Cancel
            </Button>
            <Button
              onClick={handleAddPlayer}
              isLoading={createMutation.isLoading}
              fullWidth
            >
              Add Player
            </Button>
          </div>
        }
      >
        <Input
          label="Player Name"
          value={newPlayerName}
          onChange={(e) => {
            setNewPlayerName(e.target.value);
            setFormError('');
          }}
          placeholder="Enter player name"
          maxLength={50}
          error={formError}
          autoFocus
        />
      </Modal>
    </div>
  );
}
```

### Player Detail (`src/app/players/[id]/page.tsx`)

```typescript
'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePlayer, useApiMutation } from '@/hooks/useApi';
import { playerApi } from '@/lib/api';
import { formatCurrency, formatProfitLoss, getProfitLossColor } from '@/lib/utils';
import { updatePlayerSchema } from '@/schemas/player';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PlayerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: player, isLoading, error, refetch } = usePlayer(id);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [formError, setFormError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const updateMutation = useApiMutation(
    (data: { name: string }) => playerApi.update(id, data)
  );

  const handleEdit = () => {
    if (player) {
      setEditName(player.name);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    const validation = updatePlayerSchema.safeParse({ name: editName });
    if (!validation.success) {
      setFormError(validation.error.errors[0]?.message || 'Invalid name');
      return;
    }

    const result = await updateMutation.mutate({ name: validation.data.name });
    if (result.success) {
      setIsEditModalOpen(false);
      setFormError('');
      refetch();
    } else {
      setFormError(result.error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    setIsDeleting(true);
    const result = await playerApi.delete(id);
    setIsDeleting(false);

    if (result.success) {
      router.push('/players');
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !player) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Player" showBack />
        <main className="p-4">
          <EmptyState
            title="Player not found"
            description={error || 'This player does not exist'}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={player.name}
        showBack
        rightAction={
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            Edit
          </Button>
        }
      />

      <main className="p-4 space-y-4">
        {/* Statistics */}
        <Card variant="outlined">
          <CardTitle>Statistics</CardTitle>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-zinc-500">Games Played</p>
              <p className="text-xl font-bold">{player.totalGamesPlayed}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total P/L</p>
              <p className={`text-xl font-bold font-mono ${getProfitLossColor(player.totalProfitLoss)}`}>
                {formatProfitLoss(player.totalProfitLoss)}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total Buy-ins</p>
              <p className="text-lg font-mono">{formatCurrency(player.totalBuyIns)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total Cashouts</p>
              <p className="text-lg font-mono">{formatCurrency(player.totalCashouts)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Avg P/L per Game</p>
              <p className={`text-lg font-mono ${player.averageProfitPerSession !== null ? getProfitLossColor(player.averageProfitPerSession) : ''}`}>
                {player.averageProfitPerSession !== null
                  ? formatProfitLoss(player.averageProfitPerSession)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Best/Worst</p>
              <p className="text-sm">
                <span className="text-green-600">
                  {player.biggestWin !== null ? formatCurrency(player.biggestWin) : 'N/A'}
                </span>
                {' / '}
                <span className="text-red-600">
                  {player.biggestLoss !== null ? formatCurrency(Math.abs(player.biggestLoss)) : 'N/A'}
                </span>
              </p>
            </div>
          </div>
        </Card>

        {/* Game History */}
        <Card variant="outlined" padding="none">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <CardTitle>Game History</CardTitle>
          </div>
          {player.games.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">
              No games played yet
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {player.games.map((game) => (
                <li key={game.gameId}>
                  <Link
                    href={`/games/${game.gameId}`}
                    className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {format(new Date(game.date), 'MMM d, yyyy')}
                        </p>
                        {game.location && (
                          <p className="text-sm text-zinc-500">{game.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-medium ${getProfitLossColor(game.profitLoss)}`}>
                          {formatProfitLoss(game.profitLoss)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatCurrency(game.buyIns)} in / {formatCurrency(game.cashout)} out
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Delete Button */}
        <Button
          variant="danger"
          onClick={handleDelete}
          isLoading={isDeleting}
          fullWidth
        >
          Delete Player
        </Button>
      </main>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Player"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              isLoading={updateMutation.isLoading}
              fullWidth
            >
              Save
            </Button>
          </div>
        }
      >
        <Input
          label="Player Name"
          value={editName}
          onChange={(e) => {
            setEditName(e.target.value);
            setFormError('');
          }}
          maxLength={50}
          error={formError}
        />
      </Modal>
    </div>
  );
}
```

### Leaderboard (`src/app/leaderboard/page.tsx`)

```typescript
'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLeaderboard } from '@/hooks/useApi';
import { formatCurrency, formatProfitLoss, getProfitLossColor } from '@/lib/utils';

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading, error } = useLeaderboard();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Leaderboard" />

      <main className="p-4">
        <p className="text-sm text-zinc-500 mb-4 text-center">
          All-Time Rankings
        </p>

        {error && (
          <p className="text-red-600 text-center mb-4">{error}</p>
        )}

        {!error && leaderboard && leaderboard.length === 0 && (
          <EmptyState
            title="No players yet"
            description="Play some games to see the leaderboard"
          />
        )}

        {!error && leaderboard && leaderboard.length > 0 && (
          <Card variant="outlined" padding="none">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Games
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    P/L
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {leaderboard.map((entry, index) => (
                  <tr key={entry.playerId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/players/${entry.playerId}`}
                        className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600"
                      >
                        {entry.playerName}
                      </Link>
                      {entry.averageProfitPerSession !== null && (
                        <p className="text-xs text-zinc-500">
                          Avg: {formatProfitLoss(entry.averageProfitPerSession)}/game
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 text-right">
                      {entry.totalGamesPlayed}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${getProfitLossColor(entry.totalProfitLoss)}`}>
                      {formatProfitLoss(entry.totalProfitLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </div>
  );
}
```

## Error Handling

| Screen | Error Condition | Expected Behavior |
|--------|-----------------|-------------------|
| All | API fetch fails | Show error message with retry option |
| All | Not found (404) | Show empty state with navigation |
| Create Game | Validation fails | Show field-specific errors |
| Cashout | Before min time | Disable form, show warning |
| Complete Game | Already completed | Redirect or show message |

## Expected Results

After completing this phase:
1. All screens functional and navigable
2. Forms validate input correctly
3. Loading states shown during API calls
4. Errors displayed to user
5. Mobile-optimized layouts

## Validation Steps

1. Navigate through all screens
2. Create a player, game, buy-ins, and complete the game
3. Verify leaderboard updates
4. Test on mobile viewport (320px width)
5. Test error states by disconnecting network

## Success Criteria

- [ ] All 10 page files created
- [ ] Navigation between screens works
- [ ] Forms submit correctly
- [ ] Loading states display
- [ ] Errors handled gracefully
- [ ] Mobile layout works (no horizontal scroll)
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

## Potential Issues

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Hydration mismatch | Console warning | Ensure consistent client/server rendering |
| Route params not loading | Page shows undefined | Use `use(params)` pattern correctly |
| State not updating | UI stale after action | Call refetch after mutations |
| Form submission blocked | Button stays loading | Handle all error cases |

---

**Phase Dependencies**: Phase 5, Phase 6
**Next Phase**: Phase 8 - Navigation
