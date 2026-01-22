# Phase 6: UI Components

## Objective

Create a library of reusable, mobile-first UI components using Tailwind CSS. These components form the foundation for all screens and ensure consistent styling across the application.

## Prerequisites

- Phase 1 completed (Tailwind, clsx, tailwind-merge installed)
- Phase 4 completed (utility functions available)

## Scope

### In Scope

- Base UI components (Button, Input, Card, Modal, Select, Badge)
- Layout components (BottomNav, FAB, PageHeader)
- Feedback components (LoadingSpinner, EmptyState, ErrorMessage)
- Form components (PlayerForm, GameForm, BuyInForm)
- Game-specific components (GameCard, BalanceSummary, TransactionLog)

### Out of Scope

- Full screen implementations (Phase 7)
- Navigation logic (Phase 8)
- Business logic (handled in screens)

## Implementation Details

### Files to Create

| File                                            | Purpose                      | Est. Lines |
| ----------------------------------------------- | ---------------------------- | ---------- |
| `src/components/ui/Button.tsx`                  | Button variants              | ~80        |
| `src/components/ui/Input.tsx`                   | Text/number input            | ~60        |
| `src/components/ui/Card.tsx`                    | Container component          | ~40        |
| `src/components/ui/Modal.tsx`                   | Dialog/modal overlay         | ~80        |
| `src/components/ui/Select.tsx`                  | Dropdown select              | ~60        |
| `src/components/ui/Badge.tsx`                   | Status badges                | ~40        |
| `src/components/ui/FAB.tsx`                     | Floating action button       | ~40        |
| `src/components/ui/LoadingSpinner.tsx`          | Loading indicator            | ~30        |
| `src/components/ui/EmptyState.tsx`              | Empty state message          | ~30        |
| `src/components/ui/PageHeader.tsx`              | Page header with back button | ~50        |
| `src/components/ui/index.ts`                    | Export all UI components     | ~20        |
| `src/components/game/GameCard.tsx`              | Game list item               | ~80        |
| `src/components/game/BalanceSummary.tsx`        | Balance display              | ~60        |
| `src/components/game/TransactionLog.tsx`        | Transaction list             | ~100       |
| `src/components/game/ParticipantsList.tsx`      | Players in game              | ~80        |
| `src/components/game/QuickBuyInModal.tsx`       | Buy-in form modal            | ~120       |
| `src/components/player/PlayerCard.tsx`          | Player list item             | ~60        |
| `src/components/player/PlayerStats.tsx`         | Player statistics            | ~80        |
| `src/components/leaderboard/LeaderboardRow.tsx` | Leaderboard entry            | ~60        |

### Base UI Components

#### Button (`src/components/ui/Button.tsx`)

```typescript
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary:
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost:
        'bg-transparent text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-800',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-12 px-4 text-base min-w-[44px]', // Touch-friendly
      lg: 'h-14 px-6 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
```

#### Input (`src/components/ui/Input.tsx`)

```typescript
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type = 'text', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'w-full h-12 px-4 text-base rounded-lg border transition-colors',
            'bg-white dark:bg-zinc-800',
            'text-zinc-900 dark:text-zinc-100',
            'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-zinc-300 dark:border-zinc-600',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1 text-sm text-zinc-500">{hint}</p>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
```

#### Card (`src/components/ui/Card.tsx`)

```typescript
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-zinc-800',
    elevated: 'bg-white dark:bg-zinc-800 shadow-md',
    outlined: 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'rounded-xl',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold text-zinc-900 dark:text-zinc-100', className)}
      {...props}
    >
      {children}
    </h3>
  );
}
```

#### Modal (`src/components/ui/Modal.tsx`)

```typescript
'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-zinc-800 rounded-t-2xl sm:rounded-2xl',
          'max-h-[90vh] overflow-hidden flex flex-col',
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Select (`src/components/ui/Select.tsx`)

```typescript
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full h-12 px-4 text-base rounded-lg border transition-colors appearance-none',
            'bg-white dark:bg-zinc-800',
            'text-zinc-900 dark:text-zinc-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-zinc-300 dark:border-zinc-600',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-no-repeat bg-position-[right_1rem_center] bg-size-[1.25rem]',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
