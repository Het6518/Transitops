import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_DISPLAY_NAME } from '../config/permissions';

export default function RestrictedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleLabel = ROLE_DISPLAY_NAME[user?.role] ?? user?.role?.replace(/_/g, ' ') ?? 'Unknown Role';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-brand-dark-raised flex items-center justify-center">
            <svg
              className="w-10 h-10 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-ink-onDark mb-2">Access Restricted</h1>
        <p className="text-ink-onDarkMuted mb-1">
          You don't have permission to view this page.
        </p>
        {user && (
          <p className="text-ink-onDarkMuted text-sm mb-8">
            Your current role —{' '}
            <span className="text-accent font-medium">{roleLabel}</span>
            {' '}— does not include access to this section.
          </p>
        )}

        <div className="flex flex-col items-center gap-3">
          <Link
            to="/dashboard"
            id="restricted-back-to-dashboard"
            className="inline-flex items-center gap-2 btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>

          <button
            id="restricted-signout"
            onClick={handleLogout}
            className="text-sm text-ink-onDarkMuted hover:text-status-retired transition-colors underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-accent rounded"
          >
            Sign out and switch account
          </button>
        </div>

      </div>
    </div>
  );
}
