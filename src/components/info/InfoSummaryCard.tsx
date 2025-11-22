import React from 'react';
import { cn } from '@/lib/utils';

export type InfoSummaryAccent = 'blue' | 'green' | 'violet' | 'amber' | 'neutral' | 'rose';

export interface InfoSummaryMetaItem {
  label: string;
  value: React.ReactNode;
}

export type InfoSummaryTrendDirection = 'up' | 'down' | 'flat';
export type InfoSummaryTrendTone = 'positive' | 'negative' | 'neutral';

export interface InfoSummaryTrend {
  value: string;
  label?: string;
  direction?: InfoSummaryTrendDirection;
  tone?: InfoSummaryTrendTone;
}

export interface InfoSummaryBadge {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

export interface InfoSummaryCardProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  accent?: InfoSummaryAccent;
  icon?: React.ReactNode;
  meta?: InfoSummaryMetaItem[];
  footer?: React.ReactNode;
  className?: string;
  trend?: InfoSummaryTrend;
  badge?: InfoSummaryBadge;
  dense?: boolean;
}

const accentBackground: Record<InfoSummaryAccent, string> = {
  blue: 'from-blue-500/30 via-blue-500/5 to-transparent',
  green: 'from-emerald-500/30 via-emerald-500/5 to-transparent',
  violet: 'from-violet-500/30 via-violet-500/5 to-transparent',
  amber: 'from-amber-500/30 via-amber-500/5 to-transparent',
  neutral: 'from-slate-500/30 via-slate-500/5 to-transparent',
  rose: 'from-rose-500/30 via-rose-500/5 to-transparent',
};

const badgeToneClasses: Record<NonNullable<InfoSummaryBadge['tone']>, string> = {
  info: 'bg-blue-500/10 text-blue-200 border-blue-500/30',
  success: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-200 border-amber-500/30',
  danger: 'bg-rose-500/10 text-rose-200 border-rose-500/30',
  neutral: 'bg-white/5 text-foreground-muted border-white/10',
};

const trendToneClasses: Record<InfoSummaryTrendTone, string> = {
  positive: 'text-emerald-300',
  negative: 'text-rose-300',
  neutral: 'text-foreground-muted',
};

const TrendIcon = ({ direction }: { direction?: InfoSummaryTrendDirection }) => {
  if (direction === 'down') {
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M3 6.5 8 11.5 13 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  if (direction === 'flat') {
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3 9.5 8 4.5 13 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
};

export function InfoSummaryCard({
  label,
  value,
  description,
  accent = 'blue',
  icon,
  meta,
  footer,
  className,
  trend,
  badge,
  dense = false,
}: InfoSummaryCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/5 bg-background-secondary/70 p-5 text-foreground shadow-lg backdrop-blur',
        dense && 'p-4',
        className,
      )}
    >
      <div className={cn('pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl', accentBackground[accent])} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-dim">{label}</p>
          <div className={cn('text-3xl font-bold text-white', dense && 'text-2xl')}>{value}</div>
          {description && <p className="max-w-md text-sm text-foreground-muted">{description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 text-white/80">
          {badge && (
            <span className={cn('rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide', badgeToneClasses[badge.tone ?? 'info'])}>
              {badge.label}
            </span>
          )}
          {icon && <div className="text-2xl">{icon}</div>}
        </div>
      </div>

      {trend && (
        <div className={cn('relative mt-4 flex items-center gap-2 text-xs font-semibold', trendToneClasses[trend.tone ?? 'neutral'])}>
          <TrendIcon direction={trend.direction} />
          <span className="text-sm">{trend.value}</span>
          {trend.label && <span className="text-foreground-muted text-[11px] font-normal">{trend.label}</span>}
        </div>
      )}

      {meta && meta.length > 0 && (
        <dl className={cn('relative mt-4 grid gap-3 text-xs text-foreground-muted', dense ? 'grid-cols-1' : 'grid-cols-2')}>
          {meta.map((item) => (
            <div key={`${label}-${item.label}`} className="flex items-center justify-between gap-3">
              <dt>{item.label}</dt>
              <dd className="text-sm font-semibold text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {footer && (
        <div className="relative mt-4 rounded-lg border border-white/5 bg-background-tertiary/20 px-3 py-2 text-xs text-foreground-muted">
          {footer}
        </div>
      )}
    </div>
  );
}

export default InfoSummaryCard;
