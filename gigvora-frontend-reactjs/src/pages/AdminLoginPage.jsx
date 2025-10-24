import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';
import useSession from '../hooks/useSession.js';
import { requestAdminTwoFactor, verifyTwoFactorCode } from '../services/auth.js';
import { getInitials } from '../utils/profile.js';

const STEP = Object.freeze({
  CREDENTIALS: 'credentials',
  VERIFY: 'verify',
});
const RESEND_INTERVAL_SECONDS = 60;

function normaliseEmail(value) {
  return value?.trim().toLowerCase() ?? '';
}

function formatError(error) {
  if (!error) {
    return 'Something went wrong. Please try again.';
  }
  if (typeof error === 'string') {
    return error;
  }
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

  const [step, setStep] = useState(STEP.CREDENTIALS);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const isAdmin = useMemo(() => {
    if (!session) {
      return false;
    }
    const memberships = Array.isArray(session.memberships)
      ? session.memberships.map((value) => `${value}`.toLowerCase())
      : [];
    const role = `${session.role ?? ''}`.toLowerCase();
    const userType = `${session.userType ?? ''}`.toLowerCase();
    return memberships.includes('admin') || role === 'admin' || userType === 'admin';
  }, [session]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/dashboard/admin', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (!resendSeconds) {
      return undefined;
    }
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

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    if (requesting) {
      return;
    }
    if (!email || !password) {
      setError('Enter both your admin email and password.');
      return;
    }
    setError('');
    setStatus('');
    setRequesting(true);
    try {
      await requestAdminTwoFactor({ email: normaliseEmail(email), password });
      setStep(STEP.VERIFY);
      setCode('');
      setStatus(`Secure 2FA code sent to ${normaliseEmail(email)}. It expires in 10 minutes.`);
      setResendSeconds(RESEND_INTERVAL_SECONDS);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setRequesting(false);
    }
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    if (verifying) {
      return;
    }
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
        title: user.title ?? 'Platform Administrator',
        role: 'admin',
        memberships: ['admin'],
        accessToken,
        refreshToken,
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

  const handleResend = async () => {
    if (resendSeconds || requesting) {
      return;
    }
    setStatus('');
    setError('');
    setResendSeconds(RESEND_INTERVAL_SECONDS);
    try {
      await requestAdminTwoFactor({ email: normaliseEmail(email), password });
      setStatus('We have issued a fresh security code.');
    } catch (err) {
      setError(formatError(err));
      setResendSeconds(0);
    }
  };

  const initials = getInitials(session?.name, session?.email);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-surfaceMuted to-blue-50 px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-4xl flex-col gap-12 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <Link to="/" className="inline-flex items-center gap-3 text-sm text-slate-500 transition hover:text-accent">
            <span aria-hidden="true">←</span> Back to Gigvora
          </Link>
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <img src={LOGO_URL} alt="Gigvora" className="h-12" />
              <h1 className="text-3xl font-semibold text-slate-900">Admin Console</h1>
              <p className="text-sm text-slate-600">
                Restricted access for operations, security, and trust leadership.
              </p>
            </div>
            {error ? (
              <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600" role="alert">
                {error}
              </p>
            ) : null}
            {status ? (
              <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600" role="status">
                {status}
              </p>
            ) : null}
            {step === STEP.CREDENTIALS ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5" noValidate>
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
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                  disabled={requesting}
                >
                  {requesting ? 'Requesting secure code…' : 'Continue to 2FA'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifySubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label htmlFor="adminCode" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Enter 6-digit code
                  </label>
                  <input
                    id="adminCode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="123456"
                    required
                  />
                </div>
                <div className="flex flex-col gap-3 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={handleResend}
                    className="self-start rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={Boolean(resendSeconds)}
                  >
                    {resendSeconds ? `Resend available in ${resendSeconds}s` : 'Resend code'}
                  </button>
                  <span>Sent to {normaliseEmail(email)}. Codes expire after 10 minutes.</span>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                  disabled={verifying}
                >
                  {verifying ? 'Verifying…' : 'Verify & access admin panel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (verifying) return;
                    setStep(STEP.CREDENTIALS);
                    setCode('');
                    setStatus('Re-enter your credentials to request a fresh code.');
                  }}
                  className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Start over
                </button>
              </form>
            )}
          </div>
        </div>
        <aside className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-soft backdrop-blur">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-blue-100 opacity-60" aria-hidden="true" />
          <div className="relative z-10 space-y-4 text-sm text-slate-600">
            <h2 className="text-lg font-semibold text-slate-900">Admin guidelines</h2>
            <p>
              Every sign-in is protected with mandatory two-factor authentication. Codes are single use and expire quickly to
              keep access locked down.
            </p>
            <p>
              Confirm you are using your dedicated security device. If you lose access, reach the platform team through the
              emergency channel.
            </p>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Signed in as</p>
                <p className="text-xs text-slate-500">{session?.email || 'Awaiting verification'}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
