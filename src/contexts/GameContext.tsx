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
import { gameApi, buyInApi } from '@/lib/api';
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
