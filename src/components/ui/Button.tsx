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
      'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider';

    const variants = {
      primary:
        'bg-[#00f0ff] text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] hover:scale-105 focus:ring-[#00f0ff] border-2 border-[#00f0ff]/50',
      secondary:
        'bg-zinc-900/80 text-[#00f0ff] hover:bg-zinc-800 focus:ring-[#00f0ff] border-2 border-[#00f0ff]/30 hover:border-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]',
      danger:
        'bg-[#ff2e97] text-white hover:shadow-[0_0_20px_rgba(255,46,151,0.6)] hover:scale-105 focus:ring-[#ff2e97] border-2 border-[#ff2e97]/50',
      ghost:
        'bg-transparent text-[#00f0ff] hover:bg-[#00f0ff]/10 focus:ring-[#00f0ff] border-2 border-transparent hover:border-[#00f0ff]/30',
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
