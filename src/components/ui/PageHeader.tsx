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
        'sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b-2 border-[#00f0ff]/20',
        className
      )}
    >
      <div className="px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#00f0ff]/20 to-[#b625ff]/20 border border-[#00f0ff]/30 hover:border-[#00f0ff] transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                aria-label="Go back"
              >
                <svg
                  className="w-5 h-5 text-[#00f0ff]"
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
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#b625ff] to-[#ff2e97] tracking-wide truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-zinc-400 truncate mt-1 font-medium">
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
