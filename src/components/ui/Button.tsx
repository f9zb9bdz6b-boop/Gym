import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 active:scale-[0.98] shadow-sm shadow-lime-400/10',
      secondary:
        'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700',
      outline:
        'bg-transparent text-zinc-200 border border-zinc-700 hover:bg-zinc-800/70 hover:text-white',
      ghost: 'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
      danger: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-8 px-3 text-xs rounded-lg',
      md: 'h-10 px-4 text-sm rounded-xl',
      lg: 'h-12 px-6 text-base rounded-xl',
      icon: 'h-10 w-10 rounded-xl flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
