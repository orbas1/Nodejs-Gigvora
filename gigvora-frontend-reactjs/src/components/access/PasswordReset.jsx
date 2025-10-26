import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import PageHeader from '../PageHeader.jsx';
import FormStatusMessage from '../forms/FormStatusMessage.jsx';
import useFormState from '../../hooks/useFormState.js';
import { requestPasswordReset } from '../../services/auth.js';
import apiClient from '../../services/apiClient.js';
import { isValidEmail } from '../../utils/validation.js';
import {
  RESEND_DEFAULT_SECONDS,
  normaliseEmail,
  loadRememberedLogin,
} from '../../utils/authHelpers.js';

const RECOVERY_FACTS = [
  {
    id: 'zero-trust',
    title: 'Zero-trust reset flow',
    description: 'Every reset link is single-use, device scoped, and signed with rotating secrets to block takeover attempts.',
  },
  {
    id: 'observability',
    title: 'Observable by design',
    description: 'Audit trails capture request source, IP, and device fingerprint so security teams can confirm legitimacy instantly.',
  },
  {
    id: 'support',
    title: 'Support standing by',
    description: 'Our trust desk monitors recovery queues around the clock to intervene if something looks suspicious.',
  },
];

const NEXT_STEPS = [
  {
    id: 'update-password',
    title: 'Choose a memorable, strong passphrase',
    description: 'Aim for 12+ characters, unique to Gigvora, with a blend of words, numbers, and symbols.',
  },
  {
    id: 'refresh-sessions',
    title: 'Review active sessions',
    description: 'After resetting, visit Settings → Security to revoke stale devices and confirm trusted browsers.',
  },
  {
    id: 'enable-two-factor',
    title: 'Upgrade to two-factor',
    description: 'Turn on SMS or authenticator prompts for an additional layer across desktop, mobile, and admin portals.',
  },
];

function formatCooldownLabel(seconds) {
  if (!seconds) {
    return null;
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes <= 0) {
    return `${remaining}s`;
  }
  return `${minutes}:${remaining.toString().padStart(2, '0')} min`;
}

function resolveCooldownFromError(error) {
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
}

export default function PasswordReset({
  defaultEmail = '',
  className,
  onSuccess,
  eyebrow = 'Password recovery',
  title = "We'll help you get back in",
  description = "Enter the email linked to your Gigvora account and we'll send instructions to create a new password.",
  showInsights = true,
}) {
  const [rememberedMeta] = useState(() => loadRememberedLogin());
  const [email, setEmail] = useState(() => defaultEmail || rememberedMeta?.email || '');
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

  useEffect(() => {
    if (!cooldown) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCooldown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
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

  const formattedCooldown = useMemo(() => formatCooldownLabel(cooldown), [cooldown]);
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

  const contactEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@gigvora.com';
  const rememberedMessage = rememberedEmailPrefilled && rememberedLabel
    ? `Prefilled from your last secure sign-in on ${rememberedLabel}.`
    : null;

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
      const normalised = normaliseEmail(email);
      await requestPasswordReset(normalised);
      const nextCooldown = RESEND_DEFAULT_SECONDS;
      setCooldown(nextCooldown);
      setInitialCooldown(nextCooldown);
      setSuccess('Check your inbox for the secure link to reset your password.');
      onSuccess?.(normalised);
    } catch (error) {
      if (error instanceof apiClient.ApiError) {
        if (error.status === 429) {
          const retrySeconds = resolveCooldownFromError(error) ?? RESEND_DEFAULT_SECONDS;
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
    <div className={`space-y-12 ${className ?? ''}`}>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <FormStatusMessage type={messageType ?? 'info'} message={message} {...feedbackProps} />
          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            {rememberedMessage ? (
              <p className="text-xs text-slate-500" role="status" aria-live="polite">
                {rememberedMessage}
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
                <div className="h-1.5 rounded-full bg-accent transition-all duration-500" style={{ width: `${cooldownProgress}%` }} />
              </div>
            </div>
          ) : null}
          <div className="rounded-2xl bg-surfaceMuted/60 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-900">Security commitments</p>
            <p>
              Reset links expire quickly, bind to device fingerprints, and require you to create a brand-new password. If you
              spot unusual activity, contact <a href={`mailto:${contactEmail}`} className="font-semibold text-accent hover:text-accentDark">{contactEmail}</a> immediately.
            </p>
          </div>
        </form>
        {showInsights ? (
          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">How we protect your recovery</h2>
              <ul className="space-y-4 text-sm text-slate-600">
                {RECOVERY_FACTS.map((fact) => (
                  <li key={fact.id} className="flex gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{fact.title}</span>
                      <span className="text-xs text-slate-600">{fact.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-surfaceMuted/60 p-5">
              <h3 className="text-sm font-semibold text-slate-900">After you reset</h3>
              <ul className="space-y-3 text-xs text-slate-600">
                {NEXT_STEPS.map((step) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent/60" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{step.title}</span>
                      <span>{step.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

PasswordReset.propTypes = {
  defaultEmail: PropTypes.string,
  className: PropTypes.string,
  onSuccess: PropTypes.func,
  eyebrow: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  showInsights: PropTypes.bool,
};
