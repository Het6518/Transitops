import { useAuth } from '../context/AuthContext';
import { ROLE_DISPLAY_NAME } from '../config/permissions';

export default function Topbar({ title }) {
  const { user } = useAuth();
  const roleName = ROLE_DISPLAY_NAME[user?.role] ?? user?.role ?? '';

  return (
    <header className="h-14 bg-brand-dark border-b border-brand-dark-raised flex items-center justify-between px-6 shrink-0">
      {/* Page title */}
      <h1 className="text-ink-onDark font-semibold text-base">{title}</h1>

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
