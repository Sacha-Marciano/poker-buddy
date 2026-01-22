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
    default: 'bg-zinc-900/60 backdrop-blur-sm border border-[#00f0ff]/20',
    elevated: 'bg-zinc-900/70 backdrop-blur-md shadow-[0_0_30px_rgba(0,240,255,0.15)] border border-[#00f0ff]/30',
    outlined: 'bg-zinc-900/50 backdrop-blur-sm border-2 border-[#00f0ff]/40 shadow-[0_0_15px_rgba(0,240,255,0.1)]',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300',
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
      className={cn('text-lg font-bold text-[#00f0ff]', className)}
      {...props}
    >
      {children}
    </h3>
  );
}
