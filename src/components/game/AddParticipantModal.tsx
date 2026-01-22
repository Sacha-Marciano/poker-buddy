'use client';

import { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { usePlayers } from '@/hooks/useApi';
import { playerApi, gameApi } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui';

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  existingParticipantIds: string[];
  onParticipantAdded: () => void;
}

export function AddParticipantModal({
  isOpen,
  onClose,
  gameId,
  existingParticipantIds,
  onParticipantAdded,
}: AddParticipantModalProps) {
  const { data: allPlayers, isLoading: loadingPlayers } = usePlayers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Filter out players already in the game
  const availablePlayers = allPlayers?.filter(
    (player) => !existingParticipantIds.includes(player._id)
  );

  const handleAddExistingPlayer = async (playerId: string) => {
    setError('');
    setIsSubmitting(true);

    const result = await gameApi.addParticipant(gameId, { playerId });

    setIsSubmitting(false);

    if (result.success) {
      onParticipantAdded();
      onClose();
    } else {
      setError(result.error);
    }
  };

  const handleCreateAndAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPlayerName.trim()) {
      setError('Player name is required');
      return;
    }

    setIsSubmitting(true);

    // First, create the player
    const createResult = await playerApi.create({ name: newPlayerName.trim() });

    if (!createResult.success) {
      setIsSubmitting(false);
      setError(createResult.error);
      return;
    }

    // Then add them to the game
    const addResult = await gameApi.addParticipant(gameId, {
      playerId: createResult.data._id,
    });

    setIsSubmitting(false);

    if (addResult.success) {
      setNewPlayerName('');
      setShowNewPlayerForm(false);
      onParticipantAdded();
      onClose();
    } else {
      setError(addResult.error);
    }
  };

  const handleClose = () => {
    setShowNewPlayerForm(false);
    setNewPlayerName('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Player"
      footer={
        showNewPlayerForm ? (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowNewPlayerForm(false);
                setNewPlayerName('');
                setError('');
              }}
              fullWidth
            >
              Back
            </Button>
            <Button
              onClick={handleCreateAndAddPlayer}
              isLoading={isSubmitting}
              fullWidth
            >
              Create & Add
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={handleClose} fullWidth>
            Cancel
          </Button>
        )
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {showNewPlayerForm ? (
        <form onSubmit={handleCreateAndAddPlayer}>
          <Input
            label="Player Name"
            placeholder="Enter name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            maxLength={50}
            autoFocus
          />
        </form>
      ) : (
        <div className="space-y-3">
          {loadingPlayers ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : availablePlayers && availablePlayers.length > 0 ? (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availablePlayers.map((player) => (
                  <button
                    key={player._id}
                    onClick={() => handleAddExistingPlayer(player._id)}
                    disabled={isSubmitting}
                    className="w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {player.name}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {player.totalGamesPlayed} game
                      {player.totalGamesPlayed !== 1 ? 's' : ''}
                    </p>
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <Button
                  variant="secondary"
                  onClick={() => setShowNewPlayerForm(true)}
                  fullWidth
                >
                  + Create New Player
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                All players have been added to this game
              </p>
              <Button
                variant="primary"
                onClick={() => setShowNewPlayerForm(true)}
                fullWidth
              >
                + Create New Player
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
