# Feature: Poker Buddy - Home Game Cash Tracker

## Summary

Poker Buddy is a mobile-first web application for tracking home poker cash games where 1 chip equals 1 Israeli Shekel (ILS). The app manages players, tracks real-time buy-ins and cashouts during game sessions, validates end-of-game balance discrepancies, and provides comprehensive statistics and leaderboards.

**Key Features:**
- Player management with soft delete
- Real-time game session tracking
- Buy-in/cashout recording with quick-add buttons
- Balance validation (green/yellow/red flags)
- Player statistics and leaderboards
- Mobile-first responsive design with FAB

## Dependencies

### Third-Party Libraries (To Be Installed)

| Library | Version | Purpose | NPM Command |
|---------|---------|---------|-------------|
| mongoose | ^8.x | MongoDB ODM for schema validation and queries | `npm install mongoose` |
| zod | ^3.x | Runtime type validation, shared between client/server | `npm install zod` |
| @types/mongoose | - | TypeScript definitions (included in mongoose 8+) | - |
| date-fns | ^3.x | Date formatting and manipulation | `npm install date-fns` |
| clsx | ^2.x | Conditional CSS class names | `npm install clsx` |
| tailwind-merge | ^2.x | Merge Tailwind classes without conflicts | `npm install tailwind-merge` |

### Already Installed (package.json)

| Library | Version | Purpose |
|---------|---------|---------|
| next | 16.1.4 | React framework with App Router |
| react | 19.2.3 | UI library |
| react-dom | 19.2.3 | React DOM renderer |
| tailwindcss | ^4 | Utility-first CSS framework |
| typescript | ^5 | Static type checking |

### Internal Dependencies (Created During Implementation)

- `src/lib/db.ts` - MongoDB connection singleton
- `src/lib/utils.ts` - Utility functions (cn, formatCurrency)
- `src/types/` - Shared TypeScript types
- `src/schemas/` - Zod validation schemas
- `src/models/` - Mongoose models
- `src/contexts/` - React Context providers

## Architecture Overview

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Dashboard (/)
│   ├── games/
│   │   ├── new/
│   │   │   └── page.tsx          # Create game (/games/new)
│   │   ├── history/
│   │   │   └── page.tsx          # Game history (/games/history)
│   │   └── [id]/
│   │       ├── page.tsx          # Game detail (/games/[id])
│   │       ├── cashout/
│   │       │   └── page.tsx      # Cashout screen (/games/[id]/cashout)
│   │       └── complete/
│   │           └── page.tsx      # Complete game (/games/[id]/complete)
│   ├── players/
│   │   ├── page.tsx              # Players list (/players)
│   │   └── [id]/
│   │       └── page.tsx          # Player detail (/players/[id])
│   ├── leaderboard/
│   │   └── page.tsx              # Leaderboard (/leaderboard)
│   └── api/                      # API Routes
│       ├── players/
│       │   ├── route.ts          # GET all, POST create
│       │   └── [id]/
│       │       └── route.ts      # GET one, PATCH update, DELETE soft-delete
│       ├── games/
│       │   ├── route.ts          # GET all, POST create
│       │   └── [id]/
│       │       ├── route.ts      # GET one
│       │       ├── complete/
│       │       │   └── route.ts  # PATCH complete game
│       │       └── participants/
│       │           └── route.ts  # POST add participant
│       ├── buy-ins/
│       │   ├── route.ts          # POST create
│       │   └── [id]/
│       │       └── route.ts      # PATCH update, DELETE remove
│       ├── cashouts/
│       │   └── route.ts          # POST create (batch)
│       └── leaderboard/
│           └── route.ts          # GET leaderboard
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── FAB.tsx
│   │   ├── BottomNav.tsx
│   │   └── LoadingSpinner.tsx
│   ├── forms/                    # Form components
│   │   ├── PlayerForm.tsx
│   │   ├── GameForm.tsx
│   │   ├── BuyInForm.tsx
│   │   └── CashoutForm.tsx
│   ├── game/                     # Game-specific components
│   │   ├── GameCard.tsx
│   │   ├── ParticipantsList.tsx
│   │   ├── TransactionLog.tsx
│   │   ├── BalanceSummary.tsx
│   │   └── QuickBuyInModal.tsx
│   ├── player/                   # Player-specific components
│   │   ├── PlayerCard.tsx
│   │   ├── PlayerStats.tsx
│   │   └── PlayerGameHistory.tsx
│   └── leaderboard/              # Leaderboard components
│       └── LeaderboardRow.tsx
├── contexts/
│   └── GameContext.tsx           # Real-time game state management
├── lib/
│   ├── db.ts                     # MongoDB connection
│   ├── utils.ts                  # Utility functions
│   └── api.ts                    # API fetch helpers
├── models/                       # Mongoose models
│   ├── Player.ts
│   ├── Game.ts
│   ├── GameParticipant.ts
│   ├── BuyIn.ts
│   └── Cashout.ts
├── schemas/                      # Zod validation schemas
│   ├── player.ts
│   ├── game.ts
│   ├── buyIn.ts
│   └── cashout.ts
└── types/
    ├── index.ts                  # Main type exports
    ├── player.ts
    ├── game.ts
    └── api.ts
