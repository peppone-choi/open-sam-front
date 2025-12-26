'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * 페이지 전환 애니메이션 래퍼
 * Phase 23 - 프론트엔드 프리미엄 폴리싱
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
