import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useFormState from '../../hooks/useFormState.js';
import FormStatusMessage from '../forms/FormStatusMessage.jsx';
import { validateMatchingPasswords } from '../../utils/authHelpers.js';
import {
  PASSWORD_STRENGTH_REQUIREMENTS,
  describePasswordPolicy,
  validatePasswordStrength,
} from '../../utils/validation.js';
import { resetPassword, verifyPasswordResetToken } from '../../services/auth.js';
import apiClient from '../../services/apiClient.js';

const STRENGTH_LABELS = [
  { score: 0, label: 'Weak', toneClass: 'bg-rose-500' },
  { score: 1, label: 'Weak', toneClass: 'bg-rose-500' },
  { score: 2, label: 'Fair', toneClass: 'bg-amber-400' },
  { score: 3, label: 'Good', toneClass: 'bg-amber-500' },
  { score: 4, label: 'Strong', toneClass: 'bg-emerald-500' },
  { score: 5, label: 'Excellent', toneClass: 'bg-emerald-600' },
];

function computeStrength(password) {
  const value = typeof password === 'string' ? password.trim() : '';
  const evaluatedRules = PASSWORD_STRENGTH_REQUIREMENTS.map((rule) => ({
    id: rule.id,
    label: rule.label,
    shortLabel: rule.shortLabel,
    passes: rule.test(value),
  }));
  const score = evaluatedRules.filter((rule) => rule.passes).length;
  const cappedScore = Math.max(0, Math.min(STRENGTH_LABELS.length - 1, score));
  const labelMeta = STRENGTH_LABELS[cappedScore];
  const percentage = Math.min(100, Math.round((score / PASSWORD_STRENGTH_REQUIREMENTS.length) * 100));

  return {
    score,
    percentage,
    label: labelMeta.label,
    toneClass: labelMeta.toneClass,
    rules: evaluatedRules,
  };
}

