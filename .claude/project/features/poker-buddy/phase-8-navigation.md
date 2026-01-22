# Phase 8: Navigation and Layout

## Objective

Implement the bottom navigation bar, finalize the app layout structure, and ensure proper navigation flow across all screens. This phase completes the mobile-first navigation experience.

## Prerequisites

- Phase 6 completed (UI components)
- Phase 7 completed (Screen implementations)

## Scope

### In Scope
- Bottom navigation component with 3 tabs
- Active tab indicator
- Safe area handling for mobile devices
- Layout wrapper component
- Route-based active state detection
- Navigation accessibility

### Out of Scope
- Swipe gestures (excluded per spec)
- Animated transitions
- Deep linking

## Implementation Details

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/components/ui/BottomNav.tsx` | Bottom navigation bar | ~100 |
| `src/components/layout/AppLayout.tsx` | Main app layout wrapper | ~40 |
| `src/app/(main)/layout.tsx` | Route group layout | ~20 |

### Files to Modify

| File | Changes |
|------|---------|
| `src/app/page.tsx` | Move to route group |
| `src/app/players/page.tsx` | Move to route group |
| `src/app/leaderboard/page.tsx` | Move to route group |

### Bottom Navigation (`src/components/ui/BottomNav.tsx`)

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    href: '/players',
    label: 'Players',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // Determine which nav item is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Safe area padding for mobile devices with home indicators */}
      <div className="pb-safe">
        <ul className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center h-full px-2 transition-colors',
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {active ? (item.activeIcon || item.icon) : item.icon}
                  <span className="mt-1 text-xs font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
```

### App Layout (`src/components/layout/AppLayout.tsx`)

```typescript
import { BottomNav } from '@/components/ui/BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export function AppLayout({ children, showBottomNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Main content area with bottom padding for nav */}
      <div className={showBottomNav ? 'pb-20' : ''}>
        {children}
      </div>

      {/* Bottom navigation */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
```

### Route Group Layout (`src/app/(main)/layout.tsx`)

Create a route group to share the bottom navigation across main pages.

```typescript
import { AppLayout } from '@/components/layout/AppLayout';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout showBottomNav>{children}</AppLayout>;
}
```

### File Structure Reorganization

Move the main pages into a route group to share the layout:

```
src/app/
├── (main)/                    # Route group (no URL segment)
│   ├── layout.tsx             # Shared layout with bottom nav
│   ├── page.tsx               # Dashboard (/)
│   ├── players/
│   │   ├── page.tsx           # Players list (/players)
│   │   └── [id]/
│   │       └── page.tsx       # Player detail (/players/[id])
│   └── leaderboard/
│       └── page.tsx           # Leaderboard (/leaderboard)
├── games/                     # Outside route group (no bottom nav on game screens)
│   ├── new/
│   │   └── page.tsx
│   ├── history/
│   │   └── page.tsx
│   └── [id]/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── cashout/
│       │   └── page.tsx
│       └── complete/
│           └── page.tsx
├── layout.tsx                 # Root layout
└── api/                       # API routes
```

### Updated Dashboard (`src/app/(main)/page.tsx`)

The dashboard now lives in the route group:

```typescript
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { GameCard } from '@/components/game/GameCard';
import { useActiveGames } from '@/hooks/useApi';

export default function DashboardPage() {
  const { data: activeGames, isLoading, error } = useActiveGames();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Poker Buddy
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <div className="flex gap-3">
            <Link href="/games/new" className="flex-1">
              <Button fullWidth size="lg">
                New Game
              </Button>
            </Link>
            <Link href="/games/history" className="flex-1">
              <Button variant="secondary" fullWidth size="lg">
                History
              </Button>
            </Link>
          </div>
        </section>

        {/* Active Games */}
        <section>
          <Card variant="outlined" padding="none">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <CardTitle>Active Games</CardTitle>
            </div>

            {error && (
              <div className="p-4">
                <p className="text-red-600">Failed to load games: {error}</p>
              </div>
            )}

            {!error && activeGames && activeGames.length === 0 && (
              <EmptyState
                title="No active games"
                description="Start a new game to begin tracking"
                action={
                  <Link href="/games/new">
                    <Button>Start New Game</Button>
                  </Link>
                }
              />
            )}

            {!error && activeGames && activeGames.length > 0 && (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {activeGames.map((game) => (
                  <div key={game._id} className="p-4">
                    <GameCard game={game} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
```

