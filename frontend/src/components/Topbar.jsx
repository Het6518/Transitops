import { useAuth } from '../context/AuthContext';
import { ROLE_DISPLAY_NAME } from '../config/permissions';

export default function Topbar({ title, onToggleSidebar }) {
  const { user } = useAuth();
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
