import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import { loginWithPassword, verifyTwoFactor, resendTwoFactor, loginWithGoogle } from '../services/auth.js';
import apiClient from '../services/apiClient.js';
import SocialAuthButton, { SOCIAL_PROVIDERS } from '../components/SocialAuthButton.jsx';
import {
  DASHBOARD_ROUTES,
  resolveLanding,
  formatVerificationExpiry,
  redirectToSocialProvider,
  getProviderLabel,
  RESEND_COOLDOWN_SECONDS,
} from '../utils/authHelpers.js';

export { DASHBOARD_ROUTES, resolveLanding, formatVerificationExpiry };
export { formatVerificationExpiry as formatExpiry };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const { login } = useSession();

  const awaitingTwoFactor = Boolean(challenge?.tokenId);
  const browserLocale = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
  const codeExpiresAt = useMemo(
    () => formatVerificationExpiry(challenge?.expiresAt, browserLocale),
    [challenge?.expiresAt, browserLocale],
  );
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (!awaitingTwoFactor) {
      setResendCooldown(0);
      return undefined;
    }

    setResendCooldown((current) => (current > 0 ? current : RESEND_COOLDOWN_SECONDS));
    const timer = window.setInterval(() => {
      setResendCooldown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [awaitingTwoFactor]);

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
        setInfo('Check your email for the verification code to finish signing in.');
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
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
    if (!challenge?.tokenId || status !== 'idle' || resendCooldown > 0) return;
    setStatus('resending');
    setError(null);
    try {
      const nextChallenge = await resendTwoFactor(challenge.tokenId);
      setChallenge(nextChallenge);
      setCode('');
      setInfo(`New verification code sent to ${nextChallenge.maskedDestination}.`);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
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

  const handleSocialRedirect = (provider) => {
    if (status !== 'idle') {
      return;
    }

    setError(null);
    setInfo(`Redirecting to ${getProviderLabel(provider)} to continue.`);
    setStatus('redirecting');
    try {
      redirectToSocialProvider(provider, 'login');
    } catch (redirectError) {
      setStatus('idle');
      setInfo(null);
      setError(redirectError.message || 'Social sign-in is not available right now. Please try another option.');
    }
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
                    <div className="relative">
                      <input
                        id="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasswordVisible((current) => !current)}
                        className="absolute inset-y-0 right-3 inline-flex items-center text-xs font-semibold text-slate-500 transition hover:text-accent"
                      >
                        {isPasswordVisible ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="font-semibold text-accent transition hover:text-accentDark"
                    >
                      Forgot password?
                    </button>
                    <span className="text-slate-400">Minimum 8 characters</span>
                  </div>
                  {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
                  {info ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{info}</p> : null}
                  <button
                    type="submit"
                    className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                    disabled={status !== 'idle'}
                  >
                    {status === 'submitting' ? 'Signing in…' : 'Sign in'}
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
                    <div className="grid gap-3">
                      {SOCIAL_PROVIDERS.map((provider) => (
                        <SocialAuthButton
                          key={provider}
                          provider={provider}
                          onClick={() => handleSocialRedirect(provider)}
                          disabled={status !== 'idle'}
                        />
                      ))}
                      <div className="w-full">
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
                    </div>
                    <p className="text-center text-xs text-slate-500">
                      Prefer to use a social account? Choose your network above and we&apos;ll guide you through a secure sign-in.
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-6" noValidate>
                  <div className="space-y-2">
                    <label htmlFor="twoFactorCode" className="text-sm font-medium text-slate-700">
                      Enter the 6-digit verification code
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
                      disabled={status !== 'idle' || resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChallenge(null);
                        setCode('');
                        setInfo(null);
                        setResendCooldown(0);
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
            <h2 className="text-xl font-semibold text-slate-900">Pick up right where you left off</h2>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Stay connected across gigs, jobs, and projects with a single secure account.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Switch between freelancer, agency, and company dashboards after you add each role.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Use your favourite social network to get started in seconds, then tailor your profile.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Need a hand? Our support team is on standby for onboarding and account help.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
