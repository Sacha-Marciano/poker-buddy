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
async function checkGameNotCompleted(buyInId: string): Promise<
  | { error: string; status: number }
  | { buyIn: InstanceType<typeof BuyIn>; game: InstanceType<typeof Game> }
> {
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
