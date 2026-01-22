/**
 * Buy-in record
 */
export interface BuyIn {
  _id: string;
  gameParticipantId: string;
  amount: number;
  timestamp: string;
  createdAt: string;
}

/**
 * Cashout record
 */
export interface Cashout {
  _id: string;
  gameParticipantId: string;
  amount: number;
  timestamp: string;
  createdAt: string;
}

/**
 * Buy-in update result
 */
export interface BuyInUpdated {
  _id: string;
  amount: number;
  timestamp: string;
}

/**
 * Cashout input for batch creation
 */
export interface CashoutInput {
  gameParticipantId: string;
  amount: number;
}
