import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import { loginWithPassword, verifyTwoFactor, resendTwoFactor, loginWithGoogle } from '../services/auth.js';
import apiClient from '../services/apiClient.js';

const DASHBOARD_ROUTES = {
  admin: '/dashboard/admin',
  agency: '/dashboard/agency',
  company: '/dashboard/company',
  freelancer: '/dashboard/freelancer',
  headhunter: '/dashboard/headhunter',
  mentor: '/dashboard/mentor',
  user: '/feed',
};

function resolveLanding(session) {
  if (!session) {
    return '/feed';
  }
  const key = session.primaryDashboard ?? session.memberships?.[0];
  return DASHBOARD_ROUTES[key] ?? '/feed';
}

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

export default function LoginPage() {
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
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    if (status !== 'idle') return;

    setStatus('submitting');
    setError(null);
    setInfo(null);
    try {
      const response = await loginWithPassword({ email, password });
      if (response.requiresTwoFactor) {
        setChallenge(response.challenge);
        setCode('');
        setInfo(`Verification code sent to ${response.challenge.maskedDestination}.`);
      } else if (response.session) {
        const sessionState = login(response.session);
        navigate(resolveLanding(sessionState), { replace: true });
      } else {
        throw new Error('Unexpected authentication response.');
      }
    } catch (submissionError) {
      if (submissionError instanceof apiClient.ApiError) {
        setError(submissionError.body?.message || submissionError.message);
      } else {
        setError(submissionError.message || 'Unable to sign in. Please try again.');
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
      navigate(resolveLanding(sessionState), { replace: true });
    } catch (verificationError) {
      if (verificationError instanceof apiClient.ApiError) {
        setError(verificationError.body?.message || verificationError.message);
      } else {
        setError(verificationError.message || 'Invalid or expired code.');
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
      setInfo(`New verification code sent to ${nextChallenge.maskedDestination}.`);
    } catch (resendError) {
      if (resendError instanceof apiClient.ApiError) {
        setError(resendError.body?.message || resendError.message);
      } else {
        setError(resendError.message || 'Unable to resend code at this time.');
      }
    } finally {
      setStatus('idle');
    }
  };

  const handleGoogleSuccess = async (response) => {
    if (!response?.credential || status !== 'idle') {
      return;
    }
    setStatus('google');
    setError(null);
    setInfo(null);
    try {
      const result = await loginWithGoogle(response.credential);
      const sessionState = login(result.session);
      navigate(resolveLanding(sessionState), { replace: true });
    } catch (googleError) {
      if (googleError instanceof apiClient.ApiError) {
        setError(googleError.body?.message || googleError.message);
      } else {
        setError(googleError.message || 'Google sign-in failed.');
      }
    } finally {
      setStatus('idle');
    }
  };

  const handleGoogleError = () => {
    setStatus('idle');
    setError('Google sign-in was cancelled. Please try again.');
    setInfo('You can continue with your email and password or try Google again in a moment.');
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Sign in"
          title="Welcome back to Gigvora"
          description="Reconnect with your network, pick up where you left off on projects, and discover fresh opportunities tailored to you."
        />
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              {!awaitingTwoFactor ? (
                <form onSubmit={handleCredentialsSubmit} className="space-y-6" noValidate>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                  {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
                  {info ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{info}</p> : null}
                  <button
                    type="submit"
                    className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                    disabled={status !== 'idle'}
                  >
                    {status === 'submitting' ? 'Sending code…' : 'Request 2FA code'}
                  </button>
                  <div className="relative py-4 text-center text-xs uppercase tracking-[0.35em] text-slate-400">
                    <span className="relative z-10 bg-white px-3">or</span>
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" aria-hidden="true" />
                  </div>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                    >
                      Create a new account
                    </button>
                    <div className="flex justify-center">
                      {googleEnabled ? (
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          useOneTap={false}
                          width="100%"
                          text="continue_with"
                          shape="pill"
                        />
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-400"
                        >
                          Google sign-in unavailable
                        </button>
                      )}
                    </div>
                    <p className="text-center text-xs text-slate-500">
                      Enterprise security is enforced for every login, including optional 2FA and Google SSO.
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-6" noValidate>
                  <div className="space-y-2">
                    <label htmlFor="twoFactorCode" className="text-sm font-medium text-slate-700">
                      Enter the 6-digit code we sent
                    </label>
                    <input
                      id="twoFactorCode"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      placeholder="123456"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      Sent to <span className="font-medium text-slate-700">{challenge?.maskedDestination}</span>
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
                    {status === 'verifying' ? 'Verifying…' : 'Verify & sign in'}
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
                      Use a different account
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-500">
                    Having trouble? Contact <a href="mailto:support@gigvora.com" className="font-semibold text-accent hover:text-accentDark">support@gigvora.com</a> and our trust team will help.
                  </p>
                </form>
              )}
            </div>
          </div>
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Security-first authentication</h2>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Email + password with anomaly detection and device reputation checks on every sign-in.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Configurable 2FA via secure email codes today, authenticator apps and passkeys next.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Mobile parity: the Flutter app honours the same enterprise policies and responsive styling.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>SSO ready: Google login keeps admin, agency, and talent accounts in the right workspaces.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
