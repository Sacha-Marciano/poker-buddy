/**
 * Seed script to import historical data from Hold'em House app into Poker Buddy
 *
 * Usage: npm run seed
 *
 * Note: This script requires .env.local with MONGODB_URI
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import Player from '../src/models/Player';
import Game from '../src/models/Game';
import GameParticipant from '../src/models/GameParticipant';
import BuyIn from '../src/models/BuyIn';
import Cashout from '../src/models/Cashout';
import Settlement from '../src/models/Settlement';
import { historicalPlayers } from './data/historical-players';
import { historicalGames } from './data/historical-games';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

interface ParticipantData {
  playerId: string;
  totalBuyIns: number;
  cashout: number;
}

/**
 * Split a total buy-in amount evenly across (1 + rebuys) transactions.
 * Returns an array of amounts that sum to totalBuyIn.
 * First entries get the extra if not evenly divisible.
 */
function splitBuyIn(totalBuyIn: number, rebuys: number): number[] {
  const count = 1 + rebuys;
  const base = Math.floor(totalBuyIn / count);
  const remainder = totalBuyIn % count;

  const amounts: number[] = [];
  for (let i = 0; i < count; i++) {
    amounts.push(i < remainder ? base + 1 : base);
  }
  return amounts;
}

/**
 * Calculate settlements - who owes whom (same algorithm as in complete route)
 */
function calculateSettlements(
  participants: ParticipantData[]
): Array<{ fromPlayerId: string; toPlayerId: string; amount: number }> {
  const balances = participants.map((p) => ({
    playerId: p.playerId,
    balance: p.cashout - p.totalBuyIns,
  }));

  const winners = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const losers = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const settlements: Array<{ fromPlayerId: string; toPlayerId: string; amount: number }> = [];

  let winnerIdx = 0;
  let loserIdx = 0;

  while (winnerIdx < winners.length && loserIdx < losers.length) {
    const winner = winners[winnerIdx];
    const loser = losers[loserIdx];

    const loserOwes = Math.abs(loser.balance);
    const winnerOwed = winner.balance;
    const transferAmount = Math.min(loserOwes, winnerOwed);

    if (transferAmount > 0) {
      settlements.push({
        fromPlayerId: loser.playerId,
        toPlayerId: winner.playerId,
        amount: transferAmount,
      });
    }

    winner.balance -= transferAmount;
    loser.balance += transferAmount;

    if (winner.balance === 0) winnerIdx++;
    if (loser.balance === 0) loserIdx++;
  }

  return settlements;
}

async function seedHistoricalData() {
  try {
    console.log('Starting historical data seed...\n');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env.local');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Check idempotency - if Tom Kilstein exists, abort
    const existingPlayer = await Player.findOne({ name: 'Tom Kilstein' });
    if (existingPlayer) {
      console.log('Historical data already seeded (Tom Kilstein exists)');
      console.log('If you want to re-seed, please delete the existing data first.\n');
      process.exit(0);
    }

    // Step 1: Create all players
    console.log('Step 1: Creating players...');
    const playerDocs = await Player.insertMany(
      historicalPlayers.map((p) => ({
        name: p.name,
        phone: p.phone,
        avatarColor: p.avatarColor,
        isDeleted: false,
      })),
      { ordered: true }
    );
    console.log(`Created ${playerDocs.length} players\n`);

    // Create player name to ID map
    const playerMap = new Map<string, string>();
    playerDocs.forEach((doc) => {
      playerMap.set(doc.name, doc._id.toString());
    });

    // Step 2: Process each game
    console.log('Step 2: Processing games...\n');
    let gameCount = 0;
    let totalBuyInCount = 0;
    let totalCashoutCount = 0;
    let totalSettlementCount = 0;

    for (const gameData of historicalGames) {
      gameCount++;
      console.log(`Processing game ${gameCount}/${historicalGames.length} (${gameData.startTime.toISOString().split('T')[0]})...`);

      // Create game document
      const game = await Game.create({
        startTime: gameData.startTime,
        endTime: gameData.endTime,
        minimumCashoutTime: gameData.startTime,
        status: 'COMPLETED',
      });

      // Create game participants
      const participantDocs = await GameParticipant.insertMany(
        gameData.players.map((player) => ({
          gameId: game._id,
          playerId: playerMap.get(player.name),
          joinedAt: gameData.startTime,
        })),
        { ordered: true }
      );

      // Create participant name to ID map for this game
      const participantMap = new Map<string, string>();
      participantDocs.forEach((doc, index) => {
        participantMap.set(gameData.players[index].name, doc._id.toString());
      });

      // Create buy-ins (expand compact format into individual transactions)
      const buyInRecords: Array<{
        gameParticipantId: string | undefined;
        amount: number;
        isRebuy: boolean;
        timestamp: Date;
      }> = [];

      for (const player of gameData.players) {
        const amounts = splitBuyIn(player.totalBuyIn, player.rebuys);
        const participantId = participantMap.get(player.name);

        amounts.forEach((amount, i) => {
          buyInRecords.push({
            gameParticipantId: participantId,
            amount,
            isRebuy: i > 0,
            timestamp: new Date(gameData.startTime.getTime() + (i + 1) * 1000),
          });
        });
      }

      const buyInDocs = await BuyIn.insertMany(buyInRecords, { ordered: true });
      totalBuyInCount += buyInDocs.length;

      // Create cashouts (cashout amount = totalBuyIn + profitLoss)
      const cashoutRecords = gameData.players.map((player, index) => {
        const cashoutAmount = player.totalBuyIn + player.profitLoss;
        return {
          gameParticipantId: participantMap.get(player.name),
          amount: cashoutAmount,
          finalChips: cashoutAmount,
          timestamp: new Date(gameData.endTime.getTime() - (gameData.players.length - index) * 1000),
        };
      });

      const cashoutDocs = await Cashout.insertMany(cashoutRecords, { ordered: true });
      totalCashoutCount += cashoutDocs.length;

      // Calculate settlements
      const participantData: ParticipantData[] = gameData.players.map((player) => ({
        playerId: playerMap.get(player.name)!,
        totalBuyIns: player.totalBuyIn,
        cashout: player.totalBuyIn + player.profitLoss,
      }));

      const settlements = calculateSettlements(participantData);

      if (settlements.length > 0) {
        await Settlement.insertMany(
          settlements.map((s) => ({
            gameId: game._id,
            fromPlayerId: s.fromPlayerId,
            toPlayerId: s.toPlayerId,
            amount: s.amount,
          })),
          { ordered: true }
        );
        totalSettlementCount += settlements.length;
      }

      console.log(`  ${gameData.players.length} participants, ${buyInDocs.length} buy-ins, ${cashoutDocs.length} cashouts, ${settlements.length} settlements\n`);
    }

    // Summary
    console.log('===================================================');
    console.log('Historical Data Seed Complete!');
    console.log('===================================================');
    console.log(`Players created:     ${playerDocs.length}`);
    console.log(`Games created:       ${gameCount}`);
    console.log(`Buy-ins created:     ${totalBuyInCount}`);
    console.log(`Cashouts created:    ${totalCashoutCount}`);
    console.log(`Settlements created: ${totalSettlementCount}`);
    console.log('===================================================\n');

  } catch (error) {
    console.error('Error seeding historical data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedHistoricalData();