### Updated Players Page (`src/app/(main)/players/page.tsx`)

Same content as before, just moved to route group.

### Updated Leaderboard Page (`src/app/(main)/leaderboard/page.tsx`)

Same content as before, just moved to route group.

### CSS for Safe Area

Add safe area inset support in `globals.css`:

```css
/* Safe area for bottom navigation on notched devices */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Alternative: use tailwind arbitrary values */
/* pb-[env(safe-area-inset-bottom)] */
```

Or configure in Tailwind v4 (if supported):

```js
// tailwind.config.js or CSS
@theme {
  --spacing-safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

### Navigation Flow Summary

```
Dashboard (/)
├── New Game → /games/new → /games/[id]
├── History → /games/history → /games/[id]
└── Active Games → /games/[id]
    ├── Cash Out → /games/[id]/cashout
    └── Complete → /games/[id]/complete

Players (/players)
└── Player Detail → /players/[id]
    └── Game Detail → /games/[id]

Leaderboard (/leaderboard)
└── Player Detail → /players/[id]
```

### Back Navigation Behavior

| Screen | Back Button Behavior |
|--------|---------------------|
| Dashboard | Hidden (home screen) |
| Players List | Hidden (tab screen) |
| Leaderboard | Hidden (tab screen) |
| Player Detail | Goes to /players |
| Game History | Goes to / |
| Game Detail | Goes to / or history (context) |
| Create Game | Goes to / |
| Cashout | Goes to /games/[id] |
| Complete | Goes to /games/[id] |

### Accessibility Considerations

1. **ARIA Labels**: Navigation has proper `aria-label` and `role`
2. **Current Page**: Active tab uses `aria-current="page"`
3. **Focus Management**: Tab order follows visual order
4. **Color Contrast**: Active/inactive states have sufficient contrast
5. **Touch Targets**: Minimum 44x44px touch targets

## Error Handling

| Error Condition | Expected Behavior | Resolution |
|-----------------|-------------------|------------|
| Route not found | 404 page | Create not-found.tsx |
| Navigation fails | Page stays | Handle router errors |
| Safe area not supported | Fallback to 0 | Use env() with fallback |

## Expected Results

After completing this phase:
1. Bottom navigation visible on main screens
2. Active tab highlighted correctly
3. Navigation between tabs works
4. Game screens don't show bottom nav
5. Safe area handled on notched devices

## Validation Steps

1. Navigate between all three tabs
2. Verify active indicator updates
3. Check game screens don't show bottom nav
4. Test on iPhone X+ simulator (notch handling)
5. Verify keyboard navigation works

### Testing Checklist

```markdown
- [ ] Dashboard tab shows Dashboard content
- [ ] Players tab shows Players list
- [ ] Leaderboard tab shows Leaderboard
- [ ] Active tab has different color
- [ ] Tapping inactive tab navigates correctly
- [ ] Game detail pages don't show bottom nav
- [ ] Back button works on nested pages
- [ ] Safe area padding works on notched devices
- [ ] Tab order is correct (left to right)
- [ ] Screen reader announces current tab
```

## Success Criteria

- [ ] BottomNav component created and functional
- [ ] Route group layout configured
- [ ] Files moved to correct locations
- [ ] Active tab indicator works
- [ ] Navigation works between all tabs
- [ ] Game screens don't show bottom nav
- [ ] Safe area CSS added
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Mobile viewport testing passes

## Potential Issues

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Bottom nav overlaps content | Content hidden | Add pb-20 padding |
| Active state not updating | Wrong tab highlighted | Check pathname matching |
| Safe area not working | Content behind home bar | Verify CSS env() support |
| Route group not working | 404 errors | Check file structure |
| Icons not rendering | Empty space | Verify SVG syntax |

## Final Integration Checklist

After completing all 8 phases:

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts development server
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] MongoDB connection works
- [ ] All API routes respond correctly
- [ ] All pages render
- [ ] Forms submit and validate
- [ ] Navigation works end-to-end
- [ ] Mobile layout works (320px-768px)
- [ ] Dark mode works
- [ ] Currency formatting correct
- [ ] Balance colors correct

---

**Phase Dependencies**: Phase 6, Phase 7
**Final Phase**: This completes the Poker Buddy implementation
