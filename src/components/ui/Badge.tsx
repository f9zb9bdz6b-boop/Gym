import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'lime' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    lime: 'bg-lime-400/15 text-lime-300 border-lime-400/30',
    warning: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    danger: 'bg-red-400/15 text-red-300 border-red-400/30',
    info: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
