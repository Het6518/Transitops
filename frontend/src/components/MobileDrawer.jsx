import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, getAccess } from '../config/permissions';
import { useNavigate } from 'react-router-dom';

// Inline Icons map
const ICONS = {
  grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  truck: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m0 0h1m11 0h1m-7-10h7l2 3v7',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  map: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  tool: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  droplet: 'M12 2C12 2 5 9.5 5 14a7 7 0 0014 0C19 9.5 12 2 12 2z',
  'bar-chart': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

function NavIcon({ name }) {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={ICONS[name] || ICONS.grid} />
    </svg>
  );
}

export default function MobileDrawer({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const visibleItems = NAV_ITEMS.filter(
    (item) => getAccess(item.page, user?.role) !== 'none'
  );

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-72 max-w-sm bg-white dark:bg-brand-dark flex flex-col h-full shadow-2xl z-10">
        <div className="px-6 py-5 border-b border-brand-dark-raised flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="TransitOps Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-ink-onLight dark:text-ink-onDark font-bold text-lg">TransitOps</span>
          </div>
          <button 
            onClick={onClose}
            className="text-ink-muted dark:text-ink-onDarkMuted hover:text-ink-onLight dark:hover:text-ink-onDark focus:outline-none p-1 rounded hover:bg-brand-dark-raised"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.page}
              to={item.path}
              id={`mob-nav-${item.page}`}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-accent text-white font-bold'
                    : 'text-ink-muted dark:text-ink-onDarkMuted hover:text-ink-onLight dark:hover:text-ink-onDark hover:bg-brand-light dark:hover:bg-brand-dark-raised'
                }`
              }
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout section */}
        <div className="px-4 py-4 border-t border-brand-dark-raised">
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2 text-sm text-ink-muted hover:text-status-retired dark:text-ink-onDarkMuted dark:hover:text-status-retired transition-colors duration-150 px-3 py-2.5 rounded-lg hover:bg-brand-light dark:hover:bg-brand-dark-raised focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
