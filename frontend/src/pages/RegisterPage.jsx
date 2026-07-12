import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAccess } from '../config/permissions';
import client from '../api/client';

const ROLES = [
  { value: 'FLEET_MANAGER',     label: 'Fleet Manager' },
  { value: 'DRIVER',            label: 'Driver' },
  { value: 'SAFETY_OFFICER',    label: 'Safety Officer' },
  { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst' },
];

export default function RegisterPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('FLEET_MANAGER');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Already logged in — redirect to best landing page
  if (user) {
    const landing = getAccess('dashboard', user.role) !== 'none' ? '/dashboard' : '/trips';
    return <Navigate to={landing} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // 1. Call signup endpoint
      await client.post('/auth/signup', { email, password, roleName });
      setSuccess('Account created successfully! Logging in...');
      
      // 2. Perform auto login
      setTimeout(async () => {
        try {
          const res = await client.post('/auth/login', { email, password });
          const { token, user: userData } = res.data;
          login(token, userData);
          const landing = getAccess('dashboard', userData.role) !== 'none' ? '/dashboard' : '/trips';
          navigate(landing, { replace: true });
        } catch (err) {
          navigate('/login', { replace: true });
        }
      }, 1500);

    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-3xl font-bold text-ink-onLight mb-4">Join TransitOps today.</h2>
          <p className="text-ink-muted text-base leading-relaxed">
            Create an account to start dispatching trips, tracking vehicles, and analyzing your fleet's operations.
          </p>
        </div>

        <div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — register form */}
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

          <h1 className="text-2xl font-bold text-ink-onDark mb-1">Create account</h1>
          <p className="text-ink-onDarkMuted text-sm mb-8">Register to start managing your fleet workspace.</p>

          {/* Error box */}
          {error && (
            <div
              className="flex items-center gap-2 bg-status-retired/15 border border-status-retired/40 text-status-retired rounded-lg px-4 py-3 text-sm mb-6"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
              </svg>
              {error}
            </div>
          )}

          {/* Success box */}
          {success && (
            <div
              className="flex items-center gap-2 bg-green-500/15 border border-green-500/40 text-green-500 rounded-lg px-4 py-3 text-sm mb-6"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-ink-onDarkMuted mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password" className="block text-sm font-medium text-ink-onDarkMuted mb-1.5">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="reg-role" className="block text-sm font-medium text-ink-onDarkMuted mb-1.5">
                Workspace Role
              </label>
              <select
                id="reg-role"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="input bg-brand-dark-raised text-ink-onDark"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                'Register'
              )}
            </button>
          </form>

          <p className="text-ink-onDarkMuted text-xs mt-6 text-center lg:hidden">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
