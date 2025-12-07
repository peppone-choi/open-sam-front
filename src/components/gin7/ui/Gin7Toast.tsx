'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface Gin7ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const typeStyles = {
  success: {
    bg: 'bg-hud-success/10 border-hud-success/30',
    icon: CheckCircleIcon,
    iconColor: 'text-hud-success',
  },
  error: {
    bg: 'bg-hud-alert/10 border-hud-alert/30',
    icon: XCircleIcon,
    iconColor: 'text-hud-alert',
  },
  warning: {
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    icon: ExclamationCircleIcon,
    iconColor: 'text-yellow-500',
  },
  info: {
    bg: 'bg-alliance-blue/10 border-alliance-blue/30',
    icon: InformationCircleIcon,
    iconColor: 'text-alliance-blue',
  },
};

export function Gin7Toast({ toast, onDismiss }: Gin7ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const style = typeStyles[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300',
        style.bg,
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', style.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-foreground-muted mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded hover:bg-white/10 transition-colors"
      >
        <XMarkIcon className="w-4 h-4 text-foreground-muted" />
      </button>
    </div>
  );
}

interface Gin7ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function Gin7ToastContainer({ toasts, onDismiss }: Gin7ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Gin7Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

