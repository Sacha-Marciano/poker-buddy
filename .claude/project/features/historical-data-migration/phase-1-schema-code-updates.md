# Phase 1: Schema & Code Updates

## Objective

Add four new fields (`Player.phone`, `Player.avatarColor`, `BuyIn.isRebuy`, `Cashout.finalChips`) across all layers of the stack: Mongoose models, Zod validation schemas, TypeScript types, API routes, and UI components.

## Prerequisites

- None (this is the first phase)

## Scope

### In Scope

- Mongoose model updates (Player, BuyIn, Cashout)
- Zod schema updates (player.ts, transaction.ts)
- TypeScript type updates (player.ts, transaction.ts, api.ts, game.ts)
- API route updates (players, buy-ins, cashouts, game-complete, game-detail)
- Client API wrapper updates (lib/api.ts)
- UI component updates (ParticipantCard, AddParticipantModal, PlayersPage, LeaderboardPage, GameDetailPage, EndGameModal)

### Out of Scope

- Database migration (not needed - all fields are optional)
- New pages or routes
- Seed data
- Player detail page (does not exist in the app yet)

## Implementation Details

### 1. Mongoose Models

#### Files to Modify

| File                    | Changes                                          |
|-------------------------|--------------------------------------------------|
| `src/models/Player.ts`  | Add `phone` and `avatarColor` fields + interface |
| `src/models/BuyIn.ts`   | Add `isRebuy` field + interface                  |
| `src/models/Cashout.ts` | Add `finalChips` field + interface               |

#### Player.ts Changes

Add to `IPlayer` interface:
```typescript
export interface IPlayer {
  name: string;
  phone?: string;
  avatarColor?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Add to playerSchema fields (after `isDeleted`):
```typescript
phone: {
  type: String,
  trim: true,
  maxlength: [20, 'Phone number cannot exceed 20 characters'],
},
avatarColor: {
  type: String,
  trim: true,
  maxlength: [7, 'Avatar color must be a valid hex color'],
  validate: {
    validator: function (value: string) {
      if (!value) return true;
      return /^#[0-9A-Fa-f]{6}$/.test(value);
    },
    message: 'Avatar color must be a valid hex color (e.g., #FF6B6B)',
  },
},
```

#### BuyIn.ts Changes

Add to `IBuyIn` interface:
```typescript
export interface IBuyIn {
  gameParticipantId: Types.ObjectId;
  amount: number;
  isRebuy: boolean;
  timestamp: Date;
  createdAt: Date;
}
```

Add to buyInSchema fields (after `amount`):
```typescript
isRebuy: {
  type: Boolean,
  required: true,
  default: false,
},
```

#### Cashout.ts Changes

Add to `ICashout` interface:
```typescript
export interface ICashout {
  gameParticipantId: Types.ObjectId;
  amount: number;
  finalChips?: number;
  timestamp: Date;
  createdAt: Date;
}
```

Add to cashoutSchema fields (after `amount`):
```typescript
finalChips: {
  type: Number,
  min: [0, 'Final chips cannot be negative'],
  max: [1000000, 'Final chips cannot exceed 1,000,000'],
  validate: {
    validator: function (value: number | undefined) {
      if (value === undefined || value === null) return true;
      return Number.isInteger(value);
    },
    message: 'Final chips must be a whole number',
  },
},
```

### 2. Zod Validation Schemas

#### Files to Modify

| File                       | Changes                                            |
|----------------------------|----------------------------------------------------|
| `src/schemas/player.ts`    | Add phone and avatarColor to create/update schemas |
| `src/schemas/transaction.ts` | Add isRebuy to buy-in, finalChips to cashout     |

#### player.ts Changes

```typescript
export const createPlayerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  phone: z
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  avatarColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #FF6B6B)')
    .optional()
    .or(z.literal('')),
});

