import { NextRequest } from 'next/server';
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
