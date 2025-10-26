import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import FormStatusMessage from '../forms/FormStatusMessage.jsx';
import useFormState from '../../hooks/useFormState.js';
import { requestPasswordReset } from '../../services/auth.js';
import apiClient from '../../services/apiClient.js';
import { isValidEmail } from '../../utils/validation.js';
import { RESEND_DEFAULT_SECONDS, normaliseEmail, loadRememberedLogin } from '../../utils/authHelpers.js';

export default function PasswordReset({ className, onRequested }) {
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
      onRequested?.(email);
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
    <form onSubmit={handleSubmit} className={clsx('space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft', className)}>
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
  );
}

PasswordReset.propTypes = {
  className: PropTypes.string,
  onRequested: PropTypes.func,
};
