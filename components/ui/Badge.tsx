import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'brand';
  children: React.ReactNode;
  className?: string;
}

const variants: Record<string, string> = {
  default: 'bg-surface-700 text-surface-200',
  success: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  destructive: 'bg-red-500/10 text-red-400',
  brand: 'bg-brand-500/10 text-brand-400',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
