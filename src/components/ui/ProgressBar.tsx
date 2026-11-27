import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  colorClass?: string;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max,
  colorClass = 'bg-lime-400',
  className,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-zinc-800/90', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-300 ease-out', colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
