# Phase 5: State Management

## Objective

Implement React Context for managing active game state during gameplay. This enables real-time updates, optimistic UI updates, and centralized game data management without prop drilling.

## Prerequisites

- Phase 4 completed (TypeScript types available)
- Understanding of React Context API

## Scope

### In Scope
- GameContext for active game state
- Custom hooks for accessing game data
- Optimistic updates with rollback
- Error state management
- Loading state management

### Out of Scope
- Global app state (not needed)
- Zustand/Redux (React Context sufficient)
- Real-time WebSocket updates (future enhancement)

## Implementation Details

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/contexts/GameContext.tsx` | Game state context and provider | ~250 |
| `src/hooks/useGame.ts` | Custom hook for game context | ~30 |
| `src/hooks/useApi.ts` | API fetching hooks with SWR pattern | ~100 |

### Game Context (`src/contexts/GameContext.tsx`)

```typescript
'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  GameDetail,
  GameParticipant,
  GameTransaction,
} from '@/types/game';
import type { BuyIn, Cashout } from '@/types/transaction';
import { gameApi, buyInApi, cashoutApi } from '@/lib/api';
import type { BalanceStatus } from '@/types';
import { getBalanceStatus } from '@/lib/utils';

// =====================
// State Types
// =====================

interface GameState {
  game: GameDetail | null;
  isLoading: boolean;
  error: string | null;
  // Optimistic update tracking
  pendingBuyIn: { participantId: string; amount: number } | null;
}

type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GAME'; payload: GameDetail }
  | { type: 'CLEAR_GAME' }
  | { type: 'ADD_PARTICIPANT'; payload: GameParticipant }
  | { type: 'ADD_BUYIN'; payload: { participantId: string; buyIn: GameTransaction } }
  | { type: 'UPDATE_BUYIN'; payload: { buyInId: string; amount: number } }
  | { type: 'REMOVE_BUYIN'; payload: string }
  | { type: 'SET_CASHOUTS'; payload: GameParticipant[] }
  | { type: 'SET_PENDING_BUYIN'; payload: { participantId: string; amount: number } | null };

// =====================
// Reducer
// =====================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_GAME':
      return { ...state, game: action.payload, error: null };

    case 'CLEAR_GAME':
      return { ...state, game: null, error: null };

    case 'ADD_PARTICIPANT': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          participants: [...state.game.participants, action.payload],
        },
      };
    }

    case 'ADD_BUYIN': {
      if (!state.game) return state;
      const { participantId, buyIn } = action.payload;

      // Update participant stats
      const updatedParticipants = state.game.participants.map((p) => {
        if (p._id === participantId) {
          return {
            ...p,
            buyInCount: p.buyInCount + 1,
            totalBuyIns: p.totalBuyIns + buyIn.amount,
            profitLoss: p.totalCashouts - (p.totalBuyIns + buyIn.amount),
          };
        }
        return p;
      });

      // Add to transaction log
      const updatedTransactions = [...state.game.transactions, buyIn].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Recalculate totals
      const totalBuyIns = updatedParticipants.reduce((sum, p) => sum + p.totalBuyIns, 0);
      const totalCashouts = updatedParticipants.reduce(
        (sum, p) => sum + p.totalCashouts,
        0
      );
      const balanceDiscrepancy = totalCashouts - totalBuyIns;

      return {
        ...state,
        game: {
          ...state.game,
          participants: updatedParticipants,
          transactions: updatedTransactions,
          totalBuyIns,
          totalCashouts,
          balanceDiscrepancy,
          balanceStatus: getBalanceStatus(balanceDiscrepancy),
        },
      };
    }

    case 'UPDATE_BUYIN': {
      if (!state.game) return state;
      const { buyInId, amount } = action.payload;

      // Find the old transaction and its participant
      const oldTx = state.game.transactions.find(
        (t) => t._id === buyInId && t.type === 'BUY_IN'
      );
      if (!oldTx) return state;

      const amountDiff = amount - oldTx.amount;

      // Update transaction
      const updatedTransactions = state.game.transactions.map((t) =>
        t._id === buyInId ? { ...t, amount } : t
      );

      // Update participant
      const updatedParticipants = state.game.participants.map((p) => {
        if (p.playerId === oldTx.playerId) {
          const newTotalBuyIns = p.totalBuyIns + amountDiff;
          return {
            ...p,
            totalBuyIns: newTotalBuyIns,
            profitLoss: p.totalCashouts - newTotalBuyIns,
          };
        }
        return p;
      });

      const totalBuyIns = updatedParticipants.reduce((sum, p) => sum + p.totalBuyIns, 0);
      const totalCashouts = updatedParticipants.reduce(
        (sum, p) => sum + p.totalCashouts,
        0
      );
      const balanceDiscrepancy = totalCashouts - totalBuyIns;

      return {
        ...state,
        game: {
          ...state.game,
          participants: updatedParticipants,
          transactions: updatedTransactions,
          totalBuyIns,
          totalCashouts,
          balanceDiscrepancy,
          balanceStatus: getBalanceStatus(balanceDiscrepancy),
        },
      };
    }

    case 'REMOVE_BUYIN': {
      if (!state.game) return state;
      const buyInId = action.payload;

      // Find the transaction to remove
      const txToRemove = state.game.transactions.find(
        (t) => t._id === buyInId && t.type === 'BUY_IN'
      );
      if (!txToRemove) return state;

      // Remove from transactions
      const updatedTransactions = state.game.transactions.filter(
        (t) => t._id !== buyInId
      );

      // Update participant
      const updatedParticipants = state.game.participants.map((p) => {
        if (p.playerId === txToRemove.playerId) {
          const newTotalBuyIns = p.totalBuyIns - txToRemove.amount;
          return {
            ...p,
            buyInCount: p.buyInCount - 1,
            totalBuyIns: newTotalBuyIns,
            profitLoss: p.totalCashouts - newTotalBuyIns,
          };
        }
        return p;
      });

      const totalBuyIns = updatedParticipants.reduce((sum, p) => sum + p.totalBuyIns, 0);
      const totalCashouts = updatedParticipants.reduce(
        (sum, p) => sum + p.totalCashouts,
        0
      );
      const balanceDiscrepancy = totalCashouts - totalBuyIns;

      return {
        ...state,
        game: {
          ...state.game,
          participants: updatedParticipants,
          transactions: updatedTransactions,
          totalBuyIns,
          totalCashouts,
          balanceDiscrepancy,
          balanceStatus: getBalanceStatus(balanceDiscrepancy),
        },
      };
    }

    case 'SET_CASHOUTS': {
      if (!state.game) return state;

      // Replace participants with updated cashout data
      const totalBuyIns = action.payload.reduce((sum, p) => sum + p.totalBuyIns, 0);
      const totalCashouts = action.payload.reduce((sum, p) => sum + p.totalCashouts, 0);
      const balanceDiscrepancy = totalCashouts - totalBuyIns;

      return {
        ...state,
        game: {
          ...state.game,
          participants: action.payload,
          totalBuyIns,
          totalCashouts,
          balanceDiscrepancy,
          balanceStatus: getBalanceStatus(balanceDiscrepancy),
        },
      };
    }

    case 'SET_PENDING_BUYIN':
      return { ...state, pendingBuyIn: action.payload };

    default:
      return state;
  }
}

