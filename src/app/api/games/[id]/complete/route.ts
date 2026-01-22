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
