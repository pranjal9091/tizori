import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('pocketpaisa_theme');
      if (stored === 'dark') return 'dark';
      if (stored === 'light') return 'light';
    }
    if (typeof document !== 'undefined') {
      const current = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
      if (current === 'dark') return 'dark';
    }
    return 'light'; // Default is always Light Mode (Warm Paper Ledger)
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('pocketpaisa_theme', next);

    const meta = document.getElementById('theme-color-meta');
    if (meta) {
      meta.setAttribute('content', next === 'dark' ? '#17140F' : '#F6F1E7');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn-icon"
      title={`Switch to ${theme === 'light' ? 'Dark Mode' : 'Light Paper Mode'}`}
      aria-label={`Switch to ${theme === 'light' ? 'Dark Mode' : 'Light Paper Mode'}`}
      style={{
        width: '38px',
        height: '38px',
        border: '1px solid var(--line)',
        background: 'var(--surface)',
      }}
    >
      {theme === 'light' ? (
        <Moon size={17} strokeWidth={1.5} color="var(--ink)" />
      ) : (
        <Sun size={17} strokeWidth={1.5} color="var(--ink)" />
      )}
    </button>
  );
};
