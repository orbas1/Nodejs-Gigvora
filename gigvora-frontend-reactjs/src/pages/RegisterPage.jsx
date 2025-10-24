import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import PageHeader from '../components/PageHeader.jsx';
import { registerUser, loginWithGoogle } from '../services/auth.js';
import apiClient from '../services/apiClient.js';
import useSession from '../hooks/useSession.js';
import SocialAuthButton, { SOCIAL_PROVIDERS } from '../components/SocialAuthButton.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  resolveLanding,
  redirectToSocialProvider,
  getProviderLabel,
  normaliseEmail,
} from '../utils/authHelpers.js';
import { calculatePasswordStrength, passwordsMatch } from '../utils/passwordUtils.js';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: '',
};

const onboardingHighlights = [
  'Showcase your craft with a multimedia profile and featured wins.',
  'Unlock tailored feeds across jobs, gigs, projects, and volunteering.',
  'Add freelancer, agency, or company capabilities later to switch dashboards instantly.',
];

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters' },
  { id: 'upper', label: 'One uppercase letter' },
  { id: 'lower', label: 'One lowercase letter' },
  { id: 'number', label: 'One number' },
  { id: 'symbol', label: 'One special character' },
];

function buildStrengthLabel(label, t) {
  if (label === 'strong') return t('auth.password.strength.strong', 'Strong');
  if (label === 'fair') return t('auth.password.strength.fair', 'Fair');
  if (label === 'weak') return t('auth.password.strength.weak', 'Weak');
  return t('auth.password.strength.empty', 'Enter a password');
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useSession();
  const { t } = useLanguage();

  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const maxBirthDate = new Date().toISOString().split('T')[0];

  const passwordStrength = useMemo(() => calculatePasswordStrength(form.password), [form.password]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!passwordsMatch(form.password, form.confirmPassword)) {
      setError(t('auth.password.errors.mismatch', 'Passwords do not match.'));
      return false;
    }
    if (!form.dateOfBirth) {
      setError(t('auth.password.errors.birthdate', 'Please share your date of birth.'));
      return false;
    }
    if (passwordStrength.score < 3) {
      setError(t('auth.password.errors.weak', 'Choose a stronger password to keep your account safe.'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    setStatus('submitting');
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: normaliseEmail(form.email),
        dateOfBirth: form.dateOfBirth,
        password: form.password,
        twoFactorEnabled: false,
      };
      await registerUser(payload);
      setSuccess(t('auth.register.success', 'Registration complete. You can now sign in and add any additional roles you need.'));
      setForm(initialState);
    } catch (submissionError) {
      if (submissionError instanceof apiClient.ApiError) {
        setError(submissionError.body?.message || submissionError.message);
      } else {
        setError(submissionError.message || t('auth.register.error', 'We could not create your account. Please try again.'));
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
    setSuccess(null);
    try {
      const result = await loginWithGoogle(response.credential);
      const sessionState = login(result.session);
      navigate(resolveLanding(sessionState), { replace: true });
    } catch (googleError) {
      if (googleError instanceof apiClient.ApiError) {
        setError(googleError.body?.message || googleError.message);
      } else {
        setError(googleError.message || t('auth.register.googleError', 'Google sign up failed. Please try again.'));
      }
    } finally {
      setStatus('idle');
    }
  };

  const handleGoogleError = () => {
    setStatus('idle');
    setError(t('auth.register.googleCancelled', 'Google sign up was cancelled. Please try again.'));
    setSuccess(null);
  };

  const handleSocialRedirect = (provider) => {
    if (status !== 'idle') {
      return;
    }

    setError(null);
    setSuccess(null);
    setStatus('redirecting');
    try {
      redirectToSocialProvider(provider, 'register');
    } catch (redirectError) {
      setStatus('idle');
      setError(redirectError.message || t('auth.register.socialError', 'Social sign up is not available right now. Please try another option.'));
    }
  };

  const strengthLabel = buildStrengthLabel(passwordStrength.label, t);
  const progressValue = Math.min(100, (passwordStrength.score / PASSWORD_REQUIREMENTS.length) * 100);

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.55),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow={t('auth.register.eyebrow', 'Join the community')}
          title={t('auth.register.title', 'Create your Gigvora profile')}
          description={t(
            'auth.register.description',
            'Share a few details so we can tailor the experience to your goals across freelancing, career growth, and collaboration.',
          )}
        />
        <div className="grid gap-10 lg:grid-cols-[1.25fr,0.75fr] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-soft" noValidate>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                  {t('auth.register.firstName', 'First name')}
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                  {t('auth.register.lastName', 'Last name')}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  {t('auth.register.email', 'Email address')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700">
                  {t('auth.register.dateOfBirth', 'Date of birth')}
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                  max={maxBirthDate}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  {t('auth.register.password', 'Password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 inline-flex items-center text-xs font-semibold text-slate-500 transition hover:text-accent"
                  >
                    {showPassword ? t('auth.password.hide', 'Hide') : t('auth.password.show', 'Show')}
                  </button>
                </div>
                <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">{t('auth.password.strength.label', 'Password strength')}</span>
                    <span className="font-semibold">{strengthLabel}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`${
                        passwordStrength.label === 'strong'
                          ? 'bg-emerald-500'
                          : passwordStrength.label === 'fair'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      } h-full transition-all`}
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {PASSWORD_REQUIREMENTS.map((requirement) => (
                      <li
                        key={requirement.id}
                        className={`flex items-center gap-2 ${
                          passwordStrength.requirementsMet.includes(requirement.id)
                            ? 'text-emerald-600'
                            : 'text-slate-500'
                        }`}
                      >
                        <span className="inline-flex h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                        <span>{t(`auth.password.requirements.${requirement.id}`, requirement.label)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  {t('auth.register.confirmPassword', 'Confirm password')}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 inline-flex items-center text-xs font-semibold text-slate-500 transition hover:text-accent"
                  >
                    {showConfirmPassword ? t('auth.password.hide', 'Hide') : t('auth.password.show', 'Show')}
                  </button>
                </div>
              </div>
            </div>
            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
            {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</p> : null}
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={status !== 'idle'}
            >
              {status === 'submitting' ? t('auth.register.submitting', 'Creating your profile…') : t('auth.register.cta', 'Create profile')}
            </button>
            <div className="space-y-3">
              <div className="relative py-2 text-center text-xs uppercase tracking-[0.35em] text-slate-400">
                <span className="relative z-10 bg-white px-3">{t('auth.register.or', 'or')}</span>
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" aria-hidden="true" />
              </div>
              <div className="grid gap-3">
                {SOCIAL_PROVIDERS.map((provider) => {
                  const providerLabel = getProviderLabel(provider);
                  return (
                    <SocialAuthButton
                      key={provider}
                      provider={provider}
                      label={`${t('auth.register.socialLabelPrefix', 'Sign up with')} ${providerLabel}`}
                      onClick={() => handleSocialRedirect(provider)}
                      disabled={status !== 'idle'}
                    />
                  );
                })}
                <div className="w-full">
                  {googleEnabled ? (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap={false}
                      width="100%"
                      text="signup_with"
                      shape="pill"
                    />
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-400"
                    >
                      {t('auth.register.googleUnavailable', 'Google sign up unavailable')}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-center text-xs text-slate-500">
                {t('auth.register.haveAccount', 'Already have an account?')}{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-accent transition hover:text-accentDark"
                >
                  {t('auth.register.signInLink', 'Sign in')}
                </button>{' '}
                {t('auth.register.continue', 'to add more roles or continue where you left off.')}
              </p>
            </div>
          </form>
          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{t('auth.register.unlockTitle', 'What you unlock')}</h2>
            <ul className="space-y-4 text-sm text-slate-600">
              {onboardingHighlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-slate-200 bg-surfaceMuted p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{t('auth.register.identityTitle', 'Create once, shine everywhere.')}</p>
              <p className="mt-2">
                {t(
                  'auth.register.identityDescription',
                  'Your Gigvora identity syncs with the mobile app and agency/company hubs so you can pitch, hire, and collaborate seamlessly.',
                )}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
