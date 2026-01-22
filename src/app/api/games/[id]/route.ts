import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game, GameParticipant, BuyIn, Cashout } from '@/models';
import {
  errorResponse,
  successResponse,
  handleError,
  isValidObjectId,
} from '@/lib/api-helpers';
import { getBalanceStatus } from '@/lib/utils';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/games/[id] - Get game with full details
export async function GET(request: NextRequest, context: RouteContext) {
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

    // Get participants with their stats
    const participants = await GameParticipant.aggregate([
      { $match: { gameId: game._id } },
      {
        $lookup: {
          from: 'players',
          localField: 'playerId',
          foreignField: '_id',
          as: 'player',
        },
      },
      { $unwind: '$player' },
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
          _id: 1,
          playerId: '$player._id',
          playerName: '$player.name',
          joinedAt: 1,
          buyInCount: { $size: '$buyIns' },
          totalBuyIns: { $sum: '$buyIns.amount' },
          totalCashouts: { $ifNull: [{ $arrayElemAt: ['$cashouts.amount', 0] }, 0] },
          hasCashedOut: { $gt: [{ $size: '$cashouts' }, 0] },
          profitLoss: {
            $subtract: [
              { $ifNull: [{ $arrayElemAt: ['$cashouts.amount', 0] }, 0] },
              { $sum: '$buyIns.amount' },
            ],
          },
        },
      },
      { $sort: { joinedAt: 1 } },
    ]);

    // Get all transactions (buy-ins and cashouts) for transaction log
    const buyIns = await BuyIn.aggregate([
      {
        $lookup: {
          from: 'gameParticipants',
          localField: 'gameParticipantId',
          foreignField: '_id',
          as: 'participant',
        },
      },
      { $unwind: '$participant' },
      { $match: { 'participant.gameId': game._id } },
      {
        $lookup: {
          from: 'players',
          localField: 'participant.playerId',
          foreignField: '_id',
          as: 'player',
        },
      },
      { $unwind: '$player' },
      {
        $project: {
          _id: 1,
          playerId: '$player._id',
          playerName: '$player.name',
          amount: 1,
          timestamp: 1,
          type: { $literal: 'BUY_IN' },
        },
      },
    ]);

    const cashouts = await Cashout.aggregate([
      {
        $lookup: {
          from: 'gameParticipants',
          localField: 'gameParticipantId',
          foreignField: '_id',
          as: 'participant',
        },
      },
      { $unwind: '$participant' },
      { $match: { 'participant.gameId': game._id } },
      {
        $lookup: {
          from: 'players',
          localField: 'participant.playerId',
          foreignField: '_id',
          as: 'player',
        },
      },
      { $unwind: '$player' },
      {
        $project: {
          _id: 1,
          playerId: '$player._id',
          playerName: '$player.name',
          amount: 1,
          timestamp: 1,
          type: { $literal: 'CASHOUT' },
        },
      },
    ]);

    // Combine and sort transactions
    const transactions = [...buyIns, ...cashouts].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate totals
    const totalBuyIns = participants.reduce((sum, p) => sum + p.totalBuyIns, 0);
    const totalCashouts = participants.reduce((sum, p) => sum + p.totalCashouts, 0);
    const balanceDiscrepancy = totalCashouts - totalBuyIns;
    const balanceStatus = getBalanceStatus(balanceDiscrepancy);

    return successResponse({
      _id: game._id,
      location: game.location,
      startTime: game.startTime,
      endTime: game.endTime,
      minimumCashoutTime: game.minimumCashoutTime,
      status: game.status,
      discrepancyNotes: game.discrepancyNotes,
      totalBuyIns,
      totalCashouts,
      balanceDiscrepancy,
      balanceStatus,
      participants,
      transactions,
    });
  } catch (error) {
    return handleError(error);
  }
}
