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
