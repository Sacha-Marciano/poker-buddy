import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settlement, Player } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/games/[id]/settlements - Get settlements for a game
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid game ID', 400);
    }

    await connectDB();

    const settlements = await Settlement.find({ gameId: id });

    // Populate with player names
    const settlementsWithNames = await Promise.all(
      settlements.map(async (s) => {
        const fromPlayer = await Player.findById(s.fromPlayerId);
        const toPlayer = await Player.findById(s.toPlayerId);
        return {
          _id: s._id,
          gameId: s.gameId,
          fromPlayerId: s.fromPlayerId,
          fromPlayerName: fromPlayer?.name || 'Unknown',
          toPlayerId: s.toPlayerId,
          toPlayerName: toPlayer?.name || 'Unknown',
          amount: s.amount,
          createdAt: s.createdAt,
        };
      })
    );

    return successResponse(settlementsWithNames);
  } catch (error) {
    return handleError(error);
  }
}