export const updatePlayerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  phone: z
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  avatarColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #FF6B6B)')
    .optional()
    .or(z.literal('')),
});
```

#### transaction.ts Changes

Add `isRebuy` to `createBuyInSchema`:
```typescript
export const createBuyInSchema = z.object({
  gameParticipantId: z.string().min(1, 'Game participant ID is required'),
  amount: amountSchema,
  isRebuy: z.boolean().optional().default(false),
  timestamp: z.string().datetime().optional(),
});
```

Add `finalChips` to `cashoutItemSchema`:
```typescript
const cashoutItemSchema = z.object({
  gameParticipantId: z.string().min(1, 'Game participant ID is required'),
  amount: cashoutAmountSchema,
  finalChips: z
    .number()
    .int('Final chips must be a whole number')
    .min(0, 'Final chips cannot be negative')
    .max(1000000, 'Final chips cannot exceed 1,000,000')
    .optional(),
});
```

### 3. TypeScript Types

#### Files to Modify

| File                      | Changes                                           |
|---------------------------|----------------------------------------------------|
| `src/types/player.ts`     | Add phone, avatarColor to Player and PlayerWithStats |
| `src/types/transaction.ts` | Add isRebuy to BuyIn, finalChips to Cashout       |
| `src/types/api.ts`        | Add new fields to request types                    |
| `src/types/game.ts`       | Add isRebuy to GameTransaction                     |

#### player.ts Changes

```typescript
export interface Player {
  _id: string;
  name: string;
  phone?: string;
  avatarColor?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerWithStats {
  _id: string;
  name: string;
  phone?: string;
  avatarColor?: string;
  totalGamesPlayed: number;
  totalBuyIns: number;
  totalCashouts: number;
  totalProfitLoss: number;
}
```

Also add `phone` and `avatarColor` to `PlayerDetail`:
```typescript
export interface PlayerDetail {
  _id: string;
  name: string;
  phone?: string;
  avatarColor?: string;
  totalGamesPlayed: number;
  // ... rest unchanged
}
```

Also add `avatarColor` to `LeaderboardEntry`:
```typescript
export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avatarColor?: string;
  totalGamesPlayed: number;
  // ... rest unchanged
}
```

#### transaction.ts Changes

```typescript
export interface BuyIn {
  _id: string;
  gameParticipantId: string;
  amount: number;
  isRebuy: boolean;
  timestamp: string;
  createdAt: string;
}

export interface Cashout {
  _id: string;
  gameParticipantId: string;
  amount: number;
  finalChips?: number;
  timestamp: string;
  createdAt: string;
}
```

#### api.ts Changes

```typescript
export interface CreatePlayerRequest {
  name: string;
  phone?: string;
  avatarColor?: string;
}

export interface UpdatePlayerRequest {
  name: string;
  phone?: string;
  avatarColor?: string;
}

export interface CreateBuyInRequest {
  gameParticipantId: string;
  amount: number;
  isRebuy?: boolean;
  timestamp?: string;
}

export interface CreateCashoutsRequest {
  gameId: string;
  cashouts: Array<{
    gameParticipantId: string;
    amount: number;
    finalChips?: number;
  }>;
}

