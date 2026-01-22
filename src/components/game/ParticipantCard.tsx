'use client';

import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { buyInApi } from '@/lib/api';
import { formatCurrency, formatProfitLoss, getProfitLossColor } from '@/lib/utils';
import type { GameParticipant } from '@/types/game';

interface ParticipantCardProps {
  participant: GameParticipant;
  isGameActive: boolean;
  onBuyInAdded: () => void;
}

const QUICK_AMOUNTS = [10, 25, 50, 100, 200];

export function ParticipantCard({
  participant,
  isGameActive,
  onBuyInAdded,
}: ParticipantCardProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleQuickBuyIn = async (amount: number) => {
    setError('');
    setIsSubmitting(true);

    const result = await buyInApi.create({
      gameParticipantId: participant._id,
      amount,
    });

    setIsSubmitting(false);

    if (result.success) {
      onBuyInAdded();
    } else {
      setError(result.error);
    }
  };

  const handleCustomBuyIn = async () => {
    setError('');

    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid amount');
      return;
    }

    setIsSubmitting(true);

    const result = await buyInApi.create({
      gameParticipantId: participant._id,
      amount,
    });

    setIsSubmitting(false);

    if (result.success) {
      setCustomAmount('');
      onBuyInAdded();
    } else {
      setError(result.error);
    }
  };

  return (
    <Card variant="outlined" className="relative">
      <div className="space-y-4">
        {/* Player Info */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {participant.playerName}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                {participant.buyInCount} buy-in{participant.buyInCount !== 1 ? 's' : ''}
              </span>
              <span>•</span>
              <span className="font-semibold">
                {formatCurrency(participant.totalBuyIns)}
              </span>
            </div>
          </div>
          <div className="text-right">
            {participant.hasCashedOut ? (
              <Badge variant="success" size="sm">
                Cashed out
              </Badge>
            ) : (
              <p className={`text-lg font-bold ${getProfitLossColor(participant.profitLoss)}`}>
                {formatProfitLoss(participant.profitLoss)}
              </p>
            )}
          </div>
        </div>

        {/* Buy-In Controls - Only for Active Games */}
        {isGameActive && (
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
            {/* Quick Buy-In Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickBuyIn(amount)}
                  disabled={isSubmitting}
                  className={`h-12 rounded-lg font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    amount === 50
                      ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 h-10 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 disabled:opacity-50"
                min="1"
              />
              <button
                onClick={handleCustomBuyIn}
                disabled={isSubmitting || !customAmount}
                className="h-10 px-4 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