```

#### Badge (`src/components/ui/Badge.tsx`)

```typescript
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { BalanceStatus } from '@/types';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'status';
  size?: 'sm' | 'md';
  status?: BalanceStatus;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  status,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    status: '', // Will be set based on status prop
  };

  const statusVariants: Record<BalanceStatus, string> = {
    GREEN: variants.success,
    YELLOW: variants.warning,
    RED: variants.danger,
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const variantClass = variant === 'status' && status
    ? statusVariants[status]
    : variants[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantClass,
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Status dot indicator
export function StatusDot({ status }: { status: BalanceStatus }) {
  const colors: Record<BalanceStatus, string> = {
    GREEN: 'bg-green-500',
    YELLOW: 'bg-yellow-500',
    RED: 'bg-red-500',
  };

  return (
    <span
      className={cn('inline-block w-2.5 h-2.5 rounded-full', colors[status])}
      aria-label={`Balance status: ${status.toLowerCase()}`}
    />
  );
}
```

#### FAB (`src/components/ui/FAB.tsx`)

```typescript
import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface FABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-center';
}

export function FAB({
  className,
  icon,
  label,
  position = 'bottom-right',
  ...props
}: FABProps) {
  const positions = {
    'bottom-right': 'right-4 bottom-20', // Above bottom nav
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20',
  };

  return (
    <button
      className={cn(
        'fixed z-40 flex items-center justify-center',
        'w-14 h-14 rounded-full shadow-lg',
        'bg-blue-600 text-white',
        'hover:bg-blue-700 active:bg-blue-800',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        positions[position],
        className
      )}
      aria-label={label || 'Action button'}
      {...props}
    >
      {icon || (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
    </button>
  );
}
```

#### LoadingSpinner (`src/components/ui/LoadingSpinner.tsx`)

```typescript
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <svg
      className={cn('animate-spin text-blue-600', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
```

#### EmptyState (`src/components/ui/EmptyState.tsx`)

```typescript
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {icon && (
        <div className="mb-4 text-zinc-400 dark:text-zinc-500">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 text-center">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-zinc-500 text-center max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

#### PageHeader (`src/components/ui/PageHeader.tsx`)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  showBack = false,
  backHref,
  rightAction,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800',
        className
      )}
    >
      <div className="flex items-center h-14 px-4">
        {showBack && (
          <button
            onClick={handleBack}
            className="mr-3 p-2 -ml-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <h1 className="flex-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
          {title}
        </h1>
        {rightAction && <div className="ml-3">{rightAction}</div>}
      </div>
    </header>
  );
}
```

#### UI Index (`src/components/ui/index.ts`)

```typescript
export { Button, type ButtonProps } from "./Button";
export { Input, type InputProps } from "./Input";
export { Card, CardHeader, CardTitle, type CardProps } from "./Card";
export { Modal, type ModalProps } from "./Modal";
export { Select, type SelectProps, type SelectOption } from "./Select";
export { Badge, StatusDot, type BadgeProps } from "./Badge";
export { FAB, type FABProps } from "./FAB";
export {
  LoadingSpinner,
  LoadingPage,
  type LoadingSpinnerProps,
} from "./LoadingSpinner";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { PageHeader, type PageHeaderProps } from "./PageHeader";
```

### Game Components

#### GameCard (`src/components/game/GameCard.tsx`)

```typescript
import Link from 'next/link';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import type { GameWithStats } from '@/types/game';
import type { BalanceStatus } from '@/types';

interface GameCardProps {
  game: GameWithStats;
  showStatus?: boolean;
}

export function GameCard({ game, showStatus = true }: GameCardProps) {
  const isInProgress = game.status === 'IN_PROGRESS';

  // Calculate balance status for completed games
  const balanceStatus: BalanceStatus | null = !isInProgress
    ? game.totalCashouts - game.totalBuyIns === 0
      ? 'GREEN'
      : game.totalCashouts - game.totalBuyIns < 0
      ? 'YELLOW'
      : 'RED'
    : null;

  return (
    <Link href={`/games/${game._id}`}>
      <Card
        variant="outlined"
        className="hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {format(new Date(game.startTime), 'MMM d, yyyy')}
              </span>
              {showStatus && isInProgress && (
                <Badge variant="success" size="sm">
                  Live
                </Badge>
              )}
              {showStatus && !isInProgress && balanceStatus && (
                <StatusDot status={balanceStatus} />
              )}
            </div>
            {game.location && (
              <p className="text-sm text-zinc-500 mt-0.5">{game.location}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">
              {game.participantCount} player{game.participantCount !== 1 ? 's' : ''}
            </p>
            <p className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(game.totalBuyIns)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

#### BalanceSummary (`src/components/game/BalanceSummary.tsx`)

```typescript
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, getBalanceStatusColor } from '@/lib/utils';
import type { BalanceStatus } from '@/types';

interface BalanceSummaryProps {
  totalBuyIns: number;
  totalCashouts: number;
  balanceDiscrepancy: number;
  balanceStatus: BalanceStatus;
  showDiscrepancy?: boolean;
}

export function BalanceSummary({
  totalBuyIns,
  totalCashouts,
  balanceDiscrepancy,
  balanceStatus,
  showDiscrepancy = true,
}: BalanceSummaryProps) {
  const statusLabels: Record<BalanceStatus, string> = {
    GREEN: 'Balanced',
    YELLOW: 'Extra Chips',
    RED: 'Missing Chips',
  };

  return (
    <Card variant="outlined">
      <CardTitle>Balance Summary</CardTitle>
      <div className="space-y-3 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-zinc-600 dark:text-zinc-400">Total Buy-ins</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {formatCurrency(totalBuyIns)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-600 dark:text-zinc-400">Total Cashouts</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {formatCurrency(totalCashouts)}
          </span>
        </div>
        {showDiscrepancy && (
          <>
            <hr className="border-zinc-200 dark:border-zinc-700" />
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Discrepancy</span>
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                {balanceDiscrepancy >= 0 ? '+' : ''}
                {formatCurrency(balanceDiscrepancy)}
              </span>
            </div>
            <div className="flex justify-end">
              <Badge variant="status" status={balanceStatus}>
                {statusLabels[balanceStatus]}
              </Badge>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
```

#### TransactionLog (`src/components/game/TransactionLog.tsx`)

```typescript
import { format } from 'date-fns';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import type { GameTransaction } from '@/types/game';

interface TransactionLogProps {
  transactions: GameTransaction[];
  isEditable?: boolean;
  onEditBuyIn?: (buyInId: string, currentAmount: number) => void;
  onDeleteBuyIn?: (buyInId: string) => void;
}

export function TransactionLog({
  transactions,
  isEditable = false,
  onEditBuyIn,
  onDeleteBuyIn,
}: TransactionLogProps) {
  // Only show buy-ins in transaction log (cashouts shown separately)
  const buyIns = transactions.filter((t) => t.type === 'BUY_IN');

  if (buyIns.length === 0) {
    return (
      <Card variant="outlined">
        <CardTitle>Transaction Log</CardTitle>
        <p className="text-zinc-500 text-sm mt-4">No buy-ins recorded yet</p>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="none">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <CardTitle>Transaction Log</CardTitle>
      </div>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {buyIns.map((tx) => (
          <li key={tx._id} className="px-4 py-3 flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {tx.playerName}
              </p>
              <p className="text-sm text-zinc-500">
                {format(new Date(tx.timestamp), 'h:mm a')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                {formatCurrency(tx.amount)}
              </span>
              {isEditable && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onEditBuyIn?.(tx._id, tx.amount)}
                    className="p-2 text-zinc-500 hover:text-blue-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-label="Edit buy-in"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteBuyIn?.(tx._id)}
                    className="p-2 text-zinc-500 hover:text-red-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-label="Delete buy-in"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
```

#### QuickBuyInModal (`src/components/game/QuickBuyInModal.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import type { GameParticipant } from '@/types/game';

const QUICK_AMOUNTS = [1, 5, 10, 25, 50, 100];

interface QuickBuyInModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: GameParticipant[];
  onSubmit: (participantId: string, amount: number) => Promise<boolean>;
}

export function QuickBuyInModal({
  isOpen,
  onClose,
  participants,
  onSubmit,
}: QuickBuyInModalProps) {
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const participantOptions: SelectOption[] = participants.map((p) => ({
    value: p._id,
    label: p.playerName,
  }));

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedParticipant) {
      setError('Please select a player');
      return;
    }

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount < 1) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount > 1000000) {
      setError('Amount cannot exceed 1,000,000');
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(selectedParticipant, numAmount);
    setIsSubmitting(false);

    if (success) {
      // Reset and close
      setSelectedParticipant('');
      setAmount('');
      setError('');
      onClose();
    } else {
      setError('Failed to record buy-in');
    }
  };

  const handleClose = () => {
    setSelectedParticipant('');
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Buy-in"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} fullWidth>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!selectedParticipant || !amount}
            fullWidth
          >
            Record
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Player"
          options={participantOptions}
          value={selectedParticipant}
          onChange={(e) => {
            setSelectedParticipant(e.target.value);
            setError('');
          }}
          placeholder="Select player"
          error={!selectedParticipant && error ? 'Please select a player' : undefined}
        />

        <Input
          label="Amount"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError('');
          }}
          placeholder="Enter amount in ILS"
          min={1}
          max={1000000}
          step={1}
          error={error && selectedParticipant ? error : undefined}
        />

        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Quick amounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <Button
                key={value}
                variant="secondary"
                size="sm"
                onClick={() => handleQuickAmount(value)}
              >
                {value}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
```

## Error Handling

| Error Condition        | Expected Behavior      | User Feedback         |
| ---------------------- | ---------------------- | --------------------- |
| Invalid amount in form | Validation message     | Red text below input  |
| Required field missing | Validation message     | Error shown on submit |
| API call fails         | onSubmit returns false | Error message in form |

## Expected Results

After completing this phase:

1. All base UI components available for use
2. Components are accessible (proper ARIA attributes)
3. Mobile-first design with touch-friendly targets
4. Consistent styling across all components
5. Dark mode support built in

## Validation Steps

1. Import each component in a test page
2. Verify all variants render correctly
3. Test touch interactions on mobile device/emulator
4. Verify dark mode styling
5. Run accessibility audit (Lighthouse)

### Component Test Page

```typescript
// Temporary test: src/app/test-components/page.tsx
import {
  Button,
  Input,
  Card,
  CardTitle,
  Badge,
  Select,
  EmptyState,
} from '@/components/ui';

export default function TestComponentsPage() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Component Test</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">Buttons</h2>
        <div className="flex gap-2 flex-wrap">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button isLoading>Loading</Button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Inputs</h2>
        <div className="space-y-2 max-w-sm">
          <Input label="Name" placeholder="Enter name" />
          <Input label="With Error" error="This field is required" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Card</h2>
        <Card variant="outlined">
          <CardTitle>Sample Card</CardTitle>
          <p className="text-zinc-600">Card content goes here</p>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Empty State</h2>
        <EmptyState
          title="No items found"
          description="Try adding some items to get started"
          action={<Button>Add Item</Button>}
        />
      </section>
    </div>
  );
}
```

## Success Criteria

- [ ] All UI component files created
- [ ] Components are mobile-first (min-h-12 for touch targets)
- [ ] Dark mode classes included
- [ ] All components exported from index.ts
- [ ] Components render without errors
- [ ] Forms validate correctly
- [ ] Modal locks body scroll and handles escape key
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

## Potential Issues

| Issue                           | Detection           | Resolution                                      |
| ------------------------------- | ------------------- | ----------------------------------------------- |
| Tailwind classes not applying   | Styles missing      | Verify Tailwind config includes component paths |
| Dark mode not working           | No color change     | Ensure dark: classes are used                   |
| Touch targets too small         | Difficult to tap    | Ensure min-h-12 on interactive elements         |
| Modal z-index conflicts         | Modal hidden        | Use z-50 consistently                           |
| Form validation race conditions | Errors not clearing | Clear errors on input change                    |

---

**Phase Dependencies**: Phase 1, Phase 4
**Next Phase**: Phase 7 - Screens
