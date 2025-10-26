import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import PageHeader from '../PageHeader.jsx';
import FormStatusMessage from '../forms/FormStatusMessage.jsx';
import useFormState from '../../hooks/useFormState.js';
import { resetPassword, verifyPasswordResetToken } from '../../services/auth.js';
import { validatePasswordStrength } from '../../utils/validation.js';

const PASSWORD_STRENGTH_LABELS = ['Needs work', 'On track', 'Strong', 'Elite'];

function formatExpiry(timestamp) {
  if (!timestamp) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  } catch (error) {
    return null;
  }
}

export default function PasswordReset({ token: providedToken }) {
  const [searchParams] = useSearchParams();
  const token = providedToken ?? searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenMeta, setTokenMeta] = useState(null);
  const [verificationState, setVerificationState] = useState('pending');
  const [countdown, setCountdown] = useState(null);
  const navigate = useNavigate();
  const { status, setStatus, setError, setInfo, setSuccess, clearMessage, message, messageType, feedbackProps } =
    useFormState('verifying');

  const passwordInsights = useMemo(() => validatePasswordStrength(password), [password]);
  const expiresAtLabel = useMemo(() => formatExpiry(tokenMeta?.expiresAt), [tokenMeta?.expiresAt]);

  useEffect(() => {
    if (!token) {
      setVerificationState('invalid');
      setStatus('error');
      setError('Your reset link is missing or has expired. Request a new email to continue.');
      return;
    }

    let cancelled = false;
    setVerificationState('pending');
    setStatus('verifying');
    setInfo('Confirming your secure reset link…');

    verifyPasswordResetToken(token)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setTokenMeta(result);
        setVerificationState('ready');
        setStatus('idle');
        setSuccess(`Reset link verified for ${result?.maskedEmail ?? 'your account'}.`);
        if (result?.expiresAt) {
          const milliseconds = Math.max(0, new Date(result.expiresAt).getTime() - Date.now());
          setCountdown(Math.round(milliseconds / 1000));
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setVerificationState('invalid');
        setStatus('error');
        setError(error?.body?.message || error?.message || 'This reset link is no longer valid.');
      });

    return () => {
      cancelled = true;
    };
  }, [setError, setInfo, setStatus, setSuccess, token]);

  useEffect(() => {
    if (!countdown) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setCountdown((value) => {
        if (!value || value <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [countdown]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'submitting' || verificationState !== 'ready') {
        return;
      }

      clearMessage();

      if (!password) {
        setError('Enter a new password to continue.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!passwordInsights.valid) {
        setError(`Choose a stronger password. ${passwordInsights.recommendations.join(' ')}`.trim());
        return;
      }

      setStatus('submitting');
      try {
        await resetPassword({ token, password });
        setSuccess('Your password has been reset. You can now sign in with your new credentials.');
        setStatus('success');
        setVerificationState('completed');
        setTimeout(() => navigate('/login'), 2500);
      } catch (error) {
        if (error?.status === 404) {
          setVerificationState('invalid');
        }
        if (error?.body?.message || error?.message) {
          setError(error.body?.message || error.message);
        } else {
          setError('We were unable to update your password. Request a fresh link and try again.');
        }
        setStatus('idle');
      }
    },
    [clearMessage, confirmPassword, navigate, password, passwordInsights, setError, setStatus, setSuccess, status, token, verificationState],
  );

  const passwordStrengthLabel = useMemo(() => {
    const score = passwordInsights.score ?? 0;
    return PASSWORD_STRENGTH_LABELS[Math.min(PASSWORD_STRENGTH_LABELS.length - 1, Math.max(0, score - 1))];
  }, [passwordInsights.score]);

  const strengthPercent = useMemo(() => Math.min(100, Math.max(0, (passwordInsights.score ?? 0) * 25)), [passwordInsights.score]);

  const countdownLabel = useMemo(() => {
    if (!countdown || countdown <= 0) {
      return null;
    }
    if (countdown >= 60) {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
    }
    return `${countdown}s remaining`;
  }, [countdown]);

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,239,255,0.5),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute left-12 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
      <div className="absolute right-0 top-0 h-80 w-80 -translate-y-1/3 rounded-full bg-indigo-200/40 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6">
        <PageHeader
          eyebrow="Secure your account"
          title="Choose a new password"
          description="We verified your reset link. Create a new password that you haven’t used before to regain access."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-soft"
            noValidate
          >
            <FormStatusMessage type={messageType ?? 'info'} message={message} {...feedbackProps} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    autoComplete="new-password"
                    required
                    disabled={verificationState !== 'ready' && verificationState !== 'completed'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  <p className="font-semibold text-slate-600">{passwordStrengthLabel}</p>
                  <div className="h-1.5 w-full rounded-full bg-slate-200">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        strengthPercent >= 75
                          ? 'bg-emerald-500'
                          : strengthPercent >= 50
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                      }`}
                      style={{ width: `${strengthPercent}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  {passwordInsights.recommendations.length ? (
                    <ul className="space-y-0.5 text-[11px] text-slate-500">
                      {passwordInsights.recommendations.map((tip) => (
                        <li key={tip}>• {tip}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    autoComplete="new-password"
                    required
                    disabled={verificationState !== 'ready' && verificationState !== 'completed'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-xs text-slate-500">Type your new password again so we can confirm it matches.</p>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={verificationState !== 'ready' || status === 'submitting'}
            >
              {status === 'submitting' ? 'Updating password…' : 'Reset password'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="w-full rounded-full border border-slate-200 px-8 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Request a fresh link
            </button>
          </form>
          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Security reminders</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>
                  {tokenMeta?.maskedEmail
                    ? `We sent this link to ${tokenMeta.maskedEmail}. Only complete the reset if you requested it.`
                    : 'Complete the reset only if you requested it from the Gigvora sign-in screen.'}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>
                  {expiresAtLabel
                    ? `The link expires on ${expiresAtLabel}. After that you’ll need to request a new email.`
                    : 'Reset links expire shortly after they are requested. Request another if this one stops working.'}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>
                  We’ll sign you out of other devices automatically once this reset completes to keep your account safe.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>
                  Need help? Contact <a href="mailto:support@gigvora.com" className="font-semibold text-accent">support@gigvora.com</a> and we’ll walk you through recovery.
                </span>
              </li>
            </ul>
            {countdownLabel ? (
              <p className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-600" role="status" aria-live="polite">
                {countdownLabel}
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}

PasswordReset.propTypes = {
  token: PropTypes.string,
};
