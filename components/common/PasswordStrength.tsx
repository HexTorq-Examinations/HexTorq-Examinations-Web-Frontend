import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password?: string;
  className?: string;
}

export function PasswordStrength({ password = '', className }: PasswordStrengthProps) {
  const score = useMemo(() => {
    let s = 0;
    if (!password) return s;
    if (password.length > 7) s += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s += 1;
    if (/\d/.test(password)) s += 1;
    if (/[^a-zA-Z0-9]/.test(password)) s += 1;
    return s;
  }, [password]);

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const label = password ? strengthLabels[score] : '';

  const getBarColor = (index: number) => {
    if (!password) return 'bg-slate-200 dark:bg-slate-800';
    if (score === 0) return index === 0 ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-800';
    if (score === 1) return index < 2 ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-800';
    if (score === 2) return index < 3 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800';
    if (score === 3) return index < 4 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  };

  const getTextColor = () => {
    if (score === 0) return 'text-red-500';
    if (score === 1) return 'text-orange-500';
    if (score === 2) return 'text-amber-500';
    if (score === 3) return 'text-emerald-500';
    return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-full flex-1 rounded-full transition-all duration-300",
              getBarColor(i)
            )}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500 dark:text-slate-400">Password strength</span>
        <span className={cn("transition-colors duration-300", getTextColor())}>{label}</span>
      </div>
    </div>
  );
}
