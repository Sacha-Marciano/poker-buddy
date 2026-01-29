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
        'sticky top-0 z-30 bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-[#3a3530]',
        className
      )}
    >
      <div className="px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#2d6b3f]/15 border border-[#2d6b3f]/30 hover:border-[#2d6b3f] transition-all"
                aria-label="Go back"
              >
                <svg
                  className="w-5 h-5 text-[#3a8a52]"
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
              <h1 className="text-2xl font-black text-[#e8e0d4] tracking-wide truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-[#9a9088] truncate mt-1 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="ml-4 shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
