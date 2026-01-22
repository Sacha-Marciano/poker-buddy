'use client';

import { useEffect } from 'react';
import { useGameContext } from '@/contexts/GameContext';

/**
 * Hook to load and manage a specific game
 */
export function useGame(gameId: string | null) {
  const context = useGameContext();

  useEffect(() => {
    if (gameId) {
      context.loadGame(gameId);
    }

    return () => {
      context.clearGame();
    };
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  return context;
}

/**
 * Hook for accessing game context without auto-loading
 */
export function useGameActions() {
  const {
    addParticipant,
    addBuyIn,
    updateBuyIn,
    deleteBuyIn,
    refreshGame,
  } = useGameContext();

  return {
    addParticipant,
    addBuyIn,
    updateBuyIn,
    deleteBuyIn,
    refreshGame,
  };
}

/**
 * Hook for accessing game state only
 */
export function useGameState() {
  const {
    game,
    isLoading,
    error,
    isGameInProgress,
    canCashout,
    pendingBuyIn,
  } = useGameContext();

  return {
    game,
    isLoading,
    error,
    isGameInProgress,
    canCashout,
    pendingBuyIn,
  };
}
