# Phase 4: Shared Types and Zod Schemas

## Objective

Create TypeScript types and Zod validation schemas that are shared between client and server. This ensures type safety across the entire application and enables runtime validation on both sides.

## Prerequisites

- Phase 1 completed (Zod installed)
- Phase 2 completed (understanding of data models)
- Phase 3 completed (understanding of API responses)

## Scope

### In Scope
- TypeScript interface definitions for all entities
- Zod schemas for request validation
- API response type definitions
- Utility types for common patterns

### Out of Scope
- Mongoose schema types (defined in models)
- Component prop types (Phase 6)
- Context types (Phase 5)

## Implementation Details

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/types/index.ts` | Main type exports | ~20 |
| `src/types/player.ts` | Player types | ~50 |
| `src/types/game.ts` | Game and participant types | ~100 |
| `src/types/transaction.ts` | Buy-in and cashout types | ~50 |
| `src/types/api.ts` | API request/response types | ~80 |
| `src/schemas/index.ts` | Schema exports | ~10 |
| `src/schemas/player.ts` | Player validation schemas | ~30 |
| `src/schemas/game.ts` | Game validation schemas | ~40 |
| `src/schemas/transaction.ts` | Transaction validation schemas | ~50 |

### Type Definitions

#### `src/types/index.ts`

```typescript
// Re-export all types
export * from './player';
export * from './game';
export * from './transaction';
export * from './api';

// Common utility types
export type WithId<T> = T & { _id: string };

export type BalanceStatus = 'GREEN' | 'YELLOW' | 'RED';

export type GameStatus = 'IN_PROGRESS' | 'COMPLETED';
```

#### `src/types/player.ts`

```typescript
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
```

#### `src/types/game.ts`

```typescript
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
 * Game completion result
 */
export interface GameCompleted {
  _id: string;
  status: 'COMPLETED';
  endTime: string;
  discrepancyNotes: string | null;
}
```

#### `src/types/transaction.ts`

```typescript
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
```

#### `src/types/api.ts`

```typescript
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
  discrepancyNotes?: string;
}
```

### Zod Validation Schemas

#### `src/schemas/index.ts`

```typescript
// Re-export all schemas
export * from './player';
export * from './game';
export * from './transaction';
```

#### `src/schemas/player.ts`

```typescript
import { z } from 'zod';

/**
 * Schema for creating a player
 */
export const createPlayerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
});

/**
 * Schema for updating a player
 */
export const updatePlayerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
});

/**
 * Inferred types from schemas
 */
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
```

#### `src/schemas/game.ts`

```typescript
import { z } from 'zod';

/**
 * Schema for creating a game
 */
export const createGameSchema = z.object({
  location: z
    .string()
    .max(100, 'Location cannot exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  startTime: z.string().datetime('Invalid start time format'),
  minimumCashoutTime: z.string().datetime('Invalid minimum cashout time format'),
});

/**
 * Schema for completing a game
 */
export const completeGameSchema = z.object({
  discrepancyNotes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for adding a participant
 */
export const addParticipantSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
});

/**
 * Inferred types from schemas
 */
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type CompleteGameInput = z.infer<typeof completeGameSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
```

#### `src/schemas/transaction.ts`

```typescript
import { z } from 'zod';

/**
 * Amount validation (shared)
 */
const amountSchema = z
  .number()
  .int('Amount must be a whole number')
  .min(1, 'Amount must be at least 1')
  .max(1000000, 'Amount cannot exceed 1,000,000');

/**
 * Cashout amount validation (allows 0)
 */
const cashoutAmountSchema = z
  .number()
  .int('Amount must be a whole number')
  .min(0, 'Amount cannot be negative')
  .max(1000000, 'Amount cannot exceed 1,000,000');

/**
 * Schema for creating a buy-in
 */
export const createBuyInSchema = z.object({
  gameParticipantId: z.string().min(1, 'Game participant ID is required'),
  amount: amountSchema,
  timestamp: z.string().datetime().optional(),
});

/**
 * Schema for updating a buy-in
 */
export const updateBuyInSchema = z.object({
  amount: amountSchema,
});

/**
 * Single cashout item in batch
 */
const cashoutItemSchema = z.object({
  gameParticipantId: z.string().min(1, 'Game participant ID is required'),
  amount: cashoutAmountSchema,
});

/**
 * Schema for creating cashouts (batch)
 */
export const createCashoutsSchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
  cashouts: z.array(cashoutItemSchema).min(1, 'At least one cashout is required'),
});

/**
 * Inferred types from schemas
 */
export type CreateBuyInInput = z.infer<typeof createBuyInSchema>;
export type UpdateBuyInInput = z.infer<typeof updateBuyInSchema>;
export type CreateCashoutsInput = z.infer<typeof createCashoutsSchema>;
export type CashoutItem = z.infer<typeof cashoutItemSchema>;
```

### API Client Helper (`src/lib/api.ts`)

```typescript
import type { ApiResult, FetchOptions } from '@/types/api';

const API_BASE = '/api';

