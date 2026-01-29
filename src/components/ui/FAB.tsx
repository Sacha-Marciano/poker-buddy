'use client';

import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface FABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label?: string;
}

export function FAB({ className, icon, label, children, ...props }: FABProps) {
  return (
    <button
      className={cn(
        'fixed bottom-20 right-4 z-40',
        'flex items-center justify-center gap-2',
        'h-14 px-6 rounded-full shadow-lg',
        'bg-[#2d6b3f] text-white',
        'hover:bg-[#3a8a52] active:bg-[#246633]',
        'focus:outline-none focus:ring-2 focus:ring-[#2d6b3f] focus:ring-offset-2',
        'transition-all duration-200',
        'font-medium text-base',
        className
      )}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {label || children}
    </button>
  );
}
