import { useState, useEffect, useCallback } from 'react';
import { Theme } from '../types';

const STORAGE_KEY = 'theme';

/**
 * 财务管家只做浅色（淡粉 / 淡紫 / 淡蓝），这里固定为 light，
 * 避免系统深色偏好把页面拉成黑底。
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  // 应用主题到 DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
