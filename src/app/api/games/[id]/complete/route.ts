import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game, GameParticipant, BuyIn, Cashout, Settlement, Player } from '@/models';
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

const completeGameSchema = z.object({
  cashouts: z.array(cashoutItemSchema).min(1, 'At least one cashout required'),
  discrepancyNotes: z.string().max(500, 'Notes too long').optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Calculate settlements - who owes whom
 */
function calculateSettlements(
  participants: Array<{
    _id: string;
    playerId: string;
    totalBuyIns: number;
    cashout: number;
  }>
): Array<{ fromPlayerId: string; toPlayerId: string; amount: number }> {
  // Calculate net position for each player (profit/loss)
  const balances = participants.map((p) => ({
    playerId: p.playerId,
    balance: p.cashout - p.totalBuyIns,
  }));

  // Separate into winners (positive) and losers (negative)
  const winners = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const losers = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const settlements: Array<{ fromPlayerId: string; toPlayerId: string; amount: number }> = [];

  let winnerIdx = 0;
  let loserIdx = 0;

  while (winnerIdx < winners.length && loserIdx < losers.length) {
    const winner = winners[winnerIdx];
    const loser = losers[loserIdx];

    // Amount loser owes (positive number)
    const loserOwes = Math.abs(loser.balance);
    // Amount winner is owed
    const winnerOwed = winner.balance;

    // Transfer amount is minimum of what loser owes and winner is owed
    const transferAmount = Math.min(loserOwes, winnerOwed);

    if (transferAmount > 0) {
      settlements.push({
        fromPlayerId: loser.playerId,
        toPlayerId: winner.playerId,
        amount: transferAmount,
      });
    }

    // Update balances
    winner.balance -= transferAmount;
    loser.balance += transferAmount;

    // Move to next if balance is settled
    if (winner.balance === 0) winnerIdx++;
    if (loser.balance === 0) loserIdx++;
  }

  return settlements;
}

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

    // Validate minimum cashout time
    const now = new Date();
    if (now < game.minimumCashoutTime) {
      return errorResponse(
        `Cashouts not allowed until ${game.minimumCashoutTime.toLocaleTimeString()}`,
        400
      );
    }

    // Get all participants with their buy-ins
    const participants = await GameParticipant.find({ gameId: id });
    if (participants.length === 0) {
      return errorResponse('No participants in this game', 400);
    }

    // Validate all cashouts
    const cashoutMap = new Map<string, number>();
    for (const cashout of data.cashouts) {
      if (!isValidObjectId(cashout.gameParticipantId)) {
        return errorResponse('Invalid game participant ID', 400);
      }

      const participant = participants.find(
        (p) => p._id.toString() === cashout.gameParticipantId
      );
      if (!participant) {
        return errorResponse(
          `Participant ${cashout.gameParticipantId} not found`,
          404
        );
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

      cashoutMap.set(cashout.gameParticipantId, cashout.amount);
    }

    // Create all cashouts
    await Cashout.insertMany(
      data.cashouts.map((c) => ({
        gameParticipantId: c.gameParticipantId,
        amount: c.amount,
        timestamp: now,
      }))
    );

    // Calculate total buy-ins for each participant
    const participantData = await Promise.all(
      participants.map(async (p) => {
        const buyIns = await BuyIn.find({ gameParticipantId: p._id });
        const totalBuyIns = buyIns.reduce((sum, b) => sum + b.amount, 0);
        const cashout = cashoutMap.get(p._id.toString()) || 0;

        return {
          _id: p._id.toString(),
          playerId: p.playerId.toString(),
          totalBuyIns,
          cashout,
        };
      })
    );

    // Calculate settlements
    const settlements = calculateSettlements(participantData);

    // Save settlements to database
    if (settlements.length > 0) {
      await Settlement.insertMany(
        settlements.map((s) => ({
          gameId: id,
          fromPlayerId: s.fromPlayerId,
          toPlayerId: s.toPlayerId,
          amount: s.amount,
        }))
      );
    }

    // Mark game as completed
    game.status = 'COMPLETED';
    game.endTime = now;
    if (data.discrepancyNotes) {
      game.discrepancyNotes = data.discrepancyNotes;
    }

    await game.save();

    // Populate settlements with player names for response
    const settlementsWithNames = await Promise.all(
      settlements.map(async (s) => {
        const fromPlayer = await Player.findById(s.fromPlayerId);
        const toPlayer = await Player.findById(s.toPlayerId);
        return {
          fromPlayerId: s.fromPlayerId,
          fromPlayerName: fromPlayer?.name || 'Unknown',
          toPlayerId: s.toPlayerId,
          toPlayerName: toPlayer?.name || 'Unknown',
          amount: s.amount,
        };
      })
    );

    return successResponse({
      _id: game._id,
      status: game.status,
      endTime: game.endTime,
      discrepancyNotes: game.discrepancyNotes,
      settlements: settlementsWithNames,
    });
  } catch (error) {
    return handleError(error);
  }
}
