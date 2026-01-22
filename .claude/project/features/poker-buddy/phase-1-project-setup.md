# Phase 1: Project Setup

## Objective

Install all required dependencies, configure MongoDB connection, set up utility functions, and establish the project structure foundation.

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account created
- MongoDB cluster provisioned with connection string

## Scope

### In Scope
- Installing npm dependencies (mongoose, zod, date-fns, clsx, tailwind-merge)
- Creating MongoDB connection utility with singleton pattern
- Setting up environment variables
- Creating utility functions (cn, formatCurrency)
- Updating layout.tsx with proper metadata
- Creating folder structure

### Out of Scope
- Mongoose schema definitions (Phase 2)
- API routes (Phase 3)
- UI components (Phase 6)

## Implementation Details

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/lib/db.ts` | MongoDB connection singleton | ~40 |
| `src/lib/utils.ts` | Utility functions (cn, formatCurrency) | ~30 |
| `.env.local` | Environment variables (template) | ~5 |
| `.env.example` | Environment variables example | ~5 |

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add new dependencies |
| `src/app/layout.tsx` | Update metadata, add viewport config |
| `.gitignore` | Ensure .env.local is ignored |

### Dependencies to Install

```bash
npm install mongoose zod date-fns clsx tailwind-merge
```

### MongoDB Connection (`src/lib/db.ts`)

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
```

### Utility Functions (`src/lib/utils.ts`)

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format amount as Israeli Shekel currency
 * @param amount - Number to format
 * @returns Formatted string (e.g., "1,500 ₪")
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} ₪`;
}

/**
 * Format amount with sign for P/L display
 * @param amount - Number to format (can be negative)
 * @returns Formatted string with sign (e.g., "+1,500 ₪" or "-500 ₪")
 */
export function formatProfitLoss(amount: number): string {
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${formatCurrency(amount)}`;
}

/**
 * Get CSS class for profit/loss color
 * @param amount - P/L amount
 * @returns Tailwind color class
 */
export function getProfitLossColor(amount: number): string {
  if (amount > 0) return 'text-green-600';
  if (amount < 0) return 'text-red-600';
  return 'text-zinc-600';
}

/**
 * Get balance status from discrepancy
 * @param discrepancy - totalCashouts - totalBuyIns
 * @returns Status string
 */
export function getBalanceStatus(discrepancy: number): 'GREEN' | 'YELLOW' | 'RED' {
  if (discrepancy === 0) return 'GREEN';
  if (discrepancy < 0) return 'YELLOW'; // Extra chips (more in than out)
  return 'RED'; // Missing chips (more out than in)
}

/**
 * Get balance status color class
 */
export function getBalanceStatusColor(status: 'GREEN' | 'YELLOW' | 'RED'): string {
  switch (status) {
    case 'GREEN': return 'text-green-600 bg-green-100';
    case 'YELLOW': return 'text-yellow-600 bg-yellow-100';
    case 'RED': return 'text-red-600 bg-red-100';
  }
}
```

### Environment Variables (`.env.local`)

```env
# MongoDB Atlas connection string
# Get this from your MongoDB Atlas dashboard: Database > Connect > Drivers
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/poker-buddy?retryWrites=true&w=majority
```

### Environment Example (`.env.example`)

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/poker-buddy?retryWrites=true&w=majority
```

### Updated Layout (`src/app/layout.tsx`)

```typescript
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Poker Buddy',
  description: 'Track your home poker cash games',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Poker Buddy',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#18181b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-900`}
      >
        {children}
      </body>
    </html>
  );
}
```

### Folder Structure to Create

```bash
# Create all required directories
mkdir -p src/lib
mkdir -p src/models
mkdir -p src/schemas
mkdir -p src/types
mkdir -p src/contexts
mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/game
mkdir -p src/components/player
mkdir -p src/components/leaderboard
mkdir -p src/app/api/players/[id]
mkdir -p src/app/api/games/[id]/complete
mkdir -p src/app/api/games/[id]/participants
mkdir -p src/app/api/buy-ins/[id]
mkdir -p src/app/api/cashouts
mkdir -p src/app/api/leaderboard
mkdir -p src/app/games/new
mkdir -p src/app/games/history
mkdir -p src/app/games/[id]/cashout
mkdir -p src/app/games/[id]/complete
mkdir -p src/app/players/[id]
mkdir -p src/app/leaderboard
```

## Error Handling

| Error Condition | Expected Behavior | User Feedback |
|-----------------|-------------------|---------------|
| MONGODB_URI not defined | Throw error at import time | Build fails with clear message |
| MongoDB connection fails | Throw error, log details | API returns 500 with error message |
| Invalid environment variable format | Connection rejected | Error logged, API returns 500 |

## Expected Results

After completing this phase:
1. All dependencies installed and importable
2. `npm run dev` starts without errors
3. `npm run build` completes successfully
4. MongoDB connection utility ready for use
5. Utility functions available for currency formatting
6. Folder structure in place for subsequent phases

## Validation Steps

1. Run `npm install mongoose zod date-fns clsx tailwind-merge`
2. Verify package.json includes all dependencies
3. Create `.env.local` with valid MongoDB URI
4. Run `npm run dev` - should start without errors
5. Run `npm run build` - should complete without errors
6. Run `npm run lint` - should pass

### Manual Test Script

```typescript
// Create a test file: src/lib/db.test.ts (temporary)
import { connectDB } from './db';

async function testConnection() {
  try {
    const mongoose = await connectDB();
    console.log('MongoDB connected successfully');
    console.log('Connection state:', mongoose.connection.readyState);
    await mongoose.disconnect();
    console.log('Disconnected successfully');
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
```

## Success Criteria

- [ ] All npm packages installed (mongoose, zod, date-fns, clsx, tailwind-merge)
- [ ] `.env.local` created with MONGODB_URI
- [ ] `.env.example` created for documentation
- [ ] `src/lib/db.ts` created with connection singleton
- [ ] `src/lib/utils.ts` created with utility functions
- [ ] `src/app/layout.tsx` updated with proper metadata
- [ ] All folder directories created
- [ ] `npm run dev` starts successfully
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes

## Potential Issues

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Mongoose version mismatch with Next.js | Import errors, type errors | Use mongoose ^8.x which supports ESM |
| Missing TypeScript types | Red squiggles in IDE | mongoose 8+ includes types |
| Environment variable not loading | Connection fails | Restart dev server after creating .env.local |
| Tailwind v4 breaking changes | Class names don't work | Verify Tailwind v4 class syntax |

---

**Phase Dependencies**: None (first phase)
**Next Phase**: Phase 2 - Database Models
