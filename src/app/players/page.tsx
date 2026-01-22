'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader, Button, Card, EmptyState, LoadingSpinner, Input, Modal } from '@/components/ui';
import { usePlayers } from '@/hooks/useApi';
import { playerApi } from '@/lib/api';
import { formatCurrency, formatProfitLoss, getProfitLossColor } from '@/lib/utils';

export default function PlayersPage() {
  const { data: players, isLoading, error, refetch } = usePlayers();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newPlayerName.trim()) {
      setFormError('Name is required');
      return;
    }

    setIsSubmitting(true);
    const result = await playerApi.create({ name: newPlayerName.trim() });
    setIsSubmitting(false);

    if (result.success) {
      setNewPlayerName('');
      setShowAddModal(false);
      refetch();
    } else {
      setFormError(result.error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title="Players"
        showBack
        action={
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            Add Player
          </Button>
        }
      />

      <main className="p-4">
        {error && (
          <div className="mb-4">
            <p className="text-red-600">Failed to load players: {error}</p>
          </div>
        )}

        {!error && players && players.length === 0 && (
          <EmptyState
            title="No players yet"
            description="Add players to start tracking games"
            action={
              <Button onClick={() => setShowAddModal(true)}>
                Add First Player
              </Button>
            }
          />
        )}

        {!error && players && players.length > 0 && (
          <div className="space-y-3">
            {players.map((player) => (
              <Link key={player._id} href={`/players/${player._id}`}>
                <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {player.name}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {player.totalGamesPlayed} game{player.totalGamesPlayed !== 1 ? 's' : ''}
                        {' • '}
                        {formatCurrency(player.totalBuyIns)} total buy-ins
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-semibold ${getProfitLossColor(player.totalProfitLoss)}`}>
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
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewPlayerName('');
          setFormError('');
        }}
        title="Add Player"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPlayer}
              isLoading={isSubmitting}
              fullWidth
            >
              Add Player
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddPlayer}>
          <Input
            label="Player Name"
            placeholder="Enter name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            error={formError}
            maxLength={50}
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
}
