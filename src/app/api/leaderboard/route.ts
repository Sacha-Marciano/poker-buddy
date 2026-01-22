import { connectDB } from '@/lib/db';
import { Player } from '@/models';
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
