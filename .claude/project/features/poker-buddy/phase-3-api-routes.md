# Phase 3: API Routes

## Objective

Implement all Next.js API route handlers for CRUD operations on players, games, buy-ins, cashouts, and the leaderboard. Each route must connect to MongoDB, validate inputs, and return proper HTTP responses.

## Prerequisites

- Phase 1 completed (MongoDB connection)
- Phase 2 completed (Mongoose models)

## Scope

### In Scope
- All API endpoints from specification
- Input validation using Zod schemas
- Error handling with appropriate status codes
- MongoDB aggregation for computed fields
- Game completion logic with balance calculation

### Out of Scope
- Client-side code (Phase 5-7)
- Authentication (not required per spec)
- Rate limiting (future enhancement)

## Implementation Details

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/app/api/players/route.ts` | GET all, POST create player | ~80 |
| `src/app/api/players/[id]/route.ts` | GET one, PATCH, DELETE player | ~100 |
| `src/app/api/games/route.ts` | GET all, POST create game | ~90 |
| `src/app/api/games/[id]/route.ts` | GET game details | ~150 |
| `src/app/api/games/[id]/complete/route.ts` | PATCH complete game | ~80 |
| `src/app/api/games/[id]/participants/route.ts` | POST add participant | ~70 |
| `src/app/api/buy-ins/route.ts` | POST create buy-in | ~80 |
| `src/app/api/buy-ins/[id]/route.ts` | PATCH, DELETE buy-in | ~100 |
| `src/app/api/cashouts/route.ts` | POST create cashout(s) | ~100 |
| `src/app/api/leaderboard/route.ts` | GET leaderboard | ~80 |
| `src/lib/api-helpers.ts` | Shared helpers for API routes | ~50 |

### API Helper Functions (`src/lib/api-helpers.ts`)

```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function handleError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => e.message).join(', ');
    return errorResponse(`Validation error: ${messages}`, 400);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors)
      .map((e) => e.message)
      .join(', ');
    return errorResponse(messages, 400);
  }

  if (error instanceof mongoose.Error.CastError) {
    return errorResponse('Invalid ID format', 400);
  }

  // MongoDB duplicate key error
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  ) {
    return errorResponse('Duplicate entry - record already exists', 409);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse('Internal server error', 500);
}

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}
```

### Players API

#### `src/app/api/players/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Player, GameParticipant, BuyIn, Cashout } from '@/models';
import { errorResponse, successResponse, handleError } from '@/lib/api-helpers';
import { z } from 'zod';

const createPlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').trim(),
});

// GET /api/players - Get all active players with stats
export async function GET() {
  try {
    await connectDB();

    const players = await Player.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: 'gameParticipants',
          localField: '_id',
          foreignField: 'playerId',
          as: 'participations',
        },
      },
      {
        $lookup: {
          from: 'buyIns',
          localField: 'participations._id',
          foreignField: 'gameParticipantId',
          as: 'buyIns',
        },
      },
      {
        $lookup: {
          from: 'cashouts',
          localField: 'participations._id',
          foreignField: 'gameParticipantId',
          as: 'cashouts',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          totalGamesPlayed: { $size: '$participations' },
          totalBuyIns: { $sum: '$buyIns.amount' },
          totalCashouts: { $sum: '$cashouts.amount' },
          totalProfitLoss: {
            $subtract: [{ $sum: '$cashouts.amount' }, { $sum: '$buyIns.amount' }],
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    return successResponse(players);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/players - Create new player
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name } = createPlayerSchema.parse(body);

    // Check if name already exists (case-insensitive)
    const existing = await Player.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existing) {
      return errorResponse('Player name already exists', 400);
    }

    const player = await Player.create({ name });

    return successResponse(player, 201);
  } catch (error) {
    return handleError(error);
  }
}
```

#### `src/app/api/players/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Player, GameParticipant, BuyIn, Cashout, Game } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';
import { z } from 'zod';

const updatePlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').trim(),
});

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/players/[id] - Get player with full statistics
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid player ID', 400);
    }

    await connectDB();

    const player = await Player.findById(id);
    if (!player || player.isDeleted) {
      return errorResponse('Player not found', 404);
    }

    // Get player statistics via aggregation
    const stats = await GameParticipant.aggregate([
      { $match: { playerId: player._id } },
      {
        $lookup: {
          from: 'games',
          localField: 'gameId',
          foreignField: '_id',
          as: 'game',
        },
      },
      { $unwind: '$game' },
      {
        $lookup: {
          from: 'buyIns',
          localField: '_id',
          foreignField: 'gameParticipantId',
          as: 'buyIns',
        },
      },
      {
        $lookup: {
          from: 'cashouts',
          localField: '_id',
          foreignField: 'gameParticipantId',
          as: 'cashouts',
        },
      },
      {
        $project: {
          gameId: '$game._id',
          date: '$game.startTime',
          location: '$game.location',
          status: '$game.status',
          buyIns: { $sum: '$buyIns.amount' },
          cashout: { $ifNull: [{ $arrayElemAt: ['$cashouts.amount', 0] }, 0] },
          profitLoss: {
            $subtract: [
              { $ifNull: [{ $arrayElemAt: ['$cashouts.amount', 0] }, 0] },
              { $sum: '$buyIns.amount' },
            ],
          },
        },
      },
      { $sort: { date: -1 } },
    ]);

    const totalGamesPlayed = stats.length;
    const totalBuyIns = stats.reduce((sum, g) => sum + g.buyIns, 0);
    const totalCashouts = stats.reduce((sum, g) => sum + g.cashout, 0);
    const totalProfitLoss = totalCashouts - totalBuyIns;
    const averageProfitPerSession =
      totalGamesPlayed > 0 ? Math.round(totalProfitLoss / totalGamesPlayed) : null;

    const completedGames = stats.filter((g) => g.status === 'COMPLETED');
    const biggestWin =
      completedGames.length > 0
        ? Math.max(...completedGames.map((g) => g.profitLoss))
        : null;
    const biggestLoss =
      completedGames.length > 0
        ? Math.min(...completedGames.map((g) => g.profitLoss))
        : null;

    return successResponse({
      _id: player._id,
      name: player.name,
      totalGamesPlayed,
      totalBuyIns,
      totalCashouts,
      totalProfitLoss,
      averageProfitPerSession,
      biggestWin: biggestWin !== null && biggestWin > 0 ? biggestWin : null,
      biggestLoss: biggestLoss !== null && biggestLoss < 0 ? biggestLoss : null,
      games: stats.map((g) => ({
        gameId: g.gameId,
        date: g.date,
        location: g.location,
        buyIns: g.buyIns,
        cashout: g.cashout,
        profitLoss: g.profitLoss,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/players/[id] - Update player name
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid player ID', 400);
    }

    await connectDB();

    const body = await request.json();
    const { name } = updatePlayerSchema.parse(body);

    const player = await Player.findById(id);
    if (!player || player.isDeleted) {
      return errorResponse('Player not found', 404);
    }

    // Check if new name already exists (excluding current player)
    const existing = await Player.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existing) {
      return errorResponse('Player name already exists', 400);
    }

    player.name = name;
    await player.save();

    return successResponse({
      _id: player._id,
      name: player.name,
      updatedAt: player.updatedAt,
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/players/[id] - Soft delete player
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid player ID', 400);
    }

    await connectDB();

    const player = await Player.findById(id);
    if (!player || player.isDeleted) {
      return errorResponse('Player not found', 404);
    }

    player.isDeleted = true;
    await player.save();

    return successResponse({ message: 'Player deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
```

### Games API

#### `src/app/api/games/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game, GameParticipant, BuyIn, Cashout } from '@/models';
import { errorResponse, successResponse, handleError } from '@/lib/api-helpers';
import { z } from 'zod';

const createGameSchema = z.object({
  location: z.string().max(100, 'Location too long').trim().optional(),
  startTime: z.string().datetime(),
  minimumCashoutTime: z.string().datetime(),
});

// GET /api/games - Get all games with optional status filter
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const filter: Record<string, string> = {};
    if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
      filter.status = status;
    }

    const games = await Game.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'gameParticipants',
          localField: '_id',
          foreignField: 'gameId',
          as: 'participants',
        },
      },
      {
        $lookup: {
          from: 'buyIns',
          localField: 'participants._id',
          foreignField: 'gameParticipantId',
          as: 'buyIns',
        },
      },
      {
        $lookup: {
          from: 'cashouts',
          localField: 'participants._id',
          foreignField: 'gameParticipantId',
          as: 'cashouts',
        },
      },
      {
        $project: {
          _id: 1,
          location: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          participantCount: { $size: '$participants' },
          totalBuyIns: { $sum: '$buyIns.amount' },
          totalCashouts: { $sum: '$cashouts.amount' },
        },
      },
      { $sort: { startTime: -1 } },
    ]);

    return successResponse(games);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/games - Create new game
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const data = createGameSchema.parse(body);

    const startTime = new Date(data.startTime);
    const minimumCashoutTime = new Date(data.minimumCashoutTime);

    // Validate start time not in future
    if (startTime > new Date(Date.now() + 5 * 60 * 1000)) {
      return errorResponse('Start time cannot be in the future', 400);
    }

    // Validate minimum cashout time >= start time
    if (minimumCashoutTime < startTime) {
      return errorResponse('Minimum cashout time must be at or after start time', 400);
    }

    const game = await Game.create({
      location: data.location || undefined,
      startTime,
      minimumCashoutTime,
      status: 'IN_PROGRESS',
    });

    return successResponse(game, 201);
  } catch (error) {
    return handleError(error);
  }
}
```

#### `src/app/api/games/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game, GameParticipant, BuyIn, Cashout, Player } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';
import { getBalanceStatus } from '@/lib/utils';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/games/[id] - Get game with full details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid game ID', 400);
    }

    await connectDB();

    const game = await Game.findById(id);
    if (!game) {
      return errorResponse('Game not found', 404);
    }

    // Get participants with their stats
    const participants = await GameParticipant.aggregate([
      { $match: { gameId: game._id } },
      {
        $lookup: {
          from: 'players',
          localField: 'playerId',
          foreignField: '_id',
          as: 'player',
        },
      },
      { $unwind: '$player' },
      {
        $lookup: {
          from: 'buyIns',
          localField: '_id',
          foreignField: 'gameParticipantId',
          as: 'buyIns',
        },
      },
      {
        $lookup: {
          from: 'cashouts',
          localField: '_id',
          foreignField: 'gameParticipantId',
          as: 'cashouts',
        },
      },
      {
        $project: {
          _id: 1,
          playerId: '$player._id',
          playerName: '$player.name',
          joinedAt: 1,
          buyInCount: { $size: '$buyIns' },
          totalBuyIns: { $sum: '$buyIns.amount' },
          totalCashouts: { $ifNull: [{ $arrayElemAt: ['$cashouts.amount', 0] }, 0] },
          hasCashedOut: { $gt: [{ $size: '$cashouts' }, 0] },
          profitLoss: {
            $subtract: [
              { $ifNull: [{ $arrayElemAt: ['$cashouts.amount', 0] }, 0] },
              { $sum: '$buyIns.amount' },
            ],
          },
        },
      },
      { $sort: { joinedAt: 1 } },
    ]);

    // Get all transactions (buy-ins and cashouts) for transaction log
    const buyIns = await BuyIn.aggregate([
      {
        $lookup: {
          from: 'gameParticipants',
          localField: 'gameParticipantId',
          foreignField: '_id',
          as: 'participant',
        },
      },
      { $unwind: '$participant' },
      { $match: { 'participant.gameId': game._id } },
      {
        $lookup: {
          from: 'players',
          localField: 'participant.playerId',
          foreignField: '_id',
          as: 'player',
        },
      },
      { $unwind: '$player' },
      {
        $project: {
          _id: 1,
          playerId: '$player._id',
          playerName: '$player.name',
          amount: 1,
          timestamp: 1,
          type: { $literal: 'BUY_IN' },
        },
      },
    ]);

    const cashouts = await Cashout.aggregate([
      {
        $lookup: {
          from: 'gameParticipants',
          localField: 'gameParticipantId',
          foreignField: '_id',
          as: 'participant',
        },
      },
      { $unwind: '$participant' },
      { $match: { 'participant.gameId': game._id } },
      {
        $lookup: {
          from: 'players',
          localField: 'participant.playerId',
          foreignField: '_id',
          as: 'player',
        },
      },
      { $unwind: '$player' },
      {
        $project: {
          _id: 1,
          playerId: '$player._id',
          playerName: '$player.name',
          amount: 1,
          timestamp: 1,
          type: { $literal: 'CASHOUT' },
        },
      },
    ]);

    // Combine and sort transactions
    const transactions = [...buyIns, ...cashouts].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate totals
    const totalBuyIns = participants.reduce((sum, p) => sum + p.totalBuyIns, 0);
    const totalCashouts = participants.reduce((sum, p) => sum + p.totalCashouts, 0);
    const balanceDiscrepancy = totalCashouts - totalBuyIns;
    const balanceStatus = getBalanceStatus(balanceDiscrepancy);

    return successResponse({
      _id: game._id,
      location: game.location,
      startTime: game.startTime,
      endTime: game.endTime,
      minimumCashoutTime: game.minimumCashoutTime,
      status: game.status,
      discrepancyNotes: game.discrepancyNotes,
      totalBuyIns,
      totalCashouts,
      balanceDiscrepancy,
      balanceStatus,
      participants,
      transactions,
    });
  } catch (error) {
    return handleError(error);
  }
}
```

#### `src/app/api/games/[id]/complete/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';
import { z } from 'zod';

