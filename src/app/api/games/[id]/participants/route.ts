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
