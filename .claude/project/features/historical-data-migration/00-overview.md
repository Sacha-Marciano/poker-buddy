# Feature: Historical Data Migration (Schema Updates + Seed Script)

## Summary

Two-part feature to (1) extend the poker-buddy schema with fields discovered in legacy Hold'em House data, and (2) seed the database with 26 players, 15 games, ~85 cashouts, and ~400 buy-in records from the old app. Phase 1 must be fully complete before Phase 2 begins.

### New Fields

| Model   | Field        | Type    | Required | Default   | Purpose                                    |
|---------|--------------|---------|----------|-----------|--------------------------------------------|
| Player  | phone        | String  | No       | undefined | Player phone number                        |
| Player  | avatarColor  | String  | No       | undefined | Hex color for avatar display               |
| BuyIn   | isRebuy      | Boolean | No       | false     | Distinguishes initial buy-in from rebuys   |
| Cashout | finalChips   | Number  | No       | undefined | Actual chip count at cashout time          |

## Dependencies

### Third-Party Libraries

No new libraries required. The project already has:

| Library  | Version | Purpose                   |
|----------|---------|---------------------------|
| mongoose | ^9.1.5  | MongoDB ODM               |
| zod      | ^4.3.5  | Schema validation         |
| next     | 16.1.4  | Framework (API routes)    |
| date-fns | ^4.1.0  | Date formatting           |

### Internal Dependencies

- `src/models/Player.ts` - Mongoose model
- `src/models/BuyIn.ts` - Mongoose model
- `src/models/Cashout.ts` - Mongoose model
- `src/models/Game.ts` - Mongoose model (unchanged, but used by seed)
- `src/models/GameParticipant.ts` - Mongoose model (unchanged, but used by seed)
- `src/models/Settlement.ts` - Mongoose model (unchanged, but used by seed)
- `src/schemas/player.ts` - Zod validation
- `src/schemas/transaction.ts` - Zod validation
- `src/types/player.ts` - TypeScript types
- `src/types/transaction.ts` - TypeScript types
- `src/types/api.ts` - API request/response types
- `src/lib/db.ts` - Database connection
- `src/lib/api.ts` - Client-side API wrappers
- `src/app/api/players/route.ts` - Player API
- `src/app/api/players/[id]/route.ts` - Player detail API
- `src/app/api/buy-ins/route.ts` - Buy-in API
- `src/app/api/cashouts/route.ts` - Cashout API
- `src/app/api/games/[id]/complete/route.ts` - Game completion API
- `src/app/api/games/[id]/route.ts` - Game detail API
- `src/app/players/page.tsx` - Players list page
- `src/app/games/[id]/page.tsx` - Game detail page
- `src/app/leaderboard/page.tsx` - Leaderboard page
- `src/components/game/ParticipantCard.tsx` - Participant card component
- `src/components/game/AddParticipantModal.tsx` - Add participant modal
- `src/components/game/EndGameModal.tsx` - End game modal

## Architecture Overview

### Phase 1: Schema & Code Updates

Touches every layer of the stack (model -> schema -> types -> API -> UI) for four new fields. All new fields are optional with sensible defaults, so existing functionality is not broken.

**Key design decisions:**
- `phone` and `avatarColor` are optional strings on Player - no validation beyond format
- `isRebuy` defaults to `false` on BuyIn, so existing buy-ins are treated as non-rebuys
- `finalChips` is optional on Cashout - existing cashouts simply lack this field
- The Player API `GET /api/players` aggregation should include `phone` and `avatarColor` in its projection
- The buy-in creation API should accept an optional `isRebuy` field
- The cashout creation API (both standalone and game-complete) should accept optional `finalChips`
- UI changes are cosmetic: avatar color circle, phone display, rebuy badge, finalChips display

### Phase 2: Seed Script

A standalone TypeScript script (`scripts/seed-historical-data.ts`) that:
1. Connects to MongoDB using the project's `connectDB()` utility
2. Checks for existing data (idempotent)
3. Creates all entities in order: Players -> Games -> GameParticipants -> BuyIns -> Cashouts -> Settlements
4. Uses the project's Mongoose models directly
5. Runs with `npx tsx scripts/seed-historical-data.ts`

## Phase Summary

| Phase | Name                  | Description                                        | Complexity |
|-------|-----------------------|----------------------------------------------------|------------|
| 1     | schema-code-updates   | Add new fields to models, schemas, types, API, UI  | Medium     |
| 2     | seed-script           | Create and validate historical data seed script    | High       |

## Success Criteria

- [ ] All four new fields exist in Mongoose models with correct types and defaults
- [ ] Zod schemas validate the new fields correctly (optional with proper constraints)
- [ ] TypeScript types include the new fields across all layers
- [ ] API routes accept and return the new fields
- [ ] UI displays avatar color, phone, rebuy badge, and finalChips where appropriate
- [ ] Existing functionality is not broken (all optional fields, backward-compatible)
- [ ] Seed script creates all 26 players, 15 games, ~400 buy-ins, ~85 cashouts, and settlements
- [ ] Seed script is idempotent (safe to run multiple times)
- [ ] `npm run build` passes after all changes

## Risks & Mitigations

| Risk                                         | Likelihood | Impact | Mitigation                                                       |
|----------------------------------------------|------------|--------|------------------------------------------------------------------|
| Breaking existing data by adding fields      | Low        | High   | All new fields are optional with defaults; no migration needed   |
| Mongoose timestamp validator blocks old dates | Medium     | Medium | Seed script must bypass or disable date validators for seed data |
| Duplicate player names in seed data          | Low        | Medium | Seed script checks for existing players by name before inserting |
| Settlement calculation mismatch              | Medium     | Medium | Reuse the existing `calculateSettlements` logic in seed script   |
| BuyIn.timestamp validator rejects past dates | High       | Medium | Seed data has dates from the past; must skip future-check or use model directly with validateBeforeSave: false |

## Estimated Total Effort

Medium-High. Phase 1 is straightforward but touches many files. Phase 2 requires careful data mapping and handling of Mongoose validation for historical dates.
