import { useAuth } from '../context/AuthContext';
import { ROLE_DISPLAY_NAME } from '../config/permissions';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({ title, onToggleSidebar }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const roleName = ROLE_DISPLAY_NAME[user?.role] ?? user?.role ?? '';

  return (
    <header className="h-14 bg-brand-dark border-b border-brand-dark-raised flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-ink-onDarkMuted hover:text-ink-onDark p-1 rounded hover:bg-brand-dark-raised focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Page title */}
        <h1 className="text-ink-onDark font-semibold text-base">{title}</h1>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="text-ink-onDarkMuted hover:text-ink-onDark p-2 rounded-lg hover:bg-brand-dark-raised transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent flex items-center justify-center"
          aria-label="Toggle light/dark theme"
          id="theme-toggle-btn"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <span className="text-ink-onDarkMuted text-sm hidden sm:block">{user?.email}</span>
        <span
          id="topbar-role-badge"
          className="bg-brand-dark-raised text-accent text-xs font-semibold px-3 py-1 rounded-full border border-accent/30"
        >
          {roleName}
        </span>
      </div>
    </header>
  );
}
