import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Player, GameParticipant } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';
import { z } from 'zod';

const updatePlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').trim(),
  phone: z.string().max(20).trim().optional().or(z.literal('')),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
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
      phone: player.phone,
      avatarColor: player.avatarColor,
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
    const { name, phone, avatarColor } = updatePlayerSchema.parse(body);

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
    if (phone !== undefined) player.phone = phone || undefined;
    if (avatarColor !== undefined) player.avatarColor = avatarColor || undefined;
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