export interface CompleteGameRequest {
  cashouts: Array<{
    gameParticipantId: string;
    amount: number;
    finalChips?: number;
  }>;
  discrepancyNotes?: string;
}
```

#### game.ts Changes

Add `isRebuy` to `GameTransaction`:
```typescript
export interface GameTransaction {
  _id: string;
  playerId: string;
  playerName: string;
  amount: number;
  isRebuy?: boolean;
  timestamp: string;
  type: 'BUY_IN' | 'CASHOUT';
}
```

Add `avatarColor` to `GameParticipant`:
```typescript
export interface GameParticipant {
  _id: string;
  playerId: string;
  playerName: string;
  avatarColor?: string;
  joinedAt: string;
  buyInCount: number;
  totalBuyIns: number;
  totalCashouts: number;
  hasCashedOut: boolean;
  profitLoss: number;
}
```

### 4. API Route Updates

#### Files to Modify

| File                                           | Changes                                              |
|------------------------------------------------|------------------------------------------------------|
| `src/app/api/players/route.ts`                 | Accept phone/avatarColor in POST; include in GET projection |
| `src/app/api/players/[id]/route.ts`            | Accept phone/avatarColor in PATCH; include in GET response  |
| `src/app/api/buy-ins/route.ts`                 | Accept isRebuy in POST                               |
| `src/app/api/cashouts/route.ts`                | Accept finalChips in POST                             |
| `src/app/api/games/[id]/complete/route.ts`     | Accept finalChips in cashout items                    |
| `src/app/api/games/[id]/route.ts`              | Include avatarColor in participant projection; isRebuy in buy-in transactions |
| `src/app/api/leaderboard/route.ts`             | Include avatarColor in leaderboard projection         |

#### Players GET (route.ts) - Aggregation projection update

Add to the `$project` stage:
```javascript
phone: 1,
avatarColor: 1,
```

#### Players POST (route.ts) - Schema and create update

Update inline schema:
```typescript
const createPlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').trim(),
  phone: z.string().max(20).trim().optional().or(z.literal('')),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
});
```

Update create call:
```typescript
const player = await Player.create({
  name,
  ...(phone && { phone }),
  ...(avatarColor && { avatarColor }),
});
```

#### Players [id] GET - Response update

Add `phone` and `avatarColor` to the response:
```typescript
return successResponse({
  _id: player._id,
  name: player.name,
  phone: player.phone,
  avatarColor: player.avatarColor,
  totalGamesPlayed,
  // ... rest unchanged
});
```

#### Players [id] PATCH - Accept new fields

Update inline schema and save logic:
```typescript
const updatePlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').trim(),
  phone: z.string().max(20).trim().optional().or(z.literal('')),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
});

// In handler:
const { name, phone, avatarColor } = updatePlayerSchema.parse(body);
player.name = name;
if (phone !== undefined) player.phone = phone || undefined;
if (avatarColor !== undefined) player.avatarColor = avatarColor || undefined;
await player.save();
```

#### Buy-ins POST - Accept isRebuy

Update inline schema:
```typescript
const createBuyInSchema = z.object({
  gameParticipantId: z.string().min(1, 'Game participant ID is required'),
  amount: z.number().int().min(1).max(1000000),
  isRebuy: z.boolean().optional().default(false),
  timestamp: z.string().datetime().optional(),
});
```

Update create call:
```typescript
const buyIn = await BuyIn.create({
  gameParticipantId: data.gameParticipantId,
  amount: data.amount,
  isRebuy: data.isRebuy,
  timestamp,
});
```

#### Cashouts POST - Accept finalChips

Update inline `cashoutItemSchema`:
```typescript
const cashoutItemSchema = z.object({
  gameParticipantId: z.string().min(1),
  amount: z.number().int().min(0).max(1000000),
  finalChips: z.number().int().min(0).max(1000000).optional(),
});
```

Update insertMany map:
```typescript
const createdCashouts = await Cashout.insertMany(
  data.cashouts.map((c) => ({
    gameParticipantId: c.gameParticipantId,
    amount: c.amount,
    finalChips: c.finalChips,
    timestamp: now,
  }))
);
```

#### Games [id] complete - Accept finalChips

Same `cashoutItemSchema` update as cashouts route. Update the Cashout.insertMany call to include `finalChips`:
```typescript
await Cashout.insertMany(
  data.cashouts.map((c) => ({
    gameParticipantId: c.gameParticipantId,
    amount: c.amount,
    finalChips: c.finalChips,
    timestamp: now,
  }))
);
```

#### Games [id] GET - Include new fields in projections

In the participants aggregation, add `avatarColor` to the `$project`:
```javascript
avatarColor: '$player.avatarColor',
```

In the buyIns aggregation, add `isRebuy` to the `$project`:
```javascript
isRebuy: 1,
```

#### Leaderboard GET - Include avatarColor

Read the leaderboard route and add `avatarColor` to the aggregation projection. (This file needs to be checked -- it likely uses a similar aggregation to the players route.)

### 5. Client API Wrapper Updates

#### File to Modify

| File               | Changes                                   |
|--------------------|-------------------------------------------|
| `src/lib/api.ts`   | Type imports already pull from types/*.ts  |

No changes needed to `src/lib/api.ts` itself -- it already uses the TypeScript types from `src/types/api.ts` which will be updated. The function signatures accept the full request types, so adding optional fields to those types is sufficient.

### 6. UI Component Updates

#### Files to Modify

| File                                              | Changes                                              |
|---------------------------------------------------|------------------------------------------------------|
| `src/app/players/page.tsx`                        | Show avatar color circle next to player name         |
| `src/app/leaderboard/page.tsx`                    | Use avatar color for rank circle                     |
| `src/app/games/[id]/page.tsx`                     | Show rebuy badge in transaction list                 |
| `src/components/game/ParticipantCard.tsx`         | Show avatar color circle next to player name         |
| `src/components/game/AddParticipantModal.tsx`     | Show avatar color circle in player list              |

#### Avatar Color Display Pattern

Use a consistent avatar circle component pattern wherever player names appear:
```tsx
{/* Avatar Color Circle */}
<div
  className="w-8 h-8 rounded-full flex-shrink-0"
  style={{ backgroundColor: player.avatarColor || '#6B7280' }}
