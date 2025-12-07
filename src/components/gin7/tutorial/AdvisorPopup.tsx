'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LightBulbIcon, 
  ExclamationTriangleIcon, 
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { AdvisorMessage } from '@/types/gin7/tutorial';

interface AdvisorPopupProps {
  message: AdvisorMessage;
  onDismiss: () => void;
  onDismissPermanently: () => void;
  onAction?: () => void;
}

const typeConfig = {
  tip: {
    icon: LightBulbIcon,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    label: '팁',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    label: '주의',
  },
  suggestion: {
    icon: SparklesIcon,
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    label: '제안',
  },
  congratulation: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    iconColor: 'text-green-400',
    label: '축하',
  },
};

export default function AdvisorPopup({
  message,
  onDismiss,
  onDismissPermanently,
  onAction,
}: AdvisorPopupProps) {
  const config = typeConfig[message.type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed bottom-6 right-6 z-[150] w-[320px]',
          'rounded-xl border shadow-2xl backdrop-blur-xl',
          config.bgColor,
          config.borderColor
        )}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-lg', config.bgColor)}>
              <Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <div>
              <span className={cn('text-xs font-medium', config.iconColor)}>
                {config.label}
              </span>
              <h4 className="text-sm font-semibold text-foreground">
                {message.title}
              </h4>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-3">
          <p className="text-sm text-foreground-muted leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-3 border-t border-white/5">
          <button
            onClick={onDismissPermanently}
            className="text-xs text-foreground-muted hover:text-foreground transition-colors"
          >
            다시 보지 않기
          </button>

          <div className="flex gap-2">
            {message.action && (
              <button
                onClick={onAction}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  config.bgColor,
                  'hover:brightness-110',
                  config.iconColor
                )}
              >
                {message.action.label}
              </button>
            )}
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors"
            >
              확인
            </button>
          </div>
        </div>

        {/* 장식용 아이콘 */}
        <div className="absolute -top-2 -right-2 opacity-10">
          <Icon className="w-20 h-20" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}