```

### State Management

- **Server State**: All data persisted in MongoDB, fetched via API routes
- **Client State**: React Context for active game session (optimistic updates)
- **No Zustand Required**: Spec mentions Zustand as optional; React Context is sufficient for this app

### Navigation

- **Bottom Navigation Bar**: Dashboard | Players | Leaderboard (3 tabs)
- **Nested Routes**: Games and Players have detail views
- **Modal Overlays**: Add Player, Quick Buy-In (no route change)

### API Integration

All endpoints defined in specification:
- `/api/players` - Player CRUD
- `/api/games` - Game CRUD
- `/api/games/[id]/participants` - Add players to game
- `/api/games/[id]/complete` - Complete game
- `/api/buy-ins` - Buy-in management
- `/api/cashouts` - Cashout recording
- `/api/leaderboard` - Leaderboard aggregation

## Phase Summary

| Phase | Name | Description | Complexity | Est. Time |
|-------|------|-------------|------------|-----------|
| 1 | Project Setup | Install dependencies, configure MongoDB connection | Low | 1-2 hours |
| 2 | Database Models | Create Mongoose schemas with validation | Medium | 2-3 hours |
| 3 | API Routes | Implement all API endpoints | High | 4-6 hours |
| 4 | Shared Types | TypeScript types and Zod schemas | Low | 1-2 hours |
| 5 | State Management | GameContext for real-time updates | Medium | 2-3 hours |
| 6 | UI Components | Base components (Button, Input, Modal, FAB) | Medium | 3-4 hours |
| 7 | Screens | All page implementations | High | 6-8 hours |
| 8 | Navigation | Bottom nav, routing, mobile optimization | Medium | 2-3 hours |

**Total Estimated Effort: 21-31 hours**

## Success Criteria

- [ ] All 20 requirements from specification are implemented
- [ ] All API endpoints return correct responses per spec
- [ ] Mobile-first design works on 320px-768px screens
- [ ] Currency formatting displays correctly (e.g., "1,500 ₪")
- [ ] Balance validation shows correct colors (green/yellow/red)
- [ ] FAB appears only on in-progress games
- [ ] Completed games are read-only
- [ ] Soft delete preserves player history
- [ ] All forms validate on both client and server
- [ ] Application deploys successfully to Vercel

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MongoDB connection issues | Medium | High | Implement connection retry logic, proper error handling |
| Complex aggregation queries for leaderboard | Medium | Medium | Use MongoDB aggregation pipeline, add indexes |
| Real-time state sync issues | Medium | Medium | Optimistic updates with server validation, refetch on error |
| Mobile keyboard obscuring inputs | Low | Medium | Use proper input types, scroll into view on focus |
| Large transaction logs performance | Low | Medium | Implement pagination or virtual scrolling if needed |
| Tailwind v4 compatibility issues | Low | Low | Verify class names work, fallback to v3 patterns if needed |

## Environment Variables Required

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

## Design Tokens

### Colors (Tailwind)
- **Primary**: `blue-600` (buttons, links)
- **Success/Profit**: `green-600` (positive P/L, balanced games)
- **Warning/Extra**: `yellow-600` (extra chips - cashouts < buy-ins)
- **Danger/Loss**: `red-600` (missing chips, negative P/L, delete actions)
- **Background**: `zinc-50` (light), `zinc-900` (dark)
- **Surface**: `white` (light), `zinc-800` (dark)
- **Text**: `zinc-900` (primary), `zinc-500` (secondary)

### Spacing
- **Page Padding**: `p-4` (16px)
- **Card Padding**: `p-4` (16px)
- **Button Height**: `h-12` (48px) - touch-friendly
- **Input Height**: `h-12` (48px)
- **FAB Size**: `w-14 h-14` (56px)
- **Bottom Nav Height**: `h-16` (64px)
- **Safe Area**: `pb-20` (80px) for bottom nav

### Typography
- **Page Title**: `text-2xl font-bold`
- **Section Title**: `text-lg font-semibold`
- **Body**: `text-base`
- **Caption**: `text-sm text-zinc-500`
- **Amount**: `font-mono` for numeric values

## Data Model Summary

### Collections
1. **players** - Player records with soft delete
2. **games** - Game sessions with status tracking
3. **gameParticipants** - Junction table (player-game relationship)
4. **buyIns** - Individual buy-in transactions
5. **cashouts** - Final cashout amounts (one per participant)

### Key Relationships
- Game has many GameParticipants
- GameParticipant belongs to one Player and one Game
- GameParticipant has many BuyIns
- GameParticipant has zero or one Cashout

### Balance Calculation Logic
```
totalBuyIns = SUM(all buy-in amounts for game)
totalCashouts = SUM(all cashout amounts for game)
discrepancy = totalCashouts - totalBuyIns

if (discrepancy === 0) → GREEN (balanced)
if (discrepancy < 0)  → YELLOW (extra chips - more money in than out)
if (discrepancy > 0)  → RED (missing chips - more money out than in)
```

## Next Steps

1. Begin with **Phase 1: Project Setup** to install dependencies
2. Create MongoDB Atlas cluster and obtain connection string
3. Follow phases sequentially - each builds on the previous
4. Each phase has clear validation steps to verify completion

---

**Architecture Version**: 1.0.0
**Last Updated**: 2026-01-22
**Specification Reference**: `.claude/poker-buddy-specification.json`
