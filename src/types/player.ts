/**
 * Base player data (without computed fields)
 */
export interface Player {
  _id: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Player with computed statistics (from list endpoint)
 */
export interface PlayerWithStats {
  _id: string;
  name: string;
  totalGamesPlayed: number;
  totalBuyIns: number;
  totalCashouts: number;
  totalProfitLoss: number;
}

/**
 * Game participation record for a player
 */
export interface PlayerGameRecord {
  gameId: string;
  date: string;
  location: string | null;
  buyIns: number;
  cashout: number;
  profitLoss: number;
}

/**
 * Full player details with statistics and game history
 */
export interface PlayerDetail {
  _id: string;
  name: string;
  totalGamesPlayed: number;
  totalBuyIns: number;
  totalCashouts: number;
  totalProfitLoss: number;
  averageProfitPerSession: number | null;
  biggestWin: number | null;
  biggestLoss: number | null;
  games: PlayerGameRecord[];
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalGamesPlayed: number;
  totalBuyIns: number;
  totalCashouts: number;
  totalProfitLoss: number;
  averageProfitPerSession: number | null;
}