// =====================
// Context
// =====================

interface GameContextValue {
  // State
  game: GameDetail | null;
  isLoading: boolean;
  error: string | null;
  pendingBuyIn: { participantId: string; amount: number } | null;

  // Computed
  isGameInProgress: boolean;
  canCashout: boolean;

  // Actions
  loadGame: (gameId: string) => Promise<void>;
  clearGame: () => void;
  addParticipant: (playerId: string) => Promise<boolean>;
  addBuyIn: (participantId: string, amount: number) => Promise<boolean>;
  updateBuyIn: (buyInId: string, amount: number) => Promise<boolean>;
  deleteBuyIn: (buyInId: string) => Promise<boolean>;
  refreshGame: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

// =====================
// Provider
// =====================

const initialState: GameState = {
  game: null,
  isLoading: false,
  error: null,
  pendingBuyIn: null,
};

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load game data
  const loadGame = useCallback(async (gameId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    const result = await gameApi.getById(gameId);

    if (result.success) {
      dispatch({ type: 'SET_GAME', payload: result.data });
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.error });
    }

    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  // Clear game state
  const clearGame = useCallback(() => {
    dispatch({ type: 'CLEAR_GAME' });
  }, []);

  // Refresh current game
  const refreshGame = useCallback(async () => {
    if (state.game) {
      await loadGame(state.game._id);
    }
  }, [state.game, loadGame]);

  // Add participant to game
  const addParticipant = useCallback(
    async (playerId: string): Promise<boolean> => {
      if (!state.game) return false;

      const result = await gameApi.addParticipant(state.game._id, { playerId });

      if (result.success) {
        dispatch({
          type: 'ADD_PARTICIPANT',
          payload: {
            _id: result.data._id,
            playerId: result.data.playerId,
            playerName: result.data.playerName,
            joinedAt: result.data.joinedAt,
            buyInCount: 0,
            totalBuyIns: 0,
            totalCashouts: 0,
            hasCashedOut: false,
            profitLoss: 0,
          },
        });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
        return false;
      }
    },
    [state.game]
  );

