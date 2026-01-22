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

    const now = new Date();

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
