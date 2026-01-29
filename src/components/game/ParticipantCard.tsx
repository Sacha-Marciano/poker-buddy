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
  const [optimisticBuyIns, setOptimisticBuyIns] = useState(0);
  const [loadingButton, setLoadingButton] = useState<number | null>(null);

  const handleQuickBuyIn = async (amount: number) => {
    setError('');
    setLoadingButton(amount);

    // Optimistically update the UI
    setOptimisticBuyIns(prev => prev + amount);

    const result = await buyInApi.create({
      gameParticipantId: participant._id,
      amount,
    });

    setLoadingButton(null);

    if (result.success) {
      // Clear optimistic state and refresh from server
      setOptimisticBuyIns(0);
      onBuyInAdded();
    } else {
      // Revert optimistic update on error
      setOptimisticBuyIns(prev => prev - amount);
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

    // Optimistically update the UI
    setOptimisticBuyIns(prev => prev + amount);

    const result = await buyInApi.create({
      gameParticipantId: participant._id,
      amount,
    });

    setIsSubmitting(false);

    if (result.success) {
      setCustomAmount('');
      // Clear optimistic state and refresh from server
      setOptimisticBuyIns(0);
      onBuyInAdded();
    } else {
      // Revert optimistic update on error
      setOptimisticBuyIns(prev => prev - amount);
      setError(result.error);
    }
  };

  const displayTotal = participant.totalBuyIns + optimisticBuyIns;
  const displayCount = participant.buyInCount + (optimisticBuyIns > 0 ? 1 : 0);

  return (
    <Card variant="outlined" className="relative">
      <div className="space-y-4">
        {/* Player Info */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-10 h-10 rounded-full shrink-0"
              style={{ backgroundColor: participant.avatarColor || '#6B7280' }}
            />
            <div className="flex-1">
            <h3 className="text-xl font-bold text-[#e8e0d4]">
              {participant.playerName}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-[#9a9088]">
              <span className={optimisticBuyIns > 0 ? 'opacity-60' : ''}>
                {displayCount} buy-in{displayCount !== 1 ? 's' : ''}
              </span>
              <span>•</span>
              <span className={`font-semibold ${optimisticBuyIns > 0 ? 'opacity-60' : ''}`}>
                {formatCurrency(displayTotal)}
              </span>
              {optimisticBuyIns > 0 && (
                <span className="text-[#d4a03c] text-xs">
                  Saving...
                </span>
              )}
            </div>
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
          <div className="pt-4 border-t border-[#3a3530] space-y-3">
            {/* Quick Buy-In Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickBuyIn(amount)}
                  disabled={loadingButton !== null}
                  className={`h-12 rounded-xl font-bold text-base transition-all duration-200 disabled:cursor-not-allowed relative border ${
                    amount === 50
                      ? 'bg-[#2d6b3f] text-white border-[#3a8a52]/50 hover:bg-[#3a8a52] hover:shadow-md'
                      : 'bg-[#2e2e2e] text-[#e8e0d4] border-[#3a3530] hover:border-[#2d6b3f] hover:bg-[#3a3530]'
                  } ${loadingButton === amount ? 'opacity-60' : ''}`}
                >
                  {loadingButton === amount ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  ) : (
                    amount
                  )}
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
                className="flex-1 h-10 px-3 rounded-lg border border-[#3a3530] bg-[#2e2e2e] text-[#e8e0d4] placeholder:text-[#9a9088] disabled:opacity-50"
                min="1"
              />
              <button
                onClick={handleCustomBuyIn}
                disabled={isSubmitting || !customAmount}
                className="h-10 px-4 rounded-lg bg-[#2e2e2e] text-[#e8e0d4] font-medium hover:bg-[#3a3530] border border-[#3a3530] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {error && (
              <p className="text-[#c0392b] text-sm">{error}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
