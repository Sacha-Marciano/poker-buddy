import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-[#2e2e2e] text-[#9a9088]',
    success: 'bg-[#27ae60]/15 text-[#27ae60]',
    warning: 'bg-[#d4a03c]/15 text-[#d4a03c]',
    danger: 'bg-[#c0392b]/15 text-[#c0392b]',
    info: 'bg-[#2d6b3f]/15 text-[#3a8a52]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
