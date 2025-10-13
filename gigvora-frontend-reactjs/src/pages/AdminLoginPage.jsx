import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';
import { requestAdminTwoFactor, verifyTwoFactorCode } from '../services/auth.js';
import useSession from '../hooks/useSession.js';

const STEP_CREDENTIALS = 'credentials';
const STEP_VERIFICATION = 'verification';
const RESEND_INTERVAL_SECONDS = 60;

function resolveInitials(name, email) {
  const source = name?.trim() || email?.trim() || 'GV';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2)
    .padEnd(2, 'G');
}

function normaliseEmail(value) {
  return value?.trim().toLowerCase() ?? '';
}

function formatError(error) {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;
  if (error.status === 401) {
    return 'We could not verify those credentials. Double-check the email and password.';
  }
  if (error.status === 403) {
    return 'Your account does not have admin privileges. Contact the platform team for access.';
  }
  return error.message ?? 'Unexpected error. Please try again.';
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated, login } = useSession();

  const [step, setStep] = useState(STEP_CREDENTIALS);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const isAdmin = useMemo(() => {
    if (!session) return false;
    const directRole = session.role?.toLowerCase?.() === 'admin';
    const membership = Array.isArray(session.memberships)
      ? session.memberships.map((value) => `${value}`.toLowerCase())
      : [];
    const hasMembership = membership.includes('admin');
    const userType = session.user?.userType === 'admin';
    return directRole || hasMembership || userType;
  }, [session]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/dashboard/admin', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = window.setInterval(() => {
      setResendSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [resendSeconds]);

  const handleRequestCode = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Enter both your admin email and password.');
      return;
    }
    setError('');
    setStatus('');
    setRequesting(true);
    try {
      await requestAdminTwoFactor({ email: normaliseEmail(email), password });
      setStep(STEP_VERIFICATION);
      setCode('');
      setStatus(`Secure 2FA code sent to ${normaliseEmail(email)}. It expires in 10 minutes.`);
      setResendSeconds(RESEND_INTERVAL_SECONDS);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setRequesting(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    if (!code?.trim()) {
      setError('Enter the 6-digit verification code from your inbox.');
      return;
    }
    setError('');
    setStatus('');
    setVerifying(true);
    try {
      const response = await verifyTwoFactorCode({ email: normaliseEmail(email), code: code.trim() });
      const { accessToken, refreshToken, user } = response ?? {};
      if (!user || `${user.userType}`.toLowerCase() !== 'admin') {
        throw Object.assign(new Error('Admin access required'), { status: 403 });
      }

      const adminName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || 'Admin';
      login({
        user,
        email: user.email ?? normaliseEmail(email),
        name: adminName,
        title: user.title ?? 'Chief Platform Administrator',
        role: 'admin',
        memberships: ['admin'],
        activeMembership: 'admin',
        initials: resolveInitials(adminName, user.email ?? email),
        accessToken,
        refreshToken,
        lastLoginAt: new Date().toISOString(),
        isAuthenticated: true,
      });
      setStatus('Verification successful. Redirecting to the control tower…');
      setTimeout(() => {
        navigate('/dashboard/admin', { replace: true });
      }, 400);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setVerifying(false);
    }
  };

  const canResend = step === STEP_VERIFICATION && resendSeconds === 0 && !requesting && !verifying;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-surfaceMuted to-blue-50 px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.45),_transparent_65%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-4xl flex-col gap-12 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <Link to="/" className="inline-flex items-center gap-3 text-sm text-slate-500 transition hover:text-accent">
            <span aria-hidden="true">←</span> Back to Gigvora
          </Link>
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <img src={LOGO_URL} alt="Gigvora" className="h-12" />
              <h1 className="text-3xl font-semibold text-slate-900">Admin Console</h1>
              <p className="text-sm text-slate-600">Secure access for Gigvora operations and trust &amp; safety teams.</p>
            </div>
            {error ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            ) : null}
            {status ? (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700" role="status">
                {status}
              </div>
            ) : null}
            {step === STEP_CREDENTIALS ? (
              <form onSubmit={handleRequestCode} className="space-y-5 text-left" noValidate>
                <div className="space-y-2">
                  <label htmlFor="adminEmail" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Admin email
                  </label>
                  <input
                    id="adminEmail"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="ops@gigvora.com"
                    required
                    disabled={requesting}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="adminPassword" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Password
                  </label>
                  <input
                    id="adminPassword"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="••••••••"
                    required
                    disabled={requesting}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={requesting}
                >
                  {requesting ? 'Requesting secure code…' : 'Request secure 2FA code'}
                </button>
                <p className="text-xs text-slate-500">We’ll email a one-time code and support authenticator apps soon.</p>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-5 text-left" noValidate>
                <div className="space-y-2">
                  <label htmlFor="adminEmailReadOnly" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Admin email
                  </label>
                  <input
                    id="adminEmailReadOnly"
                    type="email"
                    value={normaliseEmail(email)}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="adminCode" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Enter 6-digit code
                  </label>
                  <input
                    id="adminCode"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 tracking-[0.3em] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="123456"
                    required
                    disabled={verifying}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={verifying}
                >
                  {verifying ? 'Verifying code…' : 'Verify & enter console'}
                </button>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Need another code?</span>
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    className="font-semibold text-accent transition hover:text-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!canResend}
                  >
                    {canResend ? 'Resend secure code' : `Resend available in ${resendSeconds}s`}
                  </button>
                </div>
              </form>
            )}
            <p className="mt-8 text-center text-xs text-slate-500">
              Having trouble? Ping the platform team at <span className="text-slate-700">ops@gigvora.com</span>.
            </p>
          </div>
        </div>
        <aside className="flex-1 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Operational controls</h2>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Monitor live feed health, moderation queues, and trust &amp; safety flags.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Approve launchpad cohorts, spotlight gigs, and manage global announcements.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Review analytics dashboards tailored for leadership visibility.</span>
            </li>
          </ul>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            Sessions are monitored and protected with device fingerprinting and anomaly detection.
          </div>
        </aside>
      </div>
    </section>
  );
}
