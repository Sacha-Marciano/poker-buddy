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
        'bg-blue-600 text-white',
        'hover:bg-blue-700 active:bg-blue-800',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
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
