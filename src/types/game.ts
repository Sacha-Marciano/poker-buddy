import type { BalanceStatus, GameStatus } from './index';

/**
 * Base game data
 */
export interface Game {
  _id: string;
  location?: string;
  startTime: string;
  endTime?: string;
  minimumCashoutTime: string;
  status: GameStatus;
  discrepancyNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Game with computed stats (from list endpoint)
 */
export interface GameWithStats {
  _id: string;
  location: string | null;
  startTime: string;
  endTime: string | null;
  status: GameStatus;
  participantCount: number;
  totalBuyIns: number;
  totalCashouts: number;
}

/**
 * Participant in a game with their stats
 */
export interface GameParticipant {
  _id: string;
  playerId: string;
  playerName: string;
  avatarColor?: string;
  joinedAt: string;
  buyInCount: number;
  totalBuyIns: number;
  totalCashouts: number;
  hasCashedOut: boolean;
  profitLoss: number;
}

/**
 * Transaction in a game (buy-in or cashout)
 */
export interface GameTransaction {
  _id: string;
  playerId: string;
  playerName: string;
  amount: number;
  isRebuy?: boolean;
  timestamp: string;
  type: 'BUY_IN' | 'CASHOUT';
}

/**
 * Full game details with participants and transactions
 */
export interface GameDetail {
  _id: string;
  location: string | null;
  startTime: string;
  endTime: string | null;
  minimumCashoutTime: string;
  status: GameStatus;
  discrepancyNotes: string | null;
  totalBuyIns: number;
  totalCashouts: number;
  balanceDiscrepancy: number;
  balanceStatus: BalanceStatus;
  participants: GameParticipant[];
  transactions: GameTransaction[];
  settlements: Settlement[];
}

/**
 * Newly created game (returned from POST)
 */
export interface GameCreated {
  _id: string;
  location: string | null;
  startTime: string;
  minimumCashoutTime: string;
  status: 'IN_PROGRESS';
  createdAt: string;
}

/**
 * Participant added to game (returned from POST)
 */
export interface ParticipantAdded {
  _id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  joinedAt: string;
}

/**
 * Settlement - who owes whom
 */
export interface Settlement {
  _id: string;
  gameId: string;
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
  createdAt: string;
}

/**
 * Game completion result
 */
export interface GameCompleted {
  _id: string;
  status: 'COMPLETED';
  endTime: string;
  discrepancyNotes: string | null;
  settlements: Array<{
    fromPlayerId: string;
    fromPlayerName: string;
    toPlayerId: string;
    toPlayerName: string;
    amount: number;
  }>;
}
