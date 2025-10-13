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

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
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
    }
  };

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
          </ul>
        </aside>
      </div>
    </section>
  );
}
