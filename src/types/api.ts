/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
}

/**
 * Standard success message response
 */
export interface ApiMessage {
  message: string;
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ApiError).error === 'string'
  );
}

/**
 * API fetch options
 */
export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * API result wrapper for error handling
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Create player request
 */
export interface CreatePlayerRequest {
  name: string;
}

/**
 * Update player request
 */
export interface UpdatePlayerRequest {
  name: string;
}

/**
 * Create game request
 */
export interface CreateGameRequest {
  location?: string;
  startTime: string;
  minimumCashoutTime: string;
}

/**
 * Add participant request
 */
export interface AddParticipantRequest {
  playerId: string;
}

/**
 * Create buy-in request
 */
export interface CreateBuyInRequest {
  gameParticipantId: string;
  amount: number;
  timestamp?: string;
}

/**
 * Update buy-in request
 */
export interface UpdateBuyInRequest {
  amount: number;
}

/**
 * Create cashouts request (batch)
 */
export interface CreateCashoutsRequest {
  gameId: string;
  cashouts: Array<{
    gameParticipantId: string;
    amount: number;
  }>;
}

/**
 * Complete game request
 */
export interface CompleteGameRequest {
  cashouts: Array<{
    gameParticipantId: string;
    amount: number;
  }>;
  discrepancyNotes?: string;
}
