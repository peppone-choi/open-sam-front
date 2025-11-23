'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'empire' | 'alliance' | 'neutral';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('alliance'); // Default to alliance (democratic default)

  useEffect(() => {
    // Apply theme to document element
    const root = document.documentElement;
    root.classList.remove('theme-empire', 'theme-alliance', 'theme-neutral');
    root.classList.add(`theme-${theme}`);
    
    // Also set data-theme attribute for CSS selectors
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'empire' ? 'alliance' : 'empire');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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
