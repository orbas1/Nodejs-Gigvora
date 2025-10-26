import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import FormStatusMessage from '../components/forms/FormStatusMessage.jsx';
import useFormState from '../hooks/useFormState.js';
import { requestPasswordReset } from '../services/auth.js';
import apiClient from '../services/apiClient.js';
import { isValidEmail } from '../utils/validation.js';
import { RESEND_DEFAULT_SECONDS, normaliseEmail, loadRememberedLogin } from '../utils/authHelpers.js';

export default function ForgotPasswordPage() {
  const [rememberedMeta] = useState(() => loadRememberedLogin());
  const [email, setEmail] = useState(() => rememberedMeta?.email ?? '');
  const [cooldown, setCooldown] = useState(0);
  const [initialCooldown, setInitialCooldown] = useState(0);
  const {
    status,
    setStatus,
    message,
    messageType,
    setError,
    setInfo,
    setSuccess,
    clearMessage,
    feedbackProps,
  } = useFormState();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cooldown) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCooldown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [cooldown]);

  const formattedCooldown = useMemo(() => {
    if (!cooldown) {
      return null;
    }

    const minutes = Math.floor(cooldown / 60);
    const seconds = cooldown % 60;

    if (minutes <= 0) {
      return `${seconds}s`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')} min`;
  }, [cooldown]);

  const rememberedEmailPrefilled = Boolean(rememberedMeta?.email);
  const rememberedSavedAt = Number.isFinite(rememberedMeta?.savedAt) ? rememberedMeta.savedAt : null;
  const rememberedLabel = useMemo(() => {
    if (!rememberedSavedAt) {
      return null;
    }
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(rememberedSavedAt));
    } catch (error) {
      return null;
    }
  }, [rememberedSavedAt]);

  const cooldownProgress = useMemo(() => {
    if (!initialCooldown) {
      return 0;
    }
    const consumed = initialCooldown - cooldown;
    if (consumed <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((consumed / initialCooldown) * 100));
  }, [cooldown, initialCooldown]);

  const resolveCooldownSeconds = (error) => {
    if (!error?.body || typeof error.body !== 'object') {
      return null;
    }

    const { retryAfterSeconds, cooldownSeconds, retryAfter, meta } = error.body;
    const candidates = [retryAfterSeconds, cooldownSeconds, retryAfter, meta?.cooldownSeconds];

    for (const value of candidates) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessage();

    if (!isValidEmail(email)) {
      setError('Enter the email associated with your account.');
      return;
    }

    if (cooldown) {
      setInfo('Please wait for the cooldown to finish before requesting another reset link.');
      return;
    }

    setStatus('submitting');
    try {
      await requestPasswordReset(normaliseEmail(email));
      const nextCooldown = RESEND_DEFAULT_SECONDS;
      setCooldown(nextCooldown);
      setInitialCooldown(nextCooldown);
      setSuccess('Check your inbox for the secure link to reset your password.');
    } catch (error) {
      if (error instanceof apiClient.ApiError) {
        if (error.status === 429) {
          const retrySeconds = resolveCooldownSeconds(error) ?? RESEND_DEFAULT_SECONDS;
          setCooldown(retrySeconds);
          setInitialCooldown(retrySeconds);
          setError(`You requested too many resets. Try again in ${retrySeconds} seconds.`);
        } else {
          setError(error.body?.message || error.message);
        }
      } else {
        setError(error?.message || 'We could not start the reset. Please try again.');
      }
    } finally {
      setStatus('idle');
    }
  };

  const isSubmitting = status === 'submitting';
  const isCoolingDown = cooldown > 0;

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -bottom-24 left-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6">
        <PageHeader
          eyebrow="Reset your password"
          title="We'll help you get back in"
          description="Enter the email linked to your Gigvora account and we'll send instructions to create a new password."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <FormStatusMessage type={messageType ?? 'info'} message={message} {...feedbackProps} />
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              {rememberedEmailPrefilled && rememberedLabel ? (
                <p className="text-xs text-slate-500" role="status" aria-live="polite">
                  Prefilled from your last secure sign-in on {rememberedLabel}.
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={isSubmitting || isCoolingDown}
            >
              {isSubmitting
                ? 'Sending instructions…'
                : isCoolingDown
                  ? `Available in ${formattedCooldown ?? `${cooldown}s`}`
                  : 'Send reset link'}
            </button>
            {isCoolingDown ? (
              <div className="space-y-2" role="status" aria-live="polite">
                <p className="text-center text-xs font-medium text-slate-500">
                  You can request another link once the {formattedCooldown ?? `${cooldown}s`} cooldown finishes.
                </p>
                <div className="mx-auto h-1.5 w-full max-w-sm rounded-full bg-slate-200">
                  <div
                    className="h-1.5 rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${cooldownProgress}%` }}
                  />
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full rounded-full border border-slate-200 px-8 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Return to sign in
            </button>
          </form>
          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">What happens next?</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Look for a message from security@gigvora.com with a secure one-time link.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Follow the instructions within 30 minutes to set a new password and re-enable two-factor authentication.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Didn't receive the email? Check your spam folder or contact support@gigvora.com for assistance.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>For your security, reset requests are rate limited—wait for the countdown before submitting a new request.</span>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
