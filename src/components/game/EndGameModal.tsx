'use client';

import { useState, useMemo } from 'react';
import { Modal, Button, Input, Card } from '@/components/ui';
import { gameApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { GameParticipant } from '@/types/game';

interface EndGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  participants: GameParticipant[];
  onGameCompleted: () => void;
}

interface Settlement {
  fromPlayerName: string;
  toPlayerName: string;
  amount: number;
}

function calculateSettlements(
  participants: Array<{
    playerName: string;
    totalBuyIns: number;
    cashout: number;
  }>
): Settlement[] {
  // Calculate net position for each player
  const balances = participants.map((p) => ({
    playerName: p.playerName,
    balance: p.cashout - p.totalBuyIns,
  }));

  // Separate winners and losers
  const winners = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const losers = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const settlements: Settlement[] = [];
  let winnerIdx = 0;
  let loserIdx = 0;

  while (winnerIdx < winners.length && loserIdx < losers.length) {
    const winner = { ...winners[winnerIdx] };
    const loser = { ...losers[loserIdx] };

    const loserOwes = Math.abs(loser.balance);
    const winnerOwed = winner.balance;
    const transferAmount = Math.min(loserOwes, winnerOwed);

    if (transferAmount > 0) {
      settlements.push({
        fromPlayerName: loser.playerName,
        toPlayerName: winner.playerName,
        amount: transferAmount,
      });
    }

    winner.balance -= transferAmount;
    loser.balance += transferAmount;

    if (winner.balance === 0) winnerIdx++;
    if (loser.balance === 0) loserIdx++;
  }

  return settlements;
}

export function EndGameModal({
  isOpen,
  onClose,
  gameId,
  participants,
  onGameCompleted,
}: EndGameModalProps) {
  const [cashouts, setCashouts] = useState<Record<string, string>>(() => {
    // Initialize with empty strings
    return participants.reduce((acc, p) => {
      acc[p._id] = '';
      return acc;
    }, {} as Record<string, string>);
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCashoutChange = (participantId: string, value: string) => {
    setCashouts((prev) => ({
      ...prev,
      [participantId]: value,
    }));
  };

  const settlements = useMemo(() => {
    const participantsWithCashouts = participants.map((p) => ({
      playerName: p.playerName,
      totalBuyIns: p.totalBuyIns,
      cashout: parseInt(cashouts[p._id]) || 0,
    }));

    // Only calculate if all cashouts are filled
    const allFilled = participants.every((p) => cashouts[p._id] && parseInt(cashouts[p._id]) >= 0);
    if (!allFilled) return [];

    return calculateSettlements(participantsWithCashouts);
  }, [participants, cashouts]);

  const totalCashout = useMemo(() => {
    return participants.reduce((sum, p) => {
      const amount = parseInt(cashouts[p._id]) || 0;
      return sum + amount;
    }, 0);
  }, [participants, cashouts]);

  const totalBuyIns = useMemo(() => {
    return participants.reduce((sum, p) => sum + p.totalBuyIns, 0);
  }, [participants]);

  const difference = totalCashout - totalBuyIns;

  const handleSubmit = async () => {
    setError('');

    // Validate all cashouts are filled
    const allFilled = participants.every((p) => cashouts[p._id] && cashouts[p._id].trim() !== '');
    if (!allFilled) {
      setError('Please enter cashout amounts for all players');
      return;
    }

    setIsSubmitting(true);

    const cashoutData = participants.map((p) => ({
      gameParticipantId: p._id,
      amount: parseInt(cashouts[p._id]),
    }));

    const result = await gameApi.complete(gameId, {
      cashouts: cashoutData,
      discrepancyNotes: difference !== 0 ? `Balance difference: ${formatCurrency(Math.abs(difference))}` : undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      onGameCompleted();
      onClose();
    } else {
      setError(result.error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="End Game"
      footer={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            fullWidth
          >
            Complete Game
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Cashout Inputs */}
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Enter Final Chip Counts
          </h3>
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant._id}>
                <label className="block text-sm font-medium text-white mb-1">
                  {participant.playerName}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Chips remaining"
                      value={cashouts[participant._id]}
                      onChange={(e) => handleCashoutChange(participant._id, e.target.value)}
                      min="0"
                    />
                  </div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Bought: {formatCurrency(participant.totalBuyIns)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Summary */}
        <Card variant="outlined">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Total Buy-ins</span>
              <span className="font-semibold">{formatCurrency(totalBuyIns)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Total Cashouts</span>
              <span className="font-semibold">{formatCurrency(totalCashout)}</span>
            </div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex justify-between">
              <span className="font-semibold">Difference</span>
              <span
                className={`font-semibold ${
                  difference === 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
              </span>
            </div>
          </div>
        </Card>

        {/* Settlements */}
        {settlements.length > 0 && (
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Settlements
            </h3>
            <div className="space-y-2">
              {settlements.map((settlement, idx) => (
                <Card key={idx} variant="outlined" className="bg-blue-50 dark:bg-blue-900/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
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
                      <p className="text-sm font-medium text-white">
                        {settlement.toPlayerName}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
