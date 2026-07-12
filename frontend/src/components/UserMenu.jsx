import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_DISPLAY_NAME } from '../config/permissions';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const emailInitial = user?.email?.[0]?.toUpperCase() ?? 'U';
  const roleName = ROLE_DISPLAY_NAME[user?.role] ?? user?.role ?? '';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent rounded-full p-0.5"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="w-9 h-9 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center text-sm font-bold shadow-sm transition-colors duration-150">
          {emailInitial}
        </div>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-brand-dark-raised border border-brand-dark-raised shadow-xl py-3 z-50">
          <div className="px-4 py-2 border-b border-brand-dark-raised mb-2">
            <p className="text-xs text-ink-muted dark:text-ink-onDarkMuted">Signed in as</p>
            <p className="text-sm font-semibold text-ink-onLight dark:text-ink-onDark truncate">{user?.email}</p>
            <div className="mt-1.5 inline-block bg-brand-dark-raised dark:bg-brand-dark text-accent dark:text-accent text-[10px] font-bold px-2 py-0.5 rounded-full border border-accent/20">
              {roleName}
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-ink-muted hover:text-status-retired dark:text-ink-onDarkMuted dark:hover:text-status-retired hover:bg-brand-light dark:hover:bg-brand-dark transition-colors duration-150 flex items-center gap-2 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
