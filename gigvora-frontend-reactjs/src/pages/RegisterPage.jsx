import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import PageHeader from '../components/PageHeader.jsx';
import { registerUser, loginWithGoogle } from '../services/auth.js';
import apiClient from '../services/apiClient.js';
import useSession from '../hooks/useSession.js';
import SocialAuthButton, { SOCIAL_PROVIDERS } from '../components/SocialAuthButton.jsx';
import useFormState from '../hooks/useFormState.js';
import FormStatusMessage from '../components/forms/FormStatusMessage.jsx';
import { isValidEmail, validatePasswordStrength } from '../utils/validation.js';
import analytics from '../services/analytics.js';
import { ANALYTICS_EVENTS } from '../constants/analyticsEvents.js';
import useJourneyProgress from '../hooks/useJourneyProgress.js';

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

const PROVIDER_LABELS = {
  x: 'X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
};

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

export default function RegisterPage() {
  const [form, setForm] = useState(initialState);
  const { status, setStatus, setError, setInfo, setSuccess, clearMessage, message, messageType, feedbackProps } = useFormState();
  const navigate = useNavigate();
  const { login } = useSession();
  const { completeCheckpoint } = useJourneyProgress();

  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const maxBirthDate = new Date().toISOString().split('T')[0];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessage();
    if (!isValidEmail(form.email)) {
      setError('Enter a valid email address to continue.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.dateOfBirth) {
      setError('Please share your date of birth.');
      return;
    }
    const passwordStrength = validatePasswordStrength(form.password);
    if (!passwordStrength.valid) {
      setError(`Choose a stronger password. ${passwordStrength.recommendations.join(' ')}`);
      return;
    }
    setStatus('submitting');
    clearMessage();
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        dateOfBirth: form.dateOfBirth,
        password: form.password,
        twoFactorEnabled: false,
      };
      await registerUser(payload);
      setSuccess('Registration complete. You can now sign in and add any additional roles you need.');
      setForm(initialState);
      analytics.track(
        ANALYTICS_EVENTS.ACCOUNT_REGISTRATION_COMPLETED.name,
        { method: 'email', email: form.email },
        { actorType: 'anonymous', source: 'web_app' },
      );
      completeCheckpoint('account_registration_submitted', { method: 'email' });
    } catch (submissionError) {
      if (submissionError instanceof apiClient.ApiError) {
        setError(submissionError.body?.message || submissionError.message);
      } else {
        setError(submissionError.message || 'We could not create your account. Please try again.');
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
    clearMessage();
    try {
      const result = await loginWithGoogle(response.credential);
      const sessionState = login(result.session);
      setSuccess('Signed in with Google. Redirecting you now.');
      analytics.track(
        ANALYTICS_EVENTS.ACCOUNT_REGISTRATION_SOCIAL_COMPLETED.name,
        { provider: 'google' },
        { actorType: 'anonymous', source: 'web_app' },
      );
      completeCheckpoint('account_registration_submitted', { method: 'google' });
      navigate(resolveLanding(sessionState), { replace: true });
    } catch (googleError) {
      if (googleError instanceof apiClient.ApiError) {
        setError(googleError.body?.message || googleError.message);
      } else {
        setError(googleError.message || 'Google sign up failed. Please try again.');
      }
    } finally {
      setStatus('idle');
    }
  };

  const handleGoogleError = () => {
    setStatus('idle');
    clearMessage();
    setError('Google sign up was cancelled. Please try again.');
  };

  const handleSocialRedirect = (provider) => {
    if (status !== 'idle') {
      return;
    }

    clearMessage();
    setInfo(`Redirecting to ${provider === 'x' ? 'X' : provider.charAt(0).toUpperCase() + provider.slice(1)} to continue.`);
    setStatus('redirecting');
    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '');
    const authBase = apiBase.replace(/\/api$/, '');
    const routes = {
      x: '/auth/x/register',
      linkedin: '/auth/linkedin/register',
      facebook: '/auth/facebook/register',
    };

    const next = routes[provider];
    if (next) {
      window.location.href = `${authBase}${next}`;
    } else {
      setStatus('idle');
      setError('Social sign up is not available right now. Please try another option.');
    }
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.55),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Join the community"
          title="Create your Gigvora profile"
          description="Share a few details so we can tailor the experience to your goals across freelancing, career growth, and collaboration."
        />
        <div className="grid gap-10 lg:grid-cols-[1.25fr,0.75fr] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
            <FormStatusMessage
              type={messageType ?? 'info'}
              message={message}
              {...feedbackProps}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                  First name
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
                  Last name
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
                  Email address
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
                  Date of birth
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
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={status !== 'idle'}
            >
              {status === 'submitting' ? 'Creating your profile…' : 'Create profile'}
            </button>
            <div className="space-y-3">
              <div className="relative py-2 text-center text-xs uppercase tracking-[0.35em] text-slate-400">
                <span className="relative z-10 bg-white px-3">or</span>
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" aria-hidden="true" />
              </div>
              <div className="grid gap-3">
                {SOCIAL_PROVIDERS.map((provider) => (
                  <SocialAuthButton
                    key={provider}
                    provider={provider}
                    label={`Sign up with ${PROVIDER_LABELS[provider] ?? provider}`}
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
                      text="signup_with"
                      shape="pill"
                    />
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-400"
                    >
                      Google sign up unavailable
                    </button>
                  )}
                </div>
              </div>
              <p className="text-center text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-accent transition hover:text-accentDark"
                >
                  Sign in
                </button>{' '}
                to add more roles or continue where you left off.
              </p>
            </div>
          </form>
          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">What you unlock</h2>
            <ul className="space-y-4 text-sm text-slate-600">
              {onboardingHighlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-slate-200 bg-surfaceMuted p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Create once, shine everywhere.</p>
              <p className="mt-2">
                Your Gigvora identity syncs with the mobile app and agency/company hubs so you can pitch, hire, and collaborate seamlessly.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
