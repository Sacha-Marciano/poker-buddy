# Phase 2: Historical Data Seed Script

## Objective

Create a standalone TypeScript seed script that populates the database with all historical data from the Hold'em House app: 26 players, 15 games (as COMPLETED), their GameParticipants, ~400 BuyIns (with isRebuy), ~85 Cashouts (with finalChips), and calculated Settlements.

## Prerequisites

- Phase 1 complete: All new fields (phone, avatarColor, isRebuy, finalChips) exist in models, schemas, and types
- MongoDB accessible via `MONGODB_URI` environment variable

## Scope

### In Scope

- `scripts/seed-historical-data.ts` - Main seed script
- `scripts/data/historical-players.ts` - Player data (26 players with names, phones, avatar colors)
- `scripts/data/historical-games.ts` - Game and transaction data (15 games with all buy-ins and cashouts)
- `package.json` - Add seed script command
- Idempotency checks (skip if data already exists)
- Settlement calculation using the same algorithm as `src/app/api/games/[id]/complete/route.ts`

### Out of Scope

- UI changes
- New API routes
- Modifying existing data
- Rolling back seeded data (manual DB cleanup if needed)

## Implementation Details

### Files to Create

| File                                   | Purpose                          | Est. Lines |
|----------------------------------------|----------------------------------|------------|
| `scripts/seed-historical-data.ts`      | Main entry point / orchestrator  | ~200       |
| `scripts/data/historical-players.ts`   | Player data array                | ~100       |
| `scripts/data/historical-games.ts`     | Games + transactions data        | ~250       |

### Files to Modify

