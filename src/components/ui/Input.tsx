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
            className="block text-sm font-medium text-[#e8e0d4] mb-1"
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
            'bg-[#2e2e2e]',
            'text-[#e8e0d4]',
            'placeholder:text-[#9a9088]',
            'focus:outline-none focus:ring-2 focus:ring-[#2d6b3f] focus:border-transparent',
            error
              ? 'border-[#c0392b] focus:ring-[#c0392b]'
              : 'border-[#3a3530]',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1 text-sm text-[#9a9088]">{hint}</p>
        )}
        {error && <p className="mt-1 text-sm text-[#c0392b]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
