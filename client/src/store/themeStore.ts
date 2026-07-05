import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================================================
// Theme Store — manages dark/light mode
// ==================================================
type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// ==================================================
// Apply theme to the document root
// ==================================================
export function applyTheme(theme: Theme) {
  const root = window.document.documentElement;

  // Remove existing theme class
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    // Use system preference
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

// ==================================================
// Initialize theme on app load
// ==================================================
export function initializeTheme() {
  const stored = localStorage.getItem('theme-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      applyTheme(state.theme || 'system');
    } catch {
      applyTheme('system');
    }
  } else {
    applyTheme('system');
  }
}
