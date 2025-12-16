'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  type ColorSystem,
  createColorSystem,
  colorSystemToCssVars,
  applyCssVars,
  DEFAULT_COLOR_SYSTEM,
} from '@/types/colorSystem';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  // 테마 모드 (다크/라이트)
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  
  // 국가색 기반 동적 테마
  nationColor: string | null;
  setNationColor: (color: string | null) => void;
  
  // 계산된 ColorSystem
  colorSystem: ColorSystem;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 기본 국가색 (인디고)
const DEFAULT_NATION_COLOR = '#6366f1';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [nationColor, setNationColor] = useState<string | null>(null);

  // 국가색 기반 ColorSystem 계산 (메모이제이션)
  const colorSystem = useMemo<ColorSystem>(() => {
    if (!nationColor) {
      return DEFAULT_COLOR_SYSTEM;
    }
    return createColorSystem(nationColor);
  }, [nationColor]);

  // 테마 적용
  useEffect(() => {
    const root = document.documentElement;
    
    // 테마 모드 클래스 적용
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(`theme-${mode}`);
    root.setAttribute('data-theme', mode);
    
    // 국가색 기반 CSS 변수 적용
    const cssVars = colorSystemToCssVars(colorSystem);
    applyCssVars(cssVars);
    
    // 국가색 원본도 CSS 변수로 저장 (필요한 경우 사용)
    root.style.setProperty('--nation-color', nationColor || DEFAULT_NATION_COLOR);
  }, [mode, colorSystem, nationColor]);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const contextValue = useMemo<ThemeContextType>(() => ({
    mode,
    setMode,
    toggleMode,
    nationColor,
    setNationColor,
    colorSystem,
  }), [mode, toggleMode, nationColor, colorSystem]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * 국가색만 필요할 때 사용하는 훅
 */
export function useNationColor() {
  const { nationColor, setNationColor, colorSystem } = useTheme();
  return { nationColor, setNationColor, colorSystem };
}
