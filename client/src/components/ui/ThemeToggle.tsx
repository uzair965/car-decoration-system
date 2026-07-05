import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const isDarkActive = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDarkActive ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      title={`Switch to ${isDarkActive ? 'Light Mode' : 'Dark Mode'}`}
    >
      {isDarkActive ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