const completeGameSchema = z.object({
  discrepancyNotes: z.string().max(500, 'Notes too long').optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/games/[id]/complete - Complete the game
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid game ID', 400);
    }

    await connectDB();

    const game = await Game.findById(id);
    if (!game) {
      return errorResponse('Game not found', 404);
    }

    if (game.status === 'COMPLETED') {
      return errorResponse('Game already completed', 400);
    }

    const body = await request.json();
    const data = completeGameSchema.parse(body);

    game.status = 'COMPLETED';
    game.endTime = new Date();
    if (data.discrepancyNotes) {
      game.discrepancyNotes = data.discrepancyNotes;
    }

    await game.save();

    return successResponse({
      _id: game._id,
      status: game.status,
      endTime: game.endTime,
      discrepancyNotes: game.discrepancyNotes,
    });
  } catch (error) {
    return handleError(error);
  }
}
```

#### `src/app/api/games/[id]/participants/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game, Player, GameParticipant } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';
import { z } from 'zod';

const addParticipantSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
});

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/games/[id]/participants - Add player to game
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid game ID', 400);
    }

    await connectDB();

    const game = await Game.findById(id);
    if (!game) {
      return errorResponse('Game not found', 404);
    }

    if (game.status === 'COMPLETED') {
      return errorResponse('Cannot add participants to completed game', 403);
    }

    const body = await request.json();
    const { playerId } = addParticipantSchema.parse(body);

    if (!isValidObjectId(playerId)) {
      return errorResponse('Invalid player ID', 400);
    }

    const player = await Player.findById(playerId);
    if (!player || player.isDeleted) {
      return errorResponse('Player not found', 404);
    }

    // Check if player already in game
    const existing = await GameParticipant.findOne({ gameId: id, playerId });
    if (existing) {
      return errorResponse('Player already in game', 400);
    }

    const participant = await GameParticipant.create({
      gameId: id,
      playerId,
      joinedAt: new Date(),
    });

    return successResponse(
      {
        _id: participant._id,
        gameId: participant.gameId,
        playerId: participant.playerId,
        playerName: player.name,
        joinedAt: participant.joinedAt,
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
```

### Buy-Ins API

#### `src/app/api/buy-ins/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game, GameParticipant, BuyIn } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';
import { z } from 'zod';

const createBuyInSchema = z.object({
  gameParticipantId: z.string().min(1, 'Game participant ID is required'),
  amount: z
    .number()
    .int('Amount must be a whole number')
    .min(1, 'Amount must be at least 1')
    .max(1000000, 'Amount cannot exceed 1,000,000'),
  timestamp: z.string().datetime().optional(),
});

// POST /api/buy-ins - Create buy-in
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const data = createBuyInSchema.parse(body);

    if (!isValidObjectId(data.gameParticipantId)) {
      return errorResponse('Invalid game participant ID', 400);
    }

    const participant = await GameParticipant.findById(data.gameParticipantId);
    if (!participant) {
      return errorResponse('Game participant not found', 404);
    }

    const game = await Game.findById(participant.gameId);
    if (!game) {
      return errorResponse('Game not found', 404);
    }

    if (game.status === 'COMPLETED') {
      return errorResponse('Cannot modify completed game', 403);
    }

    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

    // Validate timestamp is not before game start
    if (timestamp < game.startTime) {
      return errorResponse('Buy-in time cannot be before game start', 400);
    }

    const buyIn = await BuyIn.create({
      gameParticipantId: data.gameParticipantId,
      amount: data.amount,
      timestamp,
    });

    return successResponse(buyIn, 201);
  } catch (error) {
    return handleError(error);
  }
}
```

#### `src/app/api/buy-ins/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game, GameParticipant, BuyIn } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';
import { z } from 'zod';