  // Add buy-in
  const addBuyIn = useCallback(
    async (participantId: string, amount: number): Promise<boolean> => {
      if (!state.game) return false;

      // Find participant for player info
      const participant = state.game.participants.find((p) => p._id === participantId);
      if (!participant) return false;

      // Set pending for optimistic UI (optional)
      dispatch({
        type: 'SET_PENDING_BUYIN',
        payload: { participantId, amount },
      });

      const result = await buyInApi.create({
        gameParticipantId: participantId,
        amount,
      });

      dispatch({ type: 'SET_PENDING_BUYIN', payload: null });

      if (result.success) {
        dispatch({
          type: 'ADD_BUYIN',
          payload: {
            participantId,
            buyIn: {
              _id: result.data._id,
              playerId: participant.playerId,
              playerName: participant.playerName,
              amount: result.data.amount,
              timestamp: result.data.timestamp,
              type: 'BUY_IN',
            },
          },
        });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
        return false;
      }
    },
    [state.game]
  );

  // Update buy-in
  const updateBuyIn = useCallback(
    async (buyInId: string, amount: number): Promise<boolean> => {
      const result = await buyInApi.update(buyInId, { amount });

      if (result.success) {
        dispatch({
          type: 'UPDATE_BUYIN',
          payload: { buyInId, amount },
        });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
        return false;
      }
    },
    []
  );

  // Delete buy-in
  const deleteBuyIn = useCallback(async (buyInId: string): Promise<boolean> => {
    const result = await buyInApi.delete(buyInId);

    if (result.success) {
      dispatch({ type: 'REMOVE_BUYIN', payload: buyInId });
      return true;
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.error });
      return false;
    }
  }, []);

  // Computed values
  const isGameInProgress = state.game?.status === 'IN_PROGRESS';

  const canCashout = useMemo(() => {
    if (!state.game || state.game.status !== 'IN_PROGRESS') return false;
    const now = new Date();
    const minTime = new Date(state.game.minimumCashoutTime);
    return now >= minTime;
  }, [state.game]);

  const value: GameContextValue = {
    game: state.game,
    isLoading: state.isLoading,
    error: state.error,
    pendingBuyIn: state.pendingBuyIn,
    isGameInProgress,
    canCashout,
    loadGame,
    clearGame,
    addParticipant,
    addBuyIn,
    updateBuyIn,
    deleteBuyIn,
    refreshGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// =====================
// Hook
// =====================

export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
```

### Custom Game Hook (`src/hooks/useGame.ts`)

```typescript
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
```

### API Fetching Hooks (`src/hooks/useApi.ts`)

```typescript
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
```

### Update Root Layout

Add the GameProvider to the root layout when needed. However, since it's only used on game pages, we can add it at a lower level.

```typescript
// src/app/games/[id]/layout.tsx
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

## Error Handling

| Error Condition | Expected Behavior | User Feedback |
|-----------------|-------------------|---------------|
| Game not found | loadGame sets error | "Game not found" displayed |
| API call fails | Action returns false, error set | Toast/alert with error message |
| Network error | Caught and set as error | "Network error" displayed |
| Invalid game ID | API returns 400 | "Invalid game ID" displayed |

## Expected Results

After completing this phase:
1. GameContext manages all game state
2. Optimistic updates for smooth UX
3. Loading states for async operations
4. Error states properly propagated
5. Custom hooks simplify component logic

## Validation Steps

1. Create a test component that uses `useGameContext`
2. Verify game loads correctly
3. Test adding a buy-in and verify state updates
4. Test error handling with invalid data
5. Run `npm run build` to verify everything compiles

### Test Component

```typescript
// Temporary test: src/app/test-context/page.tsx
'use client';

import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { useEffect } from 'react';

function TestContent() {
  const { game, isLoading, error, loadGame } = useGameContext();

  useEffect(() => {
    // Replace with a real game ID for testing
    loadGame('GAME_ID_HERE');
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!game) return <div>No game loaded</div>;

  return (
    <div>
      <h1>Game: {game._id}</h1>
      <p>Status: {game.status}</p>
      <p>Participants: {game.participants.length}</p>
      <p>Total Buy-ins: {game.totalBuyIns}</p>
    </div>
  );
}

export default function TestContextPage() {
  return (
    <GameProvider>
      <TestContent />
    </GameProvider>
  );
}
```

## Success Criteria

- [ ] `src/contexts/GameContext.tsx` created with full functionality
- [ ] `src/hooks/useGame.ts` created with custom hooks
- [ ] `src/hooks/useApi.ts` created with API hooks
- [ ] GameContext correctly manages game state
- [ ] Add/update/delete buy-ins work correctly
- [ ] Loading and error states work properly
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

## Potential Issues

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Context not available | "must be used within Provider" error | Ensure Provider wraps component tree |
| Stale closure in callbacks | Actions use old state | Use useCallback with correct deps |
| Excessive re-renders | Performance issues | Memoize context value, split contexts |
| Race conditions | Inconsistent state | Use loading flags, cancel pending requests |

---

**Phase Dependencies**: Phase 4
**Next Phase**: Phase 6 - UI Components