/>
```

The default color `#6B7280` (zinc-500) is used when no avatarColor is set.

#### Players Page (`src/app/players/page.tsx`)

Add avatar color circle before player name in the player list cards:
```tsx
<div className="flex items-center gap-3">
  <div
    className="w-8 h-8 rounded-full flex-shrink-0"
    style={{ backgroundColor: player.avatarColor || '#6B7280' }}
  />
  <div className="flex-1 min-w-0">
    <h3 className="font-semibold text-white truncate">
      {player.name}
    </h3>
    {/* existing stats line */}
  </div>
</div>
```

#### Leaderboard Page (`src/app/leaderboard/page.tsx`)

Replace the rank circle with avatar-colored circle (keeping rank number inside):
```tsx
<div
  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white"
  style={{ backgroundColor: entry.avatarColor || '#6B7280' }}
>
  {index + 1}
</div>
```

#### ParticipantCard (`src/components/game/ParticipantCard.tsx`)

Add avatar color circle before participant name. The component receives `GameParticipant` which will have `avatarColor`:
```tsx
<div className="flex items-center gap-3">
  <div
    className="w-10 h-10 rounded-full flex-shrink-0"
    style={{ backgroundColor: participant.avatarColor || '#6B7280' }}
  />
  <div className="flex-1">
    <h3 className="text-xl font-bold text-white">
      {participant.playerName}
    </h3>
    {/* existing stats line */}
  </div>
</div>
```

#### Game Detail Page - Transaction List (`src/app/games/[id]/page.tsx`)

Add a "Rebuy" badge next to buy-in transactions when `isRebuy` is true:
```tsx
<Badge variant={tx.type === 'BUY_IN' ? 'danger' : 'success'} size="sm">
  {tx.type === 'BUY_IN' ? (tx.isRebuy ? 'Rebuy' : 'Buy-in') : 'Cashout'}
</Badge>
```

#### AddParticipantModal (`src/components/game/AddParticipantModal.tsx`)

Add avatar color circle in the available players list:
```tsx
<div className="flex items-center gap-3">
  <div
    className="w-8 h-8 rounded-full flex-shrink-0"
    style={{ backgroundColor: player.avatarColor || '#6B7280' }}
  />
  <div>
    <p className="font-medium text-white">{player.name}</p>
    <p className="text-sm text-zinc-400">{player.totalGamesPlayed} games</p>
  </div>
</div>
```