const updateBuyInSchema = z.object({
  amount: z
    .number()
    .int('Amount must be a whole number')
    .min(1, 'Amount must be at least 1')
    .max(1000000, 'Amount cannot exceed 1,000,000'),
});

type RouteContext = { params: Promise<{ id: string }> };

// Helper to check if game is completed
async function checkGameNotCompleted(buyInId: string) {
  const buyIn = await BuyIn.findById(buyInId);
  if (!buyIn) {
    return { error: 'Buy-in not found', status: 404 };
  }

  const participant = await GameParticipant.findById(buyIn.gameParticipantId);
  if (!participant) {
    return { error: 'Participant not found', status: 404 };
  }

  const game = await Game.findById(participant.gameId);
  if (!game) {
    return { error: 'Game not found', status: 404 };
  }

  if (game.status === 'COMPLETED') {
    return { error: 'Cannot modify completed game', status: 403 };
  }

  return { buyIn, game };
}

// PATCH /api/buy-ins/[id] - Update buy-in amount
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid buy-in ID', 400);
    }

    await connectDB();

    const check = await checkGameNotCompleted(id);
    if ('error' in check) {
      return errorResponse(check.error, check.status);
    }

    const body = await request.json();
    const { amount } = updateBuyInSchema.parse(body);

    check.buyIn.amount = amount;
    await check.buyIn.save();

    return successResponse({
      _id: check.buyIn._id,
      amount: check.buyIn.amount,
      timestamp: check.buyIn.timestamp,
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/buy-ins/[id] - Delete buy-in
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid buy-in ID', 400);
    }

    await connectDB();

    const check = await checkGameNotCompleted(id);
    if ('error' in check) {
      return errorResponse(check.error, check.status);
    }

    await BuyIn.findByIdAndDelete(id);

    return successResponse({ message: 'Buy-in deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
```

### Cashouts API

#### `src/app/api/cashouts/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game, GameParticipant, Cashout } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';
import { z } from 'zod';

const cashoutItemSchema = z.object({
  gameParticipantId: z.string().min(1, 'Game participant ID is required'),
  amount: z
    .number()
    .int('Amount must be a whole number')
    .min(0, 'Amount cannot be negative')
    .max(1000000, 'Amount cannot exceed 1,000,000'),
});

const createCashoutsSchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
  cashouts: z.array(cashoutItemSchema).min(1, 'At least one cashout required'),
});

