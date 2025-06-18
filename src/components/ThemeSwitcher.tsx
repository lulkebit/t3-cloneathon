'use client';

import React from 'react';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react'; // Using Monitor for OLED, could be specific icon

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: { value: Theme; label: string; icon: JSX.Element }[] = [
    { value: 'light', label: 'Light', icon: <Sun size={16} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { value: 'oled', label: 'OLED', icon: <Monitor size={16} /> }, // Example icon
  ];

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value as Theme);
  };

  return (
    <div className="theme-switcher relative inline-block">
      <label htmlFor="theme-select" className="sr-only">Select Theme</label>
      <select
        id="theme-select"
        value={theme}
        onChange={handleThemeChange}
        className="appearance-none w-full bg-[var(--glass-bg)] text-[var(--text-default)] border border-[var(--glass-border-color)] rounded-lg py-2 px-3 pr-8 leading-tight focus:outline-none focus:border-[var(--accent-default)] focus:ring-1 focus:ring-[var(--accent-default)]"
        style={{ minWidth: '120px' }}
      >
        {themes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--text-subtle)]">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
