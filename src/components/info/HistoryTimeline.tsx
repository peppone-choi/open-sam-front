import React from 'react';
import { cn } from '@/lib/utils';
import type { HistoryTimelineEvent } from '@/types/logh';

export interface HistoryTimelineProps {
  title?: string;
  subtitle?: string;
  emptyLabel?: string;
  events: HistoryTimelineEvent[];
  className?: string;
  variant?: 'default' | 'compact';
  highlightCategory?: HistoryTimelineEvent['category'];
}

const categoryDotStyle: Record<HistoryTimelineEvent['category'], string> = {
  global: 'border-blue-300 shadow-blue-500/40 bg-blue-500/80',
  action: 'border-pink-300 shadow-pink-500/40 bg-pink-500/80',
  nation: 'border-emerald-300 shadow-emerald-500/40 bg-emerald-500/80',
  system: 'border-amber-300 shadow-amber-500/40 bg-amber-500/80',
};

const categoryPillStyle: Record<HistoryTimelineEvent['category'], string> = {
  global: 'bg-blue-500/10 text-blue-200',
  action: 'bg-pink-500/10 text-pink-200',
  nation: 'bg-emerald-500/10 text-emerald-200',
  system: 'bg-amber-500/10 text-amber-200',
};

const categoryLabel: Record<HistoryTimelineEvent['category'], string> = {
  global: '중원 정세',
  action: '장수 동향',
  nation: '세력',
  system: '시스템',
};

const variantConfig = {
  default: {
    listSpacing: 'space-y-6',
    borderColor: 'border-white/10',
    paddingLeft: 'pl-6',
    dotOffset: '-left-[27px]',
    titleSize: 'text-sm',
  },
  compact: {
    listSpacing: 'space-y-4',
    borderColor: 'border-white/5',
    paddingLeft: 'pl-5',
    dotOffset: '-left-[23px]',
    titleSize: 'text-xs',
  },
};

export function HistoryTimeline({
  title = '타임라인',
  subtitle,
  emptyLabel = '기록이 없습니다.',
  events,
  className,
  variant = 'default',
  highlightCategory,
}: HistoryTimelineProps) {
  const style = variantConfig[variant];

  return (
    <div className={cn('rounded-2xl border border-white/5 bg-background-secondary/70 p-6 shadow-lg backdrop-blur', className)}>
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-foreground-muted">{subtitle}</p>}
      </div>

      {events.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 text-foreground-muted">
          <div className="text-3xl">📭</div>
          <p className="text-sm">{emptyLabel}</p>
        </div>
      ) : (
        <ol className={cn('relative mt-6 border-l', style.borderColor, style.paddingLeft, style.listSpacing)}>
          {events.map((event) => {
            const dotClasses = categoryDotStyle[event.category] ?? categoryDotStyle.global;
            const pillClasses = categoryPillStyle[event.category] ?? categoryPillStyle.global;
            const isHighlighted = highlightCategory && highlightCategory === event.category;

            return (
              <li key={event.id} className="relative">
                <span
                  className={cn(
                    'absolute top-1 h-3 w-3 rounded-full border-2 shadow-lg',
                    style.dotOffset,
                    dotClasses,
                    isHighlighted && 'scale-110 border-white shadow-white/40',
                  )}
                />
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-foreground-muted">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', pillClasses)}>
                    {categoryLabel[event.category]}
                  </span>
                  {event.timestampLabel && <span className="text-[10px] text-foreground-dim">{event.timestampLabel}</span>}
                  {!event.timestampLabel && typeof event.order === 'number' && (
                    <span className="text-[10px] text-foreground-dim">#{event.order}</span>
                  )}
                </div>
                <div className={cn('mt-1 font-semibold text-white', style.titleSize)}>{event.title}</div>
                {event.html ? (
                  <div
                    className="prose prose-invert mt-1 max-w-none text-sm leading-relaxed text-foreground"
                    dangerouslySetInnerHTML={{ __html: event.html }}
                  />
                ) : (
                  event.description && <p className="mt-1 text-sm text-foreground-muted">{event.description}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default HistoryTimeline;