// POST /api/cashouts - Create cashouts (batch)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const data = createCashoutsSchema.parse(body);

    if (!isValidObjectId(data.gameId)) {
      return errorResponse('Invalid game ID', 400);
    }

    const game = await Game.findById(data.gameId);
    if (!game) {
      return errorResponse('Game not found', 404);
    }

    if (game.status === 'COMPLETED') {
      return errorResponse('Cannot modify completed game', 403);
    }

    // Validate minimum cashout time
    const now = new Date();
    if (now < game.minimumCashoutTime) {
      return errorResponse(
        `Cashouts not allowed until ${game.minimumCashoutTime.toLocaleTimeString()}. Current time: ${now.toLocaleTimeString()}`,
        400
      );
    }

    // Validate all participant IDs
    for (const cashout of data.cashouts) {
      if (!isValidObjectId(cashout.gameParticipantId)) {
        return errorResponse('Invalid game participant ID', 400);
      }

      const participant = await GameParticipant.findById(cashout.gameParticipantId);
      if (!participant) {
        return errorResponse(
          `Participant ${cashout.gameParticipantId} not found`,
          404
        );
      }

      if (participant.gameId.toString() !== data.gameId) {
        return errorResponse('Participant does not belong to this game', 400);
      }

      // Check if cashout already exists
      const existing = await Cashout.findOne({
        gameParticipantId: cashout.gameParticipantId,
      });
      if (existing) {
        return errorResponse(
          `Cashout already exists for participant ${cashout.gameParticipantId}`,
          400
        );
      }
    }

    // Create all cashouts
    const createdCashouts = await Cashout.insertMany(
      data.cashouts.map((c) => ({
        gameParticipantId: c.gameParticipantId,
        amount: c.amount,
        timestamp: now,
      }))
    );

    return successResponse(createdCashouts, 201);
  } catch (error) {
    return handleError(error);
  }
}
```

### Leaderboard API

#### `src/app/api/leaderboard/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Player, GameParticipant, BuyIn, Cashout } from '@/models';
import { successResponse, handleError } from '@/lib/api-helpers';

