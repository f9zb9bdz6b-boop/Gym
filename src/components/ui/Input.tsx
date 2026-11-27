import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && <label className="block text-xs font-medium text-zinc-400">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all',
            error && 'border-red-500/60 focus:ring-red-500/40',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && <label className="block text-xs font-medium text-zinc-400">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all',
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';
