'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApiResult } from '@/types/api';

/**
 * Generic hook for API fetching with loading and error states
 */
export function useApiQuery<T>(
  fetcher: () => Promise<ApiResult<T>>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetcher();

    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook for API mutations (POST, PATCH, DELETE)
 */
export function useApiMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<ApiResult<TOutput>>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<ApiResult<TOutput>> => {
      setIsLoading(true);
      setError(null);

      const result = await mutationFn(input);

      if (!result.success) {
        setError(result.error);
      }

      setIsLoading(false);
      return result;
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { mutate, isLoading, error, reset };
}

// =====================
// Specific API Hooks
// =====================

import { playerApi, gameApi, leaderboardApi } from '@/lib/api';
import type { PlayerWithStats, PlayerDetail, LeaderboardEntry } from '@/types/player';
import type { GameWithStats } from '@/types/game';

/**
 * Hook for fetching all players
 */
export function usePlayers() {
  return useApiQuery<PlayerWithStats[]>(() => playerApi.getAll(), []);
}

/**
 * Hook for fetching a single player
 */
export function usePlayer(playerId: string | null) {
  return useApiQuery<PlayerDetail>(
    async () => {
      if (!playerId) {
        return { success: false, error: 'No player ID provided' };
      }
      return playerApi.getById(playerId);
    },
    [playerId]
  );
}

/**
 * Hook for fetching games with optional status filter
 */
export function useGames(status?: 'IN_PROGRESS' | 'COMPLETED') {
  return useApiQuery<GameWithStats[]>(() => gameApi.getAll(status), [status]);
}

/**
 * Hook for fetching active games only
 */
export function useActiveGames() {
  return useGames('IN_PROGRESS');
}

/**
 * Hook for fetching completed games only
 */
export function useCompletedGames() {
  return useGames('COMPLETED');
}

/**
 * Hook for fetching leaderboard
 */
export function useLeaderboard() {
  return useApiQuery<LeaderboardEntry[]>(() => leaderboardApi.get(), []);
}
