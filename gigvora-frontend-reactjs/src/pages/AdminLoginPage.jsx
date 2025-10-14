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
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';
import useSession from '../hooks/useSession.js';
import { loginWithPassword, verifyTwoFactor, resendTwoFactor } from '../services/auth.js';
import apiClient from '../services/apiClient.js';

const ADMIN_HOME = '/dashboard/admin';

function formatExpiry(timestamp) {
  if (!timestamp) return null;
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (error) {
    return null;
  }
}
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';
import useSession from '../hooks/useSession.js';
import { adminLogin, verifyTwoFactor } from '../services/auth.js';
import { apiClient } from '../services/apiClient.js';

const STEP = {
  credentials: 'credentials',
  verification: 'verification',
  success: 'success',
};

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
  const [challenge, setChallenge] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const navigate = useNavigate();
  const { login } = useSession();

  const awaitingTwoFactor = Boolean(challenge?.tokenId);
  const codeExpiresAt = useMemo(() => formatExpiry(challenge?.expiresAt), [challenge?.expiresAt]);

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    if (status !== 'idle') return;

    setStatus('submitting');
    setError(null);
    setInfo(null);
    try {
      const response = await loginWithPassword({ email, password, scope: 'admin' });
      if (response.requiresTwoFactor) {
        setChallenge(response.challenge);
        setCode('');
        setInfo(`Secure code sent to ${response.challenge.maskedDestination}.`);
      } else if (response.session) {
        const sessionState = login(response.session);
        navigate(ADMIN_HOME, { replace: true });
      } else {
        throw new Error('Unexpected authentication response.');
      }
    } catch (submissionError) {
      if (submissionError instanceof apiClient.ApiError) {
        setError(submissionError.body?.message || submissionError.message);
      } else {
        setError(submissionError.message || 'Unable to sign in to the admin console.');
      }
    } finally {
      setStatus('idle');
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!awaitingTwoFactor || status !== 'idle') return;

    setStatus('verifying');
    setError(null);
    setInfo(null);
    try {
      const response = await verifyTwoFactor({ email, code, tokenId: challenge.tokenId });
      const sessionState = login(response.session);
      setChallenge(null);
      setCode('');
      navigate(ADMIN_HOME, { replace: true });
    } catch (verificationError) {
      if (verificationError instanceof apiClient.ApiError) {
        setError(verificationError.body?.message || verificationError.message);
      } else {
        setError(verificationError.message || 'The verification code was invalid or expired.');
      }
    } finally {
      setStatus('idle');
    }
  };

  const handleResend = async () => {
    if (!challenge?.tokenId || status !== 'idle') return;
    setStatus('resending');
    setError(null);
    try {
      const nextChallenge = await resendTwoFactor(challenge.tokenId);
      setChallenge(nextChallenge);
      setCode('');
      setInfo(`New code issued to ${nextChallenge.maskedDestination}.`);
    } catch (resendError) {
      if (resendError instanceof apiClient.ApiError) {
        setError(resendError.body?.message || resendError.message);
      } else {
        setError(resendError.message || 'Unable to resend code right now.');
      }
    } finally {
      setStatus('idle');
  const [step, setStep] = useState(STEP.credentials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();
  const { login, session } = useSession();

  useEffect(() => {
    if (session?.memberships?.includes('admin')) {
      navigate('/dashboard/admin');
    }
  }, [session?.memberships, navigate]);

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setStatusMessage('');
    try {
      await adminLogin({ email: email.trim(), password });
      setStep(STEP.verification);
      setStatusMessage('A one-time security code has been dispatched to your verified channel.');
    } catch (err) {
      if (err?.status === 403) {
        setError('This account is not authorised for admin access. Contact the platform team.');
      } else if (err?.status === 401) {
        setError('Invalid credentials. Double-check your email and password.');
      } else {
        setError(err?.message || 'Unable to initiate secure login right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setStatusMessage('');
    try {
      const response = await verifyTwoFactor({ email: email.trim(), code: code.trim() });
      const accessToken = response?.accessToken;
      const refreshToken = response?.refreshToken;
      const user = response?.user ?? {};
      if (accessToken) {
        apiClient.setAuthToken(accessToken);
      }
      login({
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Admin',
        title: 'Platform Administrator',
        avatarSeed: user.firstName || user.email || 'Admin',
        email: user.email,
        userId: user.id,
        memberships: ['admin'],
        roles: ['admin'],
        primaryDashboard: 'admin',
        organisations: user.organisations ?? [],
        followers: 0,
        connections: 0,
        agencies: [],
        companies: [],
        lastAuthenticatedAt: new Date().toISOString(),
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });
      setStatusMessage('Authentication complete. Redirecting to the admin control tower…');
      setStep(STEP.success);
      setTimeout(() => navigate('/dashboard/admin'), 600);
    } catch (err) {
      if (err?.status === 401) {
        setError('Invalid or expired verification code. Request a new one if needed.');
      } else {
        setError(err?.message || 'Unable to verify the security code. Try again shortly.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isVerificationStep = step === STEP.verification || step === STEP.success;

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
              <p className="text-sm text-slate-600">Restricted access for operations, security, and trust leadership.</p>
            </div>
            {!awaitingTwoFactor ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5 text-left" noValidate>
                <div className="space-y-2">
                  <label htmlFor="adminEmail" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Admin email
                  </label>
                  <input
                    id="adminEmail"
                    type="email"
                    autoComplete="email"
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
                    minLength={12}
                  />
                </div>
                {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
                {info ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{info}</p> : null}
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                  disabled={status !== 'idle'}
                >
                  {status === 'submitting' ? 'Sending security code…' : 'Continue to 2FA'}
                </button>
                <p className="text-xs text-slate-500">
                  Every admin login is monitored and rate-limited. Use your dedicated security device when prompted.
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5 text-left" noValidate>
                <div className="space-y-2">
                  <label htmlFor="adminTwoFactor" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Verification code
                  </label>
                  <input
                    id="adminTwoFactor"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="123456"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Sent to <span className="font-semibold text-slate-700">{challenge?.maskedDestination}</span>
                    {codeExpiresAt ? ` • Expires around ${codeExpiresAt}` : ''}
                  </p>
                </div>
                {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
                {info ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{info}</p> : null}
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                  disabled={status !== 'idle' || code.length !== 6}
                >
                  {status === 'verifying' ? 'Verifying…' : 'Access admin console'}
                </button>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={handleResend}
                    className="font-semibold text-accent transition hover:text-accentDark disabled:text-slate-400"
                    disabled={status !== 'idle'}
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChallenge(null);
                      setCode('');
                      setInfo(null);
                    }}
                    className="font-semibold text-slate-500 transition hover:text-slate-700"
                  >
                    Use a different email
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Need assistance? Email <a href="mailto:ops@gigvora.com" className="font-semibold text-accent hover:text-accentDark">ops@gigvora.com</a> or trigger the on-call rotation.
                </p>
              </form>
            )}
              <p className="text-sm text-slate-600">
                Secure multi-factor access for Gigvora operations, compliance, and trust &amp; safety teams.
              </p>
            </div>
            <div className="space-y-5 text-left">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}
              {statusMessage ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{statusMessage}</div>
              ) : null}
              {step === STEP.credentials ? (
                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="adminEmail" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                      Admin email
                    </label>
                    <input
                      id="adminEmail"
                      type="email"
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
                    disabled={loading}
                  >
                    {loading ? 'Securing…' : 'Continue to 2FA'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerificationSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="verificationCode" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                      Enter security code
                    </label>
                    <input
                      id="verificationCode"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? 'Verifying…' : 'Verify & access admin panel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (loading) return;
                      setStep(STEP.credentials);
                      setCode('');
                      setStatusMessage('Re-enter your credentials to request a fresh code.');
                    }}
                    className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                  >
                    Start over
                  </button>
                </form>
              )}
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
              <span>Monitor live feed health, moderation queues, and trust &amp; safety flags in real time.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Approve launchpad cohorts, spotlight gigs, and manage global announcements.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Review analytics dashboards tailored for leadership visibility and audits.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Zero-trust enforced: hardware fingerprinting and anomaly detection guard every session.</span>
            </li>
          </ul>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            Sessions are monitored and protected with device fingerprinting and anomaly detection.
          </div>
          {isVerificationStep ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              Stay on this trusted device while completing verification. For emergency break-glass access, escalate via
              security@Gigvora.
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