| File           | Changes                                     |
|----------------|---------------------------------------------|
| `package.json` | Add `"seed"` script                         |
| `tsconfig.json` | No changes needed (scripts/*.ts already included by `**/*.ts`) |

### Package.json Script Addition

```json
{
  "scripts": {
    "seed": "npx tsx scripts/seed-historical-data.ts"
  }
}
```

### Data Structure: historical-players.ts

```typescript
export interface HistoricalPlayer {
  name: string;
  phone?: string;
  avatarColor?: string;
}

export const historicalPlayers: HistoricalPlayer[] = [
  { name: "Player Name", phone: "0501234567", avatarColor: "#FF6B6B" },
  // ... 26 players total
];
```

**Important**: The actual player names, phone numbers, and avatar colors must come from the old Hold'em House data extract. The implementer should get this data from the user or from a data export.

### Data Structure: historical-games.ts

```typescript
export interface HistoricalBuyIn {
  playerName: string;  // Matches a player name from historicalPlayers
  amount: number;
  isRebuy: boolean;
  timestamp: string;   // ISO date string
}

export interface HistoricalCashout {
  playerName: string;
  amount: number;       // Cashout monetary value (profit/loss based)
  finalChips?: number;  // Actual chip count
  timestamp: string;
}

export interface HistoricalGame {
  location?: string;
  startTime: string;    // ISO date string
  endTime: string;      // ISO date string
  participants: string[]; // Player names
  buyIns: HistoricalBuyIn[];
  cashouts: HistoricalCashout[];
}

export const historicalGames: HistoricalGame[] = [
  {
    location: "Home Game",
    startTime: "2024-01-15T20:00:00.000Z",
    endTime: "2024-01-16T02:00:00.000Z",
    participants: ["Player A", "Player B", "Player C"],
    buyIns: [
      { playerName: "Player A", amount: 50, isRebuy: false, timestamp: "2024-01-15T20:00:00.000Z" },
      { playerName: "Player A", amount: 50, isRebuy: true, timestamp: "2024-01-15T22:30:00.000Z" },
      // ...
    ],
    cashouts: [
      { playerName: "Player A", amount: 120, finalChips: 120, timestamp: "2024-01-16T02:00:00.000Z" },
      // ...
    ],
  },
  // ... 15 games total
];
```

### Main Seed Script: seed-historical-data.ts

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import models
import Player from '../src/models/Player';
import Game from '../src/models/Game';
import GameParticipant from '../src/models/GameParticipant';
import BuyIn from '../src/models/BuyIn';
import Cashout from '../src/models/Cashout';
import Settlement from '../src/models/Settlement';

// Import data
import { historicalPlayers } from './data/historical-players';
import { historicalGames } from './data/historical-games';

async function seed() {
  // 1. Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // 2. Idempotency check
  const existingPlayerCount = await Player.countDocuments({
    name: { $in: historicalPlayers.map(p => p.name) }
  });
  if (existingPlayerCount > 0) {
    console.log(`Found ${existingPlayerCount} existing players from seed data. Aborting to prevent duplicates.`);
    console.log('To re-seed, manually delete the seeded data first.');
    await mongoose.disconnect();
    return;
  }

  // 3. Create Players
  const playerMap = new Map<string, mongoose.Types.ObjectId>();
  for (const p of historicalPlayers) {
    const player = await Player.create({
      name: p.name,
      phone: p.phone,
      avatarColor: p.avatarColor,
    });
    playerMap.set(p.name, player._id);
    console.log(`Created player: ${p.name}`);
  }

  // 4. Create Games, Participants, BuyIns, Cashouts, Settlements
  for (const gameData of historicalGames) {
    // Create Game (bypass timestamp validation for historical dates)
    const game = new Game({
      location: gameData.location,
      startTime: new Date(gameData.startTime),
      endTime: new Date(gameData.endTime),
      minimumCashoutTime: new Date(gameData.startTime), // Same as start
      status: 'COMPLETED',
    });
    await game.save({ validateBeforeSave: false });
    console.log(`Created game: ${gameData.location || 'No location'} - ${gameData.startTime}`);

    // Create GameParticipants
    const participantMap = new Map<string, mongoose.Types.ObjectId>();
    for (const playerName of gameData.participants) {
      const playerId = playerMap.get(playerName);
      if (!playerId) {
        console.error(`Player not found: ${playerName}`);
        continue;
      }
      const participant = await GameParticipant.create({
        gameId: game._id,
        playerId,
        joinedAt: new Date(gameData.startTime),
      });
      participantMap.set(playerName, participant._id);
    }

    // Create BuyIns (bypass timestamp validation for historical dates)
    for (const buyInData of gameData.buyIns) {
      const gpId = participantMap.get(buyInData.playerName);
      if (!gpId) {
        console.error(`Participant not found for buy-in: ${buyInData.playerName}`);
        continue;
      }
      const buyIn = new BuyIn({
        gameParticipantId: gpId,
        amount: buyInData.amount,
        isRebuy: buyInData.isRebuy,
        timestamp: new Date(buyInData.timestamp),
      });
      await buyIn.save({ validateBeforeSave: false });
    }
    console.log(`  Created ${gameData.buyIns.length} buy-ins`);

    // Create Cashouts (bypass timestamp validation for historical dates)
    for (const cashoutData of gameData.cashouts) {
      const gpId = participantMap.get(cashoutData.playerName);
      if (!gpId) {
        console.error(`Participant not found for cashout: ${cashoutData.playerName}`);
        continue;
      }
      const cashout = new Cashout({
        gameParticipantId: gpId,
        amount: cashoutData.amount,
        finalChips: cashoutData.finalChips,
        timestamp: new Date(cashoutData.timestamp),
      });
      await cashout.save({ validateBeforeSave: false });
    }
    console.log(`  Created ${gameData.cashouts.length} cashouts`);

    // Calculate and Create Settlements
    const participantData = [];
    for (const playerName of gameData.participants) {
      const gpId = participantMap.get(playerName);
      const playerId = playerMap.get(playerName);
      if (!gpId || !playerId) continue;

      const buyIns = await BuyIn.find({ gameParticipantId: gpId });
      const totalBuyIns = buyIns.reduce((sum, b) => sum + b.amount, 0);

      const cashout = await Cashout.findOne({ gameParticipantId: gpId });
      const cashoutAmount = cashout?.amount || 0;

      participantData.push({
        _id: gpId.toString(),
        playerId: playerId.toString(),
        totalBuyIns,
        cashout: cashoutAmount,
      });
    }

    const settlements = calculateSettlements(participantData);
    if (settlements.length > 0) {
      await Settlement.insertMany(
        settlements.map((s) => ({
          gameId: game._id,
          fromPlayerId: s.fromPlayerId,
          toPlayerId: s.toPlayerId,
          amount: s.amount,
        }))
      );
      console.log(`  Created ${settlements.length} settlements`);
    }
  }

  console.log('\nSeed complete!');
  console.log(`  Players: ${historicalPlayers.length}`);
  console.log(`  Games: ${historicalGames.length}`);

  await mongoose.disconnect();
}

// Settlement calculation - copied from src/app/api/games/[id]/complete/route.ts
function calculateSettlements(
  participants: Array<{
    _id: string;
    playerId: string;
    totalBuyIns: number;
    cashout: number;
  }>
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

// Run
seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

### Key Design Decisions

1. **`validateBeforeSave: false`**: The existing Mongoose schemas have timestamp validators that reject dates in the past (the `timestamp` field on BuyIn and Cashout checks `value <= new Date(Date.now() + 5 * 60 * 1000)`). Since historical data has past dates, we must bypass these validators. The Game model also has `startTime` validation that rejects future dates, which is fine for past data, but `endTime` validation requires it to be after `startTime` -- this should pass naturally but we bypass for safety.

2. **Idempotency**: The script checks if any players from the seed data already exist. If so, it aborts entirely. This is a simple approach that prevents double-seeding. To re-seed, the user must manually clear the old data first.

3. **Settlement calculation**: The script copies the settlement algorithm from `src/app/api/games/[id]/complete/route.ts` rather than importing it, because the API route function is not exported and lives in a Next.js API route context. This duplication is acceptable for a one-time seed script.

4. **Environment variables**: The script uses `dotenv` to load `.env.local`, matching Next.js convention. The `dotenv` package may need to be installed as a dev dependency, OR the implementer can use `tsx` with `--env-file=.env.local` flag instead.

5. **Direct model imports**: The script imports Mongoose models directly from `src/models/` using relative paths (not `@/` aliases, since `tsx` does not use Next.js path resolution by default). Alternative: use `tsconfig-paths` or configure `tsx` with the project's tsconfig.

### Handling Path Aliases

The project uses `@/*` path aliases configured in `tsconfig.json`. When running via `npx tsx`, these aliases are NOT resolved by default. Options:

**Option A (Recommended)**: Use `tsx` with `--tsconfig` flag and install `tsconfig-paths`:
```bash
npx tsx -r tsconfig-paths/register scripts/seed-historical-data.ts
```

**Option B**: Use relative imports in the seed script:
```typescript
import Player from '../src/models/Player';
```

**Option C**: Create a separate `tsconfig.seed.json` that extends the main one and sets `paths` appropriately.

The implementer should use **Option B** (relative imports) for simplicity, since this is a one-time script.

### Handling dotenv

**Option A**: Install `dotenv` as devDependency:
```bash
npm install -D dotenv
```
Then use `dotenv.config({ path: '.env.local' })` in the script.

**Option B**: Use the `--env-file` flag with Node.js 20+:
```bash
node --env-file=.env.local node_modules/.bin/tsx scripts/seed-historical-data.ts
```

**Option C**: Use `tsx` with `--env-file`:
```bash
npx tsx --env-file=.env.local scripts/seed-historical-data.ts
```

The implementer should check which Node.js version is available and choose accordingly. Option A is the most portable.

### Package.json Script

```json
{
  "scripts": {
    "seed": "tsx --env-file=.env.local scripts/seed-historical-data.ts"
  }
}
```

Or with dotenv:
```json
{
  "scripts": {
    "seed": "npx tsx scripts/seed-historical-data.ts"
  }
}
```

### Dev Dependencies to Add

| Package    | Purpose                          |
|------------|----------------------------------|
| `tsx`      | TypeScript execution (may already be available via npx) |
| `dotenv`   | Load .env.local (if not using --env-file flag)          |

Check if `tsx` is already installed or available via `npx`.

## Error Handling

| Error Condition                           | Expected Behavior                          | User Feedback                   |
|-------------------------------------------|--------------------------------------------|---------------------------------|
| MONGODB_URI not set                       | Script throws and exits                    | Error message with instructions |
| Duplicate player names                    | Idempotency check aborts with message      | Console log explaining abort    |
| Player name in game not found in players  | Skip that participant, log error           | Console error per missing name  |
| MongoDB connection failure                | Script throws and exits                    | Connection error message        |
| Mongoose validation error (bypassed)      | Should not occur due to validateBeforeSave | N/A                             |

## Expected Results

When this phase is complete:
1. Running `npm run seed` populates the database with all historical data
2. 26 players visible in the Players list with avatar colors
3. 15 completed games visible in game history
4. Each game has correct participants, buy-ins (with isRebuy flags), cashouts (with finalChips), and settlements
5. Leaderboard reflects historical aggregate data
6. Running the script again safely aborts without duplicating data

## Validation Steps

1. Run `npm run seed` -- should complete without errors
2. Open the app and verify:
   - Players page shows 26 players with colored avatars
   - Games history shows 15 completed games
   - Each game detail shows correct participants, buy-ins, cashouts, and settlements
   - Leaderboard shows aggregated stats for all players
3. Run `npm run seed` again -- should abort with "existing players" message
4. Verify data integrity:
   - For each game: total buy-ins == sum of individual buy-ins
   - For each game: each participant has exactly one cashout
   - Settlements balance out (sum of fromPlayer amounts == sum of toPlayer amounts)

## Success Criteria

- [ ] `scripts/seed-historical-data.ts` exists and runs without errors
- [ ] `scripts/data/historical-players.ts` contains all 26 players with names, phones, avatar colors
- [ ] `scripts/data/historical-games.ts` contains all 15 games with participants, buy-ins, cashouts
- [ ] All players created with correct phone and avatarColor
- [ ] All games created as COMPLETED with correct start/end times
- [ ] All buy-ins created with correct isRebuy flags
- [ ] All cashouts created with correct finalChips values
- [ ] Settlements calculated correctly for each game
- [ ] Script is idempotent (second run aborts safely)
- [ ] `npm run seed` command works from package.json

## Potential Issues

| Issue                                            | Detection                          | Resolution                                                    |
|--------------------------------------------------|------------------------------------|---------------------------------------------------------------|
| Path aliases not resolved by tsx                 | Import errors at runtime           | Use relative imports in seed script                           |
| .env.local not loaded                            | MONGODB_URI undefined error        | Use dotenv or --env-file flag                                 |
| Mongoose validators reject historical timestamps | Validation error on save           | Use `{ validateBeforeSave: false }` on model.save()           |
| Player name case mismatch between data files     | "Player not found" errors          | Ensure exact name matching in data files                      |
| Large data insert performance                    | Slow execution                     | Use insertMany where possible (already done for settlements)  |
| tsx not installed                                | Command not found                  | Install as devDependency or use npx                           |
| Mongoose model caching issues                    | "Cannot overwrite model" error     | Models already use `mongoose.models.X \|\|` pattern           |
