import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAccess } from '../config/permissions';
import client from '../api/client';

// Seeded accounts for the demo role-selector convenience
const DEMO_ACCOUNTS = [
  { email: 'manager@test.com',  role: 'Fleet Manager',      password: 'password123' },
  { email: 'driver@test.com',   role: 'Dispatcher',         password: 'password123' },
  { email: 'safety@test.com',   role: 'Safety Officer',     password: 'password123' },
  { email: 'finance@test.com',  role: 'Financial Analyst',  password: 'password123' },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Already logged in — redirect to best landing page
  if (user) {
    const landing = getAccess('dashboard', user.role) !== 'none' ? '/dashboard' : '/trips';
    return <Navigate to={landing} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await client.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;
      login(token, userData);
      // DRIVER has no dashboard access — land on /trips instead
      const landing = getAccess('dashboard', userData.role) !== 'none' ? '/dashboard' : '/trips';
      navigate(landing, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(msg || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand info */}
      <div className="hidden lg:flex lg:w-2/5 bg-brand-light flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 rounded-lg bg-brand-dark flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-ink-onLight font-bold text-xl tracking-tight">TransitOps</span>
          </div>
          <h2 className="text-3xl font-bold text-ink-onLight mb-4">Fleet management, simplified.</h2>
          <p className="text-ink-muted text-base leading-relaxed">
            Dispatch trips, track vehicles, manage drivers, and monitor your fleet's financials — all in one place.
          </p>
        </div>

        {/* Role list */}
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">Demo accounts</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                id={`demo-${a.email.split('@')[0]}`}
                onClick={() => fillDemo(a)}
                className="w-full text-left flex items-center justify-between px-4 py-2.5 rounded-lg border border-purple-200 hover:border-accent hover:bg-white transition-colors duration-150 group"
              >
                <div>
                  <p className="text-sm font-medium text-ink-onLight group-hover:text-accent transition-colors">{a.role}</p>
                  <p className="text-xs text-ink-muted">{a.email}</p>
                </div>
                <svg className="w-4 h-4 text-ink-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 bg-brand-dark flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-ink-onDark font-bold text-lg">TransitOps</span>
          </div>

          <h1 className="text-2xl font-bold text-ink-onDark mb-1">Sign in</h1>
          <p className="text-ink-onDarkMuted text-sm mb-8">Enter your credentials to access your workspace.</p>

          {/* Error box */}
          {error && (
            <div
              id="login-error"
              className="flex items-center gap-2 bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-3 text-sm mb-6"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
              </svg>
              {error}
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-ink-onDarkMuted mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-ink-onDarkMuted mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-ink-onDarkMuted text-xs mt-6 text-center lg:block hidden">
            Use the demo accounts on the left to test different roles.
          </p>

          {/* Mobile demo accounts helper */}
          <div className="mt-8 pt-8 border-t border-brand-dark-raised lg:hidden">
            <p className="text-xs font-semibold text-ink-onDarkMuted uppercase tracking-widest mb-3 text-center">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fillDemo(a)}
                  className="text-left px-3 py-2 rounded-lg border border-brand-dark-raised hover:border-accent hover:bg-brand-dark-raised transition-colors duration-150 focus:outline-none"
                >
                  <p className="text-xs font-semibold text-ink-onDark">{a.role}</p>
                  <p className="text-[10px] text-ink-onDarkMuted truncate">{a.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
