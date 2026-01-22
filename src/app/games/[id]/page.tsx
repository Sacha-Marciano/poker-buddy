'use client';

import { use } from 'react';
import { format } from 'date-fns';
import { PageHeader, Card, CardTitle, Badge, EmptyState, Button, Skeleton } from '@/components/ui';
import { useGame } from '@/hooks/useGame';
import { formatCurrency, formatProfitLoss, getProfitLossColor } from '@/lib/utils';
import { AddParticipantModal } from '@/components/game/AddParticipantModal';
import { ParticipantCard } from '@/components/game/ParticipantCard';
import { ParticipantCardSkeleton } from '@/components/game/ParticipantCardSkeleton';
import { EndGameModal } from '@/components/game/EndGameModal';
import { useState } from 'react';

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { game, isLoading, error, loadGame } = useGame(id);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);

  const handleParticipantAdded = () => {
    loadGame(id);
  };

  const handleBuyInAdded = () => {
    loadGame(id);
  };

  const handleGameCompleted = () => {
    loadGame(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader
          title="Loading..."
          showBack
        />
        <main className="p-4 space-y-4">
          {/* Status Skeleton */}
          <Card>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>

          {/* Players Header Skeleton */}
          <div className="flex items-center justify-between mb-3 px-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>

          {/* Participant Skeletons */}
          <div className="space-y-3">
            <ParticipantCardSkeleton />
            <ParticipantCardSkeleton />
            <ParticipantCardSkeleton />
          </div>

          {/* Total Buy-ins Skeleton */}
          <Card>
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="text-center">
              <Skeleton className="h-9 w-40 mx-auto" />
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Game Not Found" showBack />
        <div className="p-4">
          <p className="text-red-600">{error || 'Game not found'}</p>
        </div>
      </div>
    );
  }

  const isGameActive = game.status === 'IN_PROGRESS';

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={game.location || 'Game Session'}
        subtitle={format(new Date(game.startTime), 'MMM d, yyyy • h:mm a')}
        showBack
      />

      <main className="p-4 space-y-4">
        {/* Game Status */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Status</h3>
            <Badge variant={isGameActive ? 'success' : 'default'}>
              {isGameActive ? 'Active' : 'Completed'}
            </Badge>
          </div>
        </Card>

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Players ({game.participants.length})
            </h2>
            {isGameActive && (
              <Button
                size="sm"
                onClick={() => setShowAddParticipantModal(true)}
              >
                + Add Player
              </Button>
            )}
          </div>

          {game.participants.length === 0 ? (
            <Card variant="outlined">
              <EmptyState
                title="No players yet"
                description="Add players to start tracking buy-ins"
                action={
                  isGameActive ? (
                    <Button onClick={() => setShowAddParticipantModal(true)}>
                      Add First Player
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {game.participants.map((participant) => (
                <ParticipantCard
                  key={participant._id}
                  participant={participant}
                  isGameActive={isGameActive}
                  onBuyInAdded={handleBuyInAdded}
                />
              ))}
            </div>
          )}
        </div>

        {/* Total Buy-ins */}
        <Card>
          <CardTitle className="mb-3">Total Buy-Ins</CardTitle>
          <div className="text-center">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(game.totalBuyIns)}
            </p>
          </div>
        </Card>

        {/* End Game Button */}
        {isGameActive && game.participants.length > 0 && (
          <Button
            onClick={() => setShowEndGameModal(true)}
            variant="danger"
            fullWidth
            size="lg"
          >
            End Game
          </Button>
        )}

        {/* Balance Summary - Only show difference when completed */}
        {!isGameActive && (
          <Card>
            <CardTitle className="mb-4">Final Balance</CardTitle>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Total Buy-ins</span>
                <span className="font-semibold">{formatCurrency(game.totalBuyIns)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Total Cashouts</span>
                <span className="font-semibold">{formatCurrency(game.totalCashouts)}</span>
              </div>
              <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex justify-between items-center">
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Difference</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${getProfitLossColor(game.balanceDiscrepancy)}`}>
                    {formatProfitLoss(game.balanceDiscrepancy)}
                  </span>
                  <Badge
                    variant={
                      game.balanceStatus === 'GREEN'
                        ? 'success'
                        : game.balanceStatus === 'YELLOW'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {game.balanceStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Settlements - Only show when completed */}
        {!isGameActive && game.settlements.length > 0 && (
          <Card>
            <CardTitle className="mb-4">Settlements</CardTitle>
            <div className="space-y-2">
              {game.settlements.map((settlement) => (
                <div
                  key={settlement._id}
                  className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {settlement.fromPlayerName}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        pays
                      </p>
                    </div>
                    <div className="px-4">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(settlement.amount)}
                      </p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        to
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {settlement.toPlayerName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardTitle className="mb-4">Recent Transactions</CardTitle>
          {game.transactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Buy-ins and cashouts will appear here"
            />
          ) : (
            <div className="space-y-2">
              {game.transactions.slice(-10).reverse().map((tx) => (
                <div key={tx._id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{tx.playerName}</span>
                    <span className="text-zinc-500 mx-2">•</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {format(new Date(tx.timestamp), 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={tx.type === 'BUY_IN' ? 'text-red-600' : 'text-green-600'}>
                      {tx.type === 'BUY_IN' ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </span>
                    <Badge variant={tx.type === 'BUY_IN' ? 'danger' : 'success'} size="sm">
                      {tx.type === 'BUY_IN' ? 'Buy-in' : 'Cashout'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      {/* Add Participant Modal */}
      <AddParticipantModal
        isOpen={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        gameId={id}
        existingParticipantIds={game.participants.map((p) => p.playerId)}
        onParticipantAdded={handleParticipantAdded}
      />

      {/* End Game Modal */}
      <EndGameModal
        isOpen={showEndGameModal}
        onClose={() => setShowEndGameModal(false)}
        gameId={id}
        participants={game.participants}
        onGameCompleted={handleGameCompleted}
      />
    </div>
  );
}