**Note on phone display:** The phone field is stored but does NOT need to be displayed in the current UI. It will be available in the data and can be shown on a future player detail page. No UI change is needed for phone in this phase.

**Note on finalChips display:** The `finalChips` field is stored but the current cashout display already shows the `amount` (which represents the cashout value). `finalChips` is supplementary data. No UI change is needed for `finalChips` in this phase.

## Error Handling

| Error Condition                      | Expected Behavior                     | User Feedback              |
|--------------------------------------|---------------------------------------|----------------------------|
| Invalid hex color format             | Zod/Mongoose validation rejects       | Form error message         |
| Phone number too long                | Zod/Mongoose validation rejects       | Form error message         |
| Missing optional fields              | Treated as undefined, no error        | None needed                |
| Old data without new fields          | Fields remain undefined, app works    | None needed                |

## Expected Results

When this phase is complete:
1. Player documents can store `phone` and `avatarColor`
2. BuyIn documents can store `isRebuy` (defaults to `false`)
3. Cashout documents can store `finalChips`
4. API routes accept and return all new fields
5. Player list and participant cards show colored avatar circles
6. Leaderboard uses avatar colors
7. Transaction list shows "Rebuy" badge for rebuy transactions
8. All existing functionality remains intact

## Validation Steps

1. `npm run build` passes without errors
2. `npm run lint` passes
3. Create a new player via UI -- should work as before (no required new fields)
4. Create a player via API with `phone` and `avatarColor` -- fields should persist
5. Add a buy-in via API with `isRebuy: true` -- field should persist
6. End a game with `finalChips` in cashout data -- field should persist
7. Player list shows avatar circles with default gray color
8. Leaderboard shows avatar-colored rank circles
9. Verify existing games/players still load correctly without new fields

## Success Criteria

- [ ] `IPlayer` interface includes `phone?: string` and `avatarColor?: string`
- [ ] `IBuyIn` interface includes `isRebuy: boolean`
- [ ] `ICashout` interface includes `finalChips?: number`
- [ ] Mongoose schemas include the new fields with proper validation
- [ ] Zod schemas validate the new fields (optional with format constraints)
- [ ] All TypeScript types updated (Player, PlayerWithStats, PlayerDetail, LeaderboardEntry, BuyIn, Cashout, GameTransaction, GameParticipant, request types)
- [ ] All API routes updated to accept/return new fields
- [ ] Player list page shows avatar color circles
- [ ] Leaderboard page uses avatar colors
- [ ] ParticipantCard shows avatar color circle
- [ ] Transaction list shows "Rebuy" badge for rebuy transactions
- [ ] `npm run build` passes
- [ ] Existing data without new fields still works correctly

## Potential Issues

| Issue                                          | Detection                | Resolution                                        |
|------------------------------------------------|--------------------------|---------------------------------------------------|
| Inline Zod schemas in API routes vs shared schemas | Code review            | API routes define their own inline Zod schemas -- update both inline and shared |
| Aggregation pipelines missing new fields       | Fields not in API response | Add fields to `$project` stages in all relevant aggregations |
| avatarColor not propagated through game detail  | Missing on ParticipantCard | Must add to game detail aggregation `$project` via player lookup |
| Leaderboard aggregation missing avatarColor    | Missing on leaderboard   | Add `avatarColor: 1` to the `$project` stage in leaderboard route (it already has access to Player fields via the `$match` on players collection) |

### Leaderboard Route Specifics

The leaderboard route (`src/app/api/leaderboard/route.ts`) aggregates directly from the Player collection. The `$project` stage should add:
```javascript
avatarColor: 1,
```
This works because the aggregation starts from `Player` documents, which will have the new `avatarColor` field.