// GET /api/leaderboard - Get all-time leaderboard
export async function GET() {
  try {
    await connectDB();

    const leaderboard = await Player.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: 'gameParticipants',
          localField: '_id',
          foreignField: 'playerId',
          as: 'participations',
        },
      },
      {
        $lookup: {
          from: 'buyIns',
          localField: 'participations._id',
          foreignField: 'gameParticipantId',
          as: 'buyIns',
        },
      },
      {
        $lookup: {
          from: 'cashouts',
          localField: 'participations._id',
          foreignField: 'gameParticipantId',
          as: 'cashouts',
        },
      },
      {
        $project: {
          playerId: '$_id',
          playerName: '$name',
          totalGamesPlayed: { $size: '$participations' },
          totalBuyIns: { $sum: '$buyIns.amount' },
          totalCashouts: { $sum: '$cashouts.amount' },
          totalProfitLoss: {
            $subtract: [{ $sum: '$cashouts.amount' }, { $sum: '$buyIns.amount' }],
          },
        },
      },
      {
        $addFields: {
          averageProfitPerSession: {
            $cond: {
              if: { $gt: ['$totalGamesPlayed', 0] },
              then: {
                $round: [{ $divide: ['$totalProfitLoss', '$totalGamesPlayed'] }, 0],
              },
              else: null,
            },
          },
        },
      },
      { $sort: { totalProfitLoss: -1 } },
    ]);

    return successResponse(leaderboard);
  } catch (error) {
    return handleError(error);
  }
}
```

## Error Handling Summary

| Endpoint | Error | Status | Message |
|----------|-------|--------|---------|
| All | Invalid ObjectId | 400 | "Invalid ID format" |
| All | Zod validation | 400 | "Validation error: ..." |
| All | MongoDB validation | 400 | Field-specific message |
| POST /players | Duplicate name | 400 | "Player name already exists" |
| GET /players/[id] | Not found | 404 | "Player not found" |
| POST /games/[id]/participants | Game completed | 403 | "Cannot add participants to completed game" |
| POST /buy-ins | Game completed | 403 | "Cannot modify completed game" |
| POST /cashouts | Before min time | 400 | "Cashouts not allowed until..." |
| PATCH /games/[id]/complete | Already complete | 400 | "Game already completed" |

## Expected Results

After completing this phase:
1. All API endpoints functional and returning correct responses
2. Validation errors return helpful messages
3. MongoDB aggregations return computed fields
4. Completed games are immutable
5. Minimum cashout time enforced

## Validation Steps

1. Use tools like Postman, Insomnia, or curl to test each endpoint
2. Test happy paths (valid data)
3. Test error cases (invalid IDs, missing fields, validation failures)
4. Test game completion workflow
5. Verify aggregation results match expected calculations

### API Test Checklist

```markdown
- [ ] POST /api/players - creates player
- [ ] GET /api/players - lists active players with stats
- [ ] GET /api/players/[id] - returns player with full statistics
- [ ] PATCH /api/players/[id] - updates name
- [ ] DELETE /api/players/[id] - soft deletes

- [ ] POST /api/games - creates game
- [ ] GET /api/games - lists games with stats
- [ ] GET /api/games?status=IN_PROGRESS - filters correctly
- [ ] GET /api/games/[id] - returns full game details

- [ ] POST /api/games/[id]/participants - adds player
- [ ] POST /api/games/[id]/participants - rejects duplicate

- [ ] POST /api/buy-ins - creates buy-in
- [ ] POST /api/buy-ins - rejects if game completed
- [ ] PATCH /api/buy-ins/[id] - updates amount
- [ ] DELETE /api/buy-ins/[id] - removes buy-in

- [ ] POST /api/cashouts - creates cashouts (batch)
- [ ] POST /api/cashouts - rejects before minimum time

- [ ] PATCH /api/games/[id]/complete - completes game
- [ ] PATCH /api/games/[id]/complete - rejects if already completed

- [ ] GET /api/leaderboard - returns sorted leaderboard
```

## Success Criteria

- [ ] All 11 API route files created
- [ ] All endpoints return correct HTTP status codes
- [ ] Validation errors return helpful messages
- [ ] Completed games cannot be modified
- [ ] Aggregations calculate correct statistics
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

## Potential Issues

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Aggregation too slow | Response > 1s | Add appropriate indexes, use $limit |
| Large response payloads | Network delays | Paginate or add $limit |
| Race conditions on cashout | Duplicate cashout errors | Use findOneAndUpdate with upsert:false |
| Date timezone issues | Wrong times displayed | Use ISO strings, handle timezone on client |

---

**Phase Dependencies**: Phase 1, Phase 2
**Next Phase**: Phase 4 - Shared Types
