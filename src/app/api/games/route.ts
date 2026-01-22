import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game } from '@/models';
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
