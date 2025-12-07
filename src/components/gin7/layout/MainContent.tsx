'use client';

import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function MainContent({ children, title, subtitle, actions }: MainContentProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-foreground-muted mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

