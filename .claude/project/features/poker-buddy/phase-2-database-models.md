# Phase 2: Database Models

## Objective

Create all Mongoose schemas and models with proper validation, indexes, and TypeScript types. Implement the five core collections: players, games, gameParticipants, buyIns, and cashouts.

## Prerequisites

- Phase 1 completed (dependencies installed, MongoDB connection ready)
- MongoDB Atlas cluster accessible

## Scope

### In Scope
- Mongoose schema definitions for all 5 collections
- Field validation rules per specification
- Index definitions for query optimization
- TypeScript interface definitions for documents
- Pre-save hooks for timestamps

### Out of Scope
- API routes (Phase 3)
- Aggregation pipelines for statistics (Phase 3)
- Client-side types (Phase 4)

## Implementation Details

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/models/Player.ts` | Player schema and model | ~50 |
| `src/models/Game.ts` | Game session schema and model | ~80 |
| `src/models/GameParticipant.ts` | Player-game junction schema | ~60 |
| `src/models/BuyIn.ts` | Buy-in transaction schema | ~50 |
| `src/models/Cashout.ts` | Cashout record schema | ~50 |
| `src/models/index.ts` | Export all models | ~10 |

### Player Model (`src/models/Player.ts`)

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer {
  name: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlayerDocument extends IPlayer, Document {}

const playerSchema = new Schema<IPlayerDocument>(
  {
    name: {
      type: String,
      required: [true, 'Player name is required'],
      unique: true,
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'players',
  }
);

// Indexes
playerSchema.index({ name: 1 }, { unique: true });
playerSchema.index({ isDeleted: 1 });

// Prevent model recompilation in development
const Player: Model<IPlayerDocument> =
  mongoose.models.Player || mongoose.model<IPlayerDocument>('Player', playerSchema);

export default Player;
```