/**
 * Generic API fetch wrapper with error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResult<T>> {
  try {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error ${response.status}`,
      };
    }

    return { success: true, data: data as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// =====================
// Player API
// =====================

import type {
  PlayerWithStats,
  PlayerDetail,
  Player,
  LeaderboardEntry,
} from '@/types/player';
import type { CreatePlayerRequest, UpdatePlayerRequest, ApiMessage } from '@/types/api';

export const playerApi = {
  getAll: () => apiFetch<PlayerWithStats[]>('/players'),

  getById: (id: string) => apiFetch<PlayerDetail>(`/players/${id}`),

  create: (data: CreatePlayerRequest) =>
    apiFetch<Player>('/players', { method: 'POST', body: data }),

  update: (id: string, data: UpdatePlayerRequest) =>
    apiFetch<Player>(`/players/${id}`, { method: 'PATCH', body: data }),

  delete: (id: string) =>
    apiFetch<ApiMessage>(`/players/${id}`, { method: 'DELETE' }),
};

// =====================
// Game API
// =====================

import type {
  GameWithStats,
  GameDetail,
  GameCreated,
  ParticipantAdded,
  GameCompleted,
} from '@/types/game';
import type {
  CreateGameRequest,
  AddParticipantRequest,
  CompleteGameRequest,
} from '@/types/api';

export const gameApi = {
  getAll: (status?: 'IN_PROGRESS' | 'COMPLETED') => {
    const query = status ? `?status=${status}` : '';
    return apiFetch<GameWithStats[]>(`/games${query}`);
  },

  getById: (id: string) => apiFetch<GameDetail>(`/games/${id}`),

  create: (data: CreateGameRequest) =>
    apiFetch<GameCreated>('/games', { method: 'POST', body: data }),

  addParticipant: (gameId: string, data: AddParticipantRequest) =>
    apiFetch<ParticipantAdded>(`/games/${gameId}/participants`, {
      method: 'POST',
      body: data,
    }),

  complete: (id: string, data: CompleteGameRequest) =>
    apiFetch<GameCompleted>(`/games/${id}/complete`, {
      method: 'PATCH',
      body: data,
    }),
};

// =====================
// Buy-In API
// =====================

import type { BuyIn, BuyInUpdated } from '@/types/transaction';
import type {
  CreateBuyInRequest,
  UpdateBuyInRequest,
} from '@/types/api';

export const buyInApi = {
  create: (data: CreateBuyInRequest) =>
    apiFetch<BuyIn>('/buy-ins', { method: 'POST', body: data }),

  update: (id: string, data: UpdateBuyInRequest) =>
    apiFetch<BuyInUpdated>(`/buy-ins/${id}`, { method: 'PATCH', body: data }),

  delete: (id: string) =>
    apiFetch<ApiMessage>(`/buy-ins/${id}`, { method: 'DELETE' }),
};

// =====================
// Cashout API
// =====================

import type { Cashout } from '@/types/transaction';
import type { CreateCashoutsRequest } from '@/types/api';

export const cashoutApi = {
  createBatch: (data: CreateCashoutsRequest) =>
    apiFetch<Cashout[]>('/cashouts', { method: 'POST', body: data }),
};

// =====================
// Leaderboard API
// =====================

export const leaderboardApi = {
  get: () => apiFetch<LeaderboardEntry[]>('/leaderboard'),
};
```

## Error Handling

| Error Condition | Expected Behavior | User Feedback |
|-----------------|-------------------|---------------|
| Zod validation fails | Returns detailed message | Form shows field-specific error |
| API returns error | ApiResult.success = false | UI shows error message |
| Network failure | Caught in try-catch | "Network error" displayed |
| Invalid JSON | Caught in try-catch | Generic error displayed |

## Expected Results

After completing this phase:
1. All TypeScript types defined and exported
2. Zod schemas available for client-side validation
3. API client helpers ready for use in components
4. Full type safety across client-server boundary
5. Consistent error handling pattern

## Validation Steps

1. Import types in a test file - should compile without errors
2. Use Zod schemas to validate sample data
3. Verify API client functions have correct types
4. Run `npm run type-check` or `tsc --noEmit`
5. Run `npm run build` to verify everything compiles

### Type Check Script

```bash
# Add to package.json scripts:
"type-check": "tsc --noEmit"

# Run:
npm run type-check
```

### Schema Validation Test

```typescript
// Test file: src/test-schemas.ts (temporary)
import { createPlayerSchema, createGameSchema, createBuyInSchema } from '@/schemas';

// Valid player
console.log(createPlayerSchema.parse({ name: 'John' }));
// Output: { name: 'John' }

// Invalid player (should throw)
try {
  createPlayerSchema.parse({ name: '' });
} catch (e) {
  console.log('Validation works:', e);
}

// Valid game
console.log(
  createGameSchema.parse({
    startTime: new Date().toISOString(),
    minimumCashoutTime: new Date().toISOString(),
  })
);

// Valid buy-in
console.log(
  createBuyInSchema.parse({
    gameParticipantId: '507f1f77bcf86cd799439011',
    amount: 100,
  })
);
```

## Success Criteria

- [ ] `src/types/index.ts` created with all exports
- [ ] `src/types/player.ts` created with player types
- [ ] `src/types/game.ts` created with game types
- [ ] `src/types/transaction.ts` created with transaction types
- [ ] `src/types/api.ts` created with API types
- [ ] `src/schemas/index.ts` created with all exports
- [ ] `src/schemas/player.ts` created with validation schemas
- [ ] `src/schemas/game.ts` created with validation schemas
- [ ] `src/schemas/transaction.ts` created with validation schemas
- [ ] `src/lib/api.ts` created with API client helpers
- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds

## Potential Issues

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Circular imports | Build error | Use index.ts for centralized exports |
| Type mismatch with API | Runtime errors | Verify types match actual API responses |
| Zod schema too strict | Valid data rejected | Adjust schema constraints |
| Missing optional fields | TypeScript errors | Use `?` or `.optional()` appropriately |

---

**Phase Dependencies**: Phase 1, Phase 2, Phase 3
**Next Phase**: Phase 5 - State Management
