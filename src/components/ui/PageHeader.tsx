'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  action,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        'sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800',
        className
      )}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
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
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="ml-4 flex-shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