### Game Model (`src/models/Game.ts`)

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export type GameStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface IGame {
  location?: string;
  startTime: Date;
  endTime?: Date;
  minimumCashoutTime: Date;
  status: GameStatus;
  discrepancyNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGameDocument extends IGame, Document {}

const gameSchema = new Schema<IGameDocument>(
  {
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      validate: {
        validator: function (value: Date) {
          // Allow 5 minutes in the future to account for clock drift
          return value <= new Date(Date.now() + 5 * 60 * 1000);
        },
        message: 'Start time cannot be in the future',
      },
    },
    endTime: {
      type: Date,
      validate: {
        validator: function (this: IGameDocument, value: Date | undefined) {
          if (!value) return true;
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    minimumCashoutTime: {
      type: Date,
      required: [true, 'Minimum cashout time is required'],
      validate: {
        validator: function (this: IGameDocument, value: Date) {
          return value >= this.startTime;
        },
        message: 'Minimum cashout time must be at or after start time',
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['IN_PROGRESS', 'COMPLETED'],
        message: 'Status must be IN_PROGRESS or COMPLETED',
      },
      default: 'IN_PROGRESS',
    },
    discrepancyNotes: {
      type: String,
      maxlength: [500, 'Discrepancy notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'games',
  }
);

// Indexes
gameSchema.index({ startTime: -1 });
gameSchema.index({ status: 1 });
gameSchema.index({ status: 1, startTime: -1 });

// Prevent status from changing from COMPLETED back to IN_PROGRESS
gameSchema.pre('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    const original = this.get('status', String, { getters: false });
    if (original === 'COMPLETED' && this.status === 'IN_PROGRESS') {
      return next(new Error('Cannot change status from COMPLETED to IN_PROGRESS'));
    }
  }
  next();
});

const Game: Model<IGameDocument> =
  mongoose.models.Game || mongoose.model<IGameDocument>('Game', gameSchema);

export default Game;
```

### GameParticipant Model (`src/models/GameParticipant.ts`)

```typescript
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IGameParticipant {
  gameId: Types.ObjectId;
  playerId: Types.ObjectId;
  joinedAt: Date;
  createdAt: Date;
}

export interface IGameParticipantDocument extends IGameParticipant, Document {}

const gameParticipantSchema = new Schema<IGameParticipantDocument>(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Game ID is required'],
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Player ID is required'],
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'gameParticipants',
  }
);

// Indexes - compound unique to prevent duplicate player-game entries
gameParticipantSchema.index({ gameId: 1, playerId: 1 }, { unique: true });
gameParticipantSchema.index({ playerId: 1 });
gameParticipantSchema.index({ gameId: 1 });

const GameParticipant: Model<IGameParticipantDocument> =
  mongoose.models.GameParticipant ||
  mongoose.model<IGameParticipantDocument>('GameParticipant', gameParticipantSchema);

export default GameParticipant;
```

### BuyIn Model (`src/models/BuyIn.ts`)

```typescript
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBuyIn {
  gameParticipantId: Types.ObjectId;
  amount: number;
  timestamp: Date;
  createdAt: Date;
}

export interface IBuyInDocument extends IBuyIn, Document {}

const buyInSchema = new Schema<IBuyInDocument>(
  {
    gameParticipantId: {
      type: Schema.Types.ObjectId,
      ref: 'GameParticipant',
      required: [true, 'Game participant ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
      max: [1000000, 'Amount cannot exceed 1,000,000'],
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value);
        },
        message: 'Amount must be a whole number (no decimals)',
      },
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      validate: {
        validator: function (value: Date) {
          // Allow 5 minutes in the future to account for clock drift
          return value <= new Date(Date.now() + 5 * 60 * 1000);
        },
        message: 'Timestamp cannot be in the future',
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'buyIns',
  }
);

// Indexes
buyInSchema.index({ gameParticipantId: 1, timestamp: -1 });
buyInSchema.index({ timestamp: -1 });

const BuyIn: Model<IBuyInDocument> =
  mongoose.models.BuyIn || mongoose.model<IBuyInDocument>('BuyIn', buyInSchema);

export default BuyIn;
```

### Cashout Model (`src/models/Cashout.ts`)

```typescript
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICashout {
  gameParticipantId: Types.ObjectId;
  amount: number;
  timestamp: Date;
  createdAt: Date;
}

export interface ICashoutDocument extends ICashout, Document {}

const cashoutSchema = new Schema<ICashoutDocument>(
  {
    gameParticipantId: {
      type: Schema.Types.ObjectId,
      ref: 'GameParticipant',
      required: [true, 'Game participant ID is required'],
      unique: true, // Only one cashout per participant
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
      max: [1000000, 'Amount cannot exceed 1,000,000'],
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value);
        },
        message: 'Amount must be a whole number (no decimals)',
      },
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      validate: {
        validator: function (value: Date) {
          // Allow 5 minutes in the future to account for clock drift
          return value <= new Date(Date.now() + 5 * 60 * 1000);
        },
        message: 'Timestamp cannot be in the future',
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'cashouts',
  }
);

// Indexes
cashoutSchema.index({ gameParticipantId: 1 }, { unique: true });
cashoutSchema.index({ timestamp: -1 });

const Cashout: Model<ICashoutDocument> =
  mongoose.models.Cashout || mongoose.model<ICashoutDocument>('Cashout', cashoutSchema);

export default Cashout;
```

### Model Index Export (`src/models/index.ts`)

```typescript
export { default as Player, type IPlayer, type IPlayerDocument } from './Player';
export { default as Game, type IGame, type IGameDocument, type GameStatus } from './Game';
export {
  default as GameParticipant,
  type IGameParticipant,
  type IGameParticipantDocument,
} from './GameParticipant';
export { default as BuyIn, type IBuyIn, type IBuyInDocument } from './BuyIn';
export { default as Cashout, type ICashout, type ICashoutDocument } from './Cashout';
```

## Database Indexes Summary

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| players | `{ name: 1 }` | Unique | Ensure unique player names |
| players | `{ isDeleted: 1 }` | Regular | Filter active players |
| games | `{ startTime: -1 }` | Regular | Sort by most recent |
| games | `{ status: 1 }` | Regular | Filter by status |
| games | `{ status: 1, startTime: -1 }` | Compound | Active games sorted |
| gameParticipants | `{ gameId: 1, playerId: 1 }` | Unique | Prevent duplicate entries |
| gameParticipants | `{ playerId: 1 }` | Regular | Player's games lookup |
| gameParticipants | `{ gameId: 1 }` | Regular | Game's participants lookup |
| buyIns | `{ gameParticipantId: 1, timestamp: -1 }` | Compound | Participant's buy-ins |
| buyIns | `{ timestamp: -1 }` | Regular | Transaction log sorting |
| cashouts | `{ gameParticipantId: 1 }` | Unique | One cashout per participant |
| cashouts | `{ timestamp: -1 }` | Regular | Transaction log sorting |

## Validation Rules Summary

### Player
- Name: required, unique, 1-50 chars, trimmed
- isDeleted: required, defaults to false

### Game
- startTime: required, cannot be in future
- minimumCashoutTime: required, must be >= startTime
- endTime: optional, must be > startTime if provided
- status: enum (IN_PROGRESS, COMPLETED), cannot go from COMPLETED to IN_PROGRESS
- location: optional, max 100 chars
- discrepancyNotes: optional, max 500 chars

### GameParticipant
- gameId: required, references Game
- playerId: required, references Player
- Combination must be unique (no duplicate player in same game)

### BuyIn
- amount: required, integer, 1-1,000,000
- timestamp: required, cannot be in future

### Cashout
- amount: required, integer, 0-1,000,000 (0 for early leave)
- timestamp: required, cannot be in future
- One per gameParticipantId (unique constraint)

## Error Handling

| Error Condition | Expected Behavior | Error Message |
|-----------------|-------------------|---------------|
| Duplicate player name | Validation error | "Player name already exists" |
| Start time in future | Validation error | "Start time cannot be in the future" |
| Amount out of range | Validation error | "Amount must be between X and Y" |
| Decimal amount | Validation error | "Amount must be a whole number" |
| Duplicate participant | Duplicate key error | "Player already in game" |
| Change COMPLETED to IN_PROGRESS | Pre-save hook error | "Cannot change status from COMPLETED" |

## Expected Results

After completing this phase:
1. All 5 models created with TypeScript types
2. Models can be imported and used in API routes
3. Validation rules enforced at database level
4. Indexes created for query optimization
5. No circular dependencies between models

## Validation Steps

1. Import each model in a test file
2. Attempt to create a player with an empty name (should fail)
3. Attempt to create a player with a valid name (should succeed)
4. Attempt to create a game with future start time (should fail)
5. Attempt to create duplicate gameParticipant (should fail)
6. Verify all indexes are created in MongoDB Atlas

### Test Script

```typescript
// Temporary test: src/test-models.ts
import { connectDB } from '@/lib/db';
import { Player, Game, GameParticipant, BuyIn, Cashout } from '@/models';

async function testModels() {
  await connectDB();

  // Test Player creation
  const player = new Player({ name: 'Test Player' });
  await player.save();
  console.log('Player created:', player.toObject());

  // Test validation - should fail
  try {
    const badPlayer = new Player({ name: '' });
    await badPlayer.save();
  } catch (error) {
    console.log('Validation working - empty name rejected');
  }

  // Clean up
  await Player.deleteMany({ name: 'Test Player' });
  console.log('Tests complete');
}

testModels().catch(console.error);
```

## Success Criteria

- [ ] `src/models/Player.ts` created with all validations
- [ ] `src/models/Game.ts` created with status constraints
- [ ] `src/models/GameParticipant.ts` created with compound unique index
- [ ] `src/models/BuyIn.ts` created with amount validation
- [ ] `src/models/Cashout.ts` created with unique constraint
- [ ] `src/models/index.ts` exports all models and types
- [ ] All models import without TypeScript errors
- [ ] `npm run build` completes without errors
- [ ] Manual validation tests pass

## Potential Issues

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Model recompilation error in dev | "Cannot overwrite model" error | Use `mongoose.models.X \|\| mongoose.model()` pattern |
| ObjectId type issues | TypeScript errors | Use `mongoose.Types.ObjectId` |
| Circular import | Models not loading | Use index.ts for central exports |
| Index creation fails | MongoDB Atlas error | Check index limits, field types |
| Validator `this` context wrong | Validation always fails | Use regular functions, not arrow functions |

---

**Phase Dependencies**: Phase 1 (Project Setup)
**Next Phase**: Phase 3 - API Routes