function formatRemaining(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0s';
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) {
    return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default function PasswordReset({ token, className = '', onResetComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [verificationState, setVerificationState] = useState(() => (token ? 'checking' : 'missing'));
  const [tokenMeta, setTokenMeta] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [initialRemaining, setInitialRemaining] = useState(null);
  const [completionMeta, setCompletionMeta] = useState(null);

  const { status, setStatus, message, messageType, setError, setInfo, setSuccess, clearMessage, feedbackProps } =
    useFormState('idle');

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setVerificationState('missing');
      setError('Your reset link is missing a security token. Request a new email to continue.');
      return () => {
        cancelled = true;
      };
    }

    setVerificationState('checking');
    setStatus('verifying');
    setInfo('Validating your secure reset link…');

    async function verify() {
      try {
        const response = await verifyPasswordResetToken(token);
        if (cancelled) {
          return;
        }
        setTokenMeta(response);
        setVerificationState('valid');
        setStatus('idle');
        setInfo(`Reset the password for ${response.maskedEmail}.`);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setStatus('idle');
        setVerificationState('invalid');
        if (error instanceof apiClient.ApiError) {
          setError(error.body?.message || 'Reset link is invalid or has expired. Request a new one to continue.');
        } else {
          setError('We could not verify this reset link. Request a new email to continue.');
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, setError, setInfo, setStatus]);

  useEffect(() => {
    if (verificationState !== 'valid' || !tokenMeta?.expiresAt) {
      return undefined;
    }
    const expiry = new Date(tokenMeta.expiresAt);
    const expiryTime = expiry.getTime();
    if (Number.isNaN(expiryTime)) {
      return undefined;
    }

    let cancelled = false;

    const updateRemaining = () => {
      if (cancelled) {
        return;
      }
      const diff = Math.max(0, Math.round((expiryTime - Date.now()) / 1000));
      setRemainingSeconds(diff);
      setInitialRemaining((previous) => (previous == null ? diff : previous));
      if (diff === 0) {
        setVerificationState('expired');
      }
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [tokenMeta?.expiresAt, verificationState]);

  useEffect(() => {
    if (verificationState === 'expired') {
      setError('This reset link has expired. Request a new one to continue.');
    }
  }, [setError, verificationState]);

  const strength = useMemo(() => computeStrength(password), [password]);
  const strengthGuidance = useMemo(() => validatePasswordStrength(password), [password]);
  const passwordPolicySummary = useMemo(() => {
    if (tokenMeta?.passwordPolicy) {
      return describePasswordPolicy(tokenMeta.passwordPolicy);
    }
    const fallback = describePasswordPolicy();
    return fallback || null;
  }, [tokenMeta?.passwordPolicy]);
  const passwordsMatch = useMemo(() => password && confirmPassword && password === confirmPassword, [password, confirmPassword]);
  const formattedRemaining = useMemo(() => formatRemaining(remainingSeconds), [remainingSeconds]);
  const progress = useMemo(() => {
    if (!initialRemaining || !Number.isFinite(remainingSeconds)) {
      return 0;
    }
    if (initialRemaining === 0) {
      return 0;
    }
    const consumed = Math.max(0, initialRemaining - remainingSeconds);
    return Math.min(100, Math.round((consumed / initialRemaining) * 100));
  }, [initialRemaining, remainingSeconds]);

  const disableForm =
    verificationState !== 'valid' || status === 'submitting' || status === 'verifying' || verificationState === 'expired';
  const completed = verificationState === 'completed';

  const handleCapsLock = (event) => {
    if (typeof event.getModifierState === 'function') {
      setCapsLockOn(event.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disableForm || completed) {
      return;
    }
    clearMessage();

    const { valid: passwordsAreValid, message: mismatchMessage } = validateMatchingPasswords(password, confirmPassword);
    if (!passwordsAreValid) {
      setError(mismatchMessage);
      return;
    }

    const { valid: strengthValid, recommendations } = validatePasswordStrength(password);
    if (!strengthValid) {
      const guidance = recommendations?.length ? ` ${recommendations.join(' ')}` : '';
      setError(`Choose a stronger password to continue.${guidance}`);
      return;
    }

    setStatus('submitting');

    try {
      const response = await resetPassword({ token, password });
      setSuccess('Your password has been updated. You can now sign in with your new credentials.');
      setVerificationState('completed');
      setCompletionMeta(response ?? { success: true });
      setPassword('');
      setConfirmPassword('');
      onResetComplete?.(response);
    } catch (error) {
      if (error instanceof apiClient.ApiError) {
        setError(error.body?.message || 'Unable to reset the password. Try again or request a new link.');
      } else {
        setError(error?.message || 'Unable to reset the password right now. Try again later.');
      }
    } finally {
      setStatus('idle');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft ${className}`}>
      <FormStatusMessage type={messageType ?? 'info'} message={message} {...feedbackProps} />

      {verificationState === 'valid' && tokenMeta?.maskedEmail ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          We\'ll reset access for <span className="font-semibold text-slate-900">{tokenMeta.maskedEmail}</span>. Choose a new password
          and we\'ll close out any active sessions for extra security.
        </p>
      ) : null}

      {verificationState === 'valid' && Number.isFinite(remainingSeconds) ? (
        <div className="rounded-2xl border border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600" role="status" aria-live="polite">
            <span>Secure link expires in</span>
            <span className="text-slate-900">{formattedRemaining}</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
            <div className={`h-2 rounded-full ${progress >= 80 ? 'bg-rose-500' : 'bg-accent'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
          New password
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyUp={handleCapsLock}
            onKeyDown={handleCapsLock}
            disabled={disableForm || completed}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder="Create a secure password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold uppercase tracking-wide text-accent transition hover:text-accentDark"
            disabled={disableForm || completed}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {passwordPolicySummary ? <p className="text-xs text-slate-500">{passwordPolicySummary}</p> : null}
        {capsLockOn ? <p className="text-xs font-medium text-amber-600">Caps Lock appears to be on.</p> : null}
      </div>

      <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Password strength</span>
          <span
            className={`flex items-center gap-2 text-xs font-semibold ${
              strength.score >= 4 ? 'text-emerald-600' : strength.score >= 2 ? 'text-amber-600' : 'text-rose-600'
            }`}
          >
            <span className={`inline-flex h-2 w-12 overflow-hidden rounded-full bg-slate-200`}>
              <span className={`h-2 rounded-full ${strength.toneClass}`} style={{ width: `${Math.max(strength.percentage, 8)}%` }} />
            </span>
            {strength.label}
          </span>
        </div>
        <ul className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2" aria-live="polite">
          {strength.rules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                  rule.passes ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                }`}
                aria-hidden="true"
              >
                {rule.passes ? '✓' : '•'}
              </span>
              <span>{rule.label}</span>
            </li>
          ))}
        </ul>
        {strengthGuidance.recommendations?.length ? (
          <p className="text-xs text-slate-500">
            Suggestions: {strengthGuidance.recommendations.join(' ')}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
          Confirm new password
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            onKeyUp={handleCapsLock}
            onKeyDown={handleCapsLock}
            disabled={disableForm || completed}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold uppercase tracking-wide text-accent transition hover:text-accentDark"
            disabled={disableForm || completed}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {passwordsMatch ? <p className="text-xs font-semibold text-emerald-600">Passwords match.</p> : null}
      </div>

      <button
        type="submit"
        disabled={disableForm || completed}
        className="w-full rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/50"
      >
        {status === 'submitting' ? 'Securing your account…' : 'Update password'}
      </button>

      {completionMeta?.success ? (
        <p className="text-center text-xs text-slate-500" role="status" aria-live="polite">
          For your protection we signed you out of other sessions. Return to the sign-in screen to continue.
        </p>
      ) : null}
    </form>
  );
}

PasswordReset.propTypes = {
  token: PropTypes.string,
  className: PropTypes.string,
  onResetComplete: PropTypes.func,
};

PasswordReset.defaultProps = {
  token: '',
  className: '',
  onResetComplete: undefined,
};
