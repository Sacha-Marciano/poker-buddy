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
      'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider';

    const variants = {
      primary:
        'bg-[#2d6b3f] text-white hover:bg-[#3a8a52] hover:shadow-md focus:ring-[#2d6b3f] border border-[#3a8a52]/30',
      secondary:
        'bg-[#2e2e2e] text-[#e8e0d4] hover:bg-[#3a3530] focus:ring-[#2d6b3f] border border-[#3a3530] hover:border-[#2d6b3f]',
      danger:
        'bg-[#c0392b] text-white hover:bg-[#a93226] hover:shadow-md focus:ring-[#c0392b] border border-[#c0392b]/50',
      ghost:
        'bg-transparent text-[#3a8a52] hover:bg-[#2d6b3f]/10 focus:ring-[#2d6b3f] border border-transparent hover:border-[#2d6b3f]/30',
    };

    const sizes = {
      sm: 'h-10 px-4 text-xs',
      md: 'h-12 px-6 text-sm min-w-[44px]',
      lg: 'h-14 px-8 text-base',
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
