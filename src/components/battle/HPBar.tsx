'use client';

import { useEffect, useState } from 'react';
import styles from './HPBar.module.css';

interface HPBarProps {
  before: number;
  after: number;
  animate?: boolean;
}

export default function HPBar({ before, after, animate = false }: HPBarProps) {
  const [current, setCurrent] = useState(before);
  
  useEffect(() => {
    if (animate) {
      const duration = 500;
      const startTime = Date.now();
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = before - (before - after) * progress;
        setCurrent(Math.floor(value));
        
        if (progress >= 1) {
          clearInterval(interval);
        }
      }, 16);
      
      return () => clearInterval(interval);
    } else {
      setCurrent(after);
    }
  }, [animate, before, after]);
  
  const percentage = before > 0 ? (current / before) * 100 : 0;
  
  return (
    <div className={styles.hpBar}>
      <div 
        className={styles.hpBarFill} 
        style={{ width: `${percentage}%` }} 
      />
      <div className={styles.hpText}>
        {current.toLocaleString()} / {before.toLocaleString()}
      </div>
    </div>
  );
}
