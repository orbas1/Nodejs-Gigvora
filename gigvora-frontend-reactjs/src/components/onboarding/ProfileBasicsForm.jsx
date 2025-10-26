import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { validatePasswordStrength } from '../../utils/validation.js';

const PASSWORD_STRENGTH_LABELS = ['Needs improvement', 'Getting there', 'Strong', 'Elite'];

function resolvePasswordRules(password) {
  const value = typeof password === 'string' ? password.trim() : '';
  return [
    { id: 'length', label: 'At least 8 characters', met: value.length >= 8 },
    { id: 'letter', label: 'Includes a letter', met: /[a-zA-Z]/.test(value) },
    { id: 'number', label: 'Includes a number', met: /\d/.test(value) },
    { id: 'symbol', label: 'Includes a symbol', met: /[^\da-zA-Z]/.test(value) },
  ];
}

export default function ProfileBasicsForm({ value, onFieldChange, maxBirthDate, requireBirthDate }) {
  const normalized = value ?? {};
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = useMemo(() => resolvePasswordRules(normalized.password), [normalized.password]);
  const passwordScore = useMemo(
    () => passwordRules.filter((rule) => rule.met).length,
    [passwordRules],
  );

  const passwordStrengthPercent = useMemo(
    () => (passwordRules.length ? Math.round((passwordScore / passwordRules.length) * 100) : 0),
    [passwordRules.length, passwordScore],
  );

  const passwordStrengthMeta = useMemo(() => {
    const ratio = passwordRules.length ? passwordScore / passwordRules.length : 0;
    if (ratio >= 0.95) {
      return { label: PASSWORD_STRENGTH_LABELS[3], barClass: 'bg-blue-600' };
    }
    if (ratio >= 0.75) {
      return { label: PASSWORD_STRENGTH_LABELS[2], barClass: 'bg-emerald-500' };
    }
    if (ratio >= 0.5) {
      return { label: PASSWORD_STRENGTH_LABELS[1], barClass: 'bg-amber-500' };
    }
    return { label: PASSWORD_STRENGTH_LABELS[0], barClass: 'bg-rose-500' };
  }, [passwordRules.length, passwordScore]);

  const passwordStrengthWidth = useMemo(() => {
    if (!passwordRules.length) {
      return 0;
    }
    if (passwordScore === 0) {
      return 12;
    }
    return Math.min(100, Math.max(passwordStrengthPercent, 32));
  }, [passwordRules.length, passwordScore, passwordStrengthPercent]);

  const passwordInsights = useMemo(() => validatePasswordStrength(normalized.password), [normalized.password]);

  const handleInputChange = (event) => {
    const { name, value: nextValue } = event.target;
    onFieldChange?.(name, nextValue);
  };

  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Profile basics</legend>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            value={normalized.firstName ?? ''}
            onChange={handleInputChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            value={normalized.lastName ?? ''}
            onChange={handleInputChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={normalized.email ?? ''}
            onChange={handleInputChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700">
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={normalized.dateOfBirth ?? ''}
            onChange={handleInputChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            max={maxBirthDate}
            required={requireBirthDate}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={normalized.password ?? ''}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-24 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={normalized.confirmPassword ?? ''}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-24 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((previous) => !previous)}
              className="absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600">
          <span>{passwordStrengthMeta.label}</span>
          <span>{passwordStrengthPercent}% secure</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-200" aria-hidden="true">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${passwordStrengthMeta.barClass}`}
            style={{ width: `${passwordStrengthWidth}%` }}
          />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.5fr,1fr]">
          <ul className="space-y-2 text-xs text-slate-500">
            {passwordRules.map((rule) => (
              <li key={rule.id} className={`flex items-center gap-2 ${rule.met ? 'text-emerald-600' : ''}`}>
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${rule.met ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  aria-hidden="true"
                />
                <span>{rule.label}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-white/70 p-4 text-xs text-slate-500 shadow-inner">
            <p className="font-semibold text-slate-700">Security tips</p>
            <p className="mt-1">
              {passwordInsights.recommendations.length
                ? passwordInsights.recommendations.join(' ')
                : 'Great choice. Your password meets every requirement for a secure launch.'}
            </p>
          </div>
        </div>
      </div>
    </fieldset>
  );
}

ProfileBasicsForm.propTypes = {
  value: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    dateOfBirth: PropTypes.string,
    password: PropTypes.string,
    confirmPassword: PropTypes.string,
  }),
  onFieldChange: PropTypes.func,
  maxBirthDate: PropTypes.string,
  requireBirthDate: PropTypes.bool,
};

ProfileBasicsForm.defaultProps = {
  requireBirthDate: true,
};
