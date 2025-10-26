import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import SocialAuthButton, { SOCIAL_PROVIDERS } from '../SocialAuthButton.jsx';
import FormStatusMessage from '../forms/FormStatusMessage.jsx';
import useFormState from '../../hooks/useFormState.js';
import { registerUser, loginWithGoogle } from '../../services/auth.js';
import apiClient from '../../services/apiClient.js';
import useSession from '../../hooks/useSession.js';
import {
  describePasswordPolicy,
  isValidEmail,
  PASSWORD_STRENGTH_REQUIREMENTS,
  validatePasswordStrength,
} from '../../utils/validation.js';
import { normaliseEmail, saveRememberedLogin, redirectToSocialAuth } from '../../utils/authHelpers.js';
import { resolveLanding } from '../../utils/authNavigation.js';

const PROVIDER_LABELS = {
  linkedin: 'LinkedIn',
};

const ROLE_OPTIONS = [
  {
    value: 'freelancer',
    title: 'Freelancer',
    description: 'Showcase your craft, pitch new clients, and access project-ready workspaces.',
    badge: 'Solo talent',
  },
  {
    value: 'agency',
    title: 'Agency',
    description: 'Coordinate teams, manage retainers, and collaborate on large-scale briefs.',
    badge: 'Collective',
  },
  {
    value: 'company',
    title: 'Company',
    description: 'Hire premium talent, manage vendor pipelines, and monitor onboarding.',
    badge: 'Hiring team',
  },
  {
    value: 'mentor',
    title: 'Mentor',
    description: 'Guide rising professionals, host sessions, and share playbooks with the community.',
    badge: 'Advisor',
  },
];

const DEFAULT_MEMBERSHIP = 'user';
const MINIMUM_SIGNUP_AGE = 13;
const SIGNUP_CHANNEL = 'web_app';
const PASSWORD_STRENGTH_LABELS = ['Needs improvement', 'Getting there', 'Strong', 'Elite'];
const onboardingHighlights = [
  'Curate persona-based dashboards with guided onboarding journeys.',
  'Unlock tailored feeds across jobs, gigs, projects, and volunteering with analytics overlays.',
  'Secure your workspace with two-factor defaults and compliance-ready templates.',
];

const ROLE_HIGHLIGHTS = {
  [DEFAULT_MEMBERSHIP]: 'Universal feed, saved searches, and cross-network notifications to keep you in sync.',
  freelancer: 'Proposal workspace, AI-powered brief summaries, and invoice-ready templates.',
  agency: 'Shared pipelines, deal health analytics, and team permissions tuned for agencies.',
  company: 'Hiring dashboards, vendor governance, and compliance controls in one hub.',
  mentor: 'Session scheduling, resource sharing, and mentee progress tracking tools.',
};

function calculateAge(dateString) {
  if (!dateString) {
    return null;
  }
  const candidate = new Date(dateString);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - candidate.getFullYear();
  const monthDifference = today.getMonth() - candidate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < candidate.getDate())) {
    age -= 1;
  }
  return age;
}

function resolveMarketingOptInAt(optedIn, providedTimestamp) {
  if (!optedIn) {
    return null;
  }
  if (providedTimestamp) {
    const parsed = new Date(providedTimestamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
}

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: '',
};

export default function SignUpForm({ className, showHighlightsPanel = true }) {
  const [form, setForm] = useState(initialState);
  const {
    status,
    setStatus,
    setError,
    setInfo,
    setSuccess,
    clearMessage,
    message,
    messageType,
    feedbackProps,
  } = useFormState();
  const navigate = useNavigate();
  const { login } = useSession();
  const [roleSelections, setRoleSelections] = useState(() => new Set());
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [communicationsOptIn, setCommunicationsOptIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [prefillNotice, setPrefillNotice] = useState(null);
  const [prefillApplied, setPrefillApplied] = useState(false);

  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const maxBirthDate = new Date().toISOString().split('T')[0];
  const derivedAge = useMemo(() => calculateAge(form.dateOfBirth), [form.dateOfBirth]);

  const passwordInsights = useMemo(() => validatePasswordStrength(form.password), [form.password]);
  const passwordRules = useMemo(() => {
    const value = typeof form.password === 'string' ? form.password.trim() : '';
    return PASSWORD_STRENGTH_REQUIREMENTS.map((rule) => ({
      id: rule.id,
      label: rule.shortLabel,
      met: rule.test(value),
    }));
  }, [form.password]);
  const passwordPolicySummary = useMemo(() => describePasswordPolicy(), []);
  const passwordScore = useMemo(() => passwordRules.filter((rule) => rule.met).length, [passwordRules]);
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

  const selectedRoles = useMemo(() => Array.from(roleSelections), [roleSelections]);
  const membershipPayload = useMemo(() => {
    if (!selectedRoles.length) {
      return [DEFAULT_MEMBERSHIP];
    }
    return Array.from(new Set([...selectedRoles, DEFAULT_MEMBERSHIP]));
  }, [selectedRoles]);
  const personaHighlights = useMemo(() => {
    const keys = membershipPayload;
    return keys
      .map((key) => {
        const highlight = ROLE_HIGHLIGHTS[key];
        if (!highlight) {
          return null;
        }
        return { key, text: highlight };
      })
      .filter(Boolean);
  }, [membershipPayload]);

  const disableSubmit = status !== 'idle' || !acceptTerms;

  useEffect(() => {
    if (prefillApplied || typeof window === 'undefined') {
      return undefined;
    }

    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) {
      setPrefillApplied(true);
      return undefined;
    }

    setForm((previous) => ({
      ...previous,
      firstName: params.get('firstName')?.trim() || params.get('given_name')?.trim() || previous.firstName,
      lastName: params.get('lastName')?.trim() || params.get('family_name')?.trim() || previous.lastName,
      email: params.get('email')?.trim() || previous.email,
      dateOfBirth: params.get('dob')?.trim() || params.get('dateOfBirth')?.trim() || previous.dateOfBirth,
    }));

    const marketingParam = params.get('marketing');
    if (marketingParam !== null) {
      setCommunicationsOptIn(!['false', '0', 'no'].includes(marketingParam.toLowerCase()));
    }

    const personaParams = params.getAll('persona').length
      ? params.getAll('persona')
      : params.getAll('role');
    if (personaParams.length) {
      setRoleSelections(() => {
        const valid = personaParams.filter((value) => ROLE_OPTIONS.some((option) => option.value === value));
        return new Set(valid);
      });
    }

    if (params.get('acceptedTerms') === 'true') {
      setAcceptTerms(true);
    }

    setPrefillNotice({
      title: 'Invite details applied',
      description:
        'We loaded the essentials from your invite so you can confirm, enhance, and launch your workspace without retyping.',
      personaHint: personaParams.length
        ? 'Persona picks are already waiting for you. Adjust them below to tailor your dashboards.'
        : null,
    });
    setInfo('We preloaded details from your invite to accelerate setup.');
    setPrefillApplied(true);

    return undefined;
  }, [prefillApplied, setInfo]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (value) => {
    setRoleSelections((previous) => {
      const next = new Set(previous);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleTermsChange = (event) => {
    setAcceptTerms(event.target.checked);
  };

  const handleCommunicationsChange = (event) => {
    setCommunicationsOptIn(event.target.checked);
  };

  const roleTitleMap = useMemo(() => {
    const map = new Map([[DEFAULT_MEMBERSHIP, 'Community member']]);
    ROLE_OPTIONS.forEach((option) => {
      map.set(option.value, option.title);
    });
    return map;
  }, []);

  const completionMeta = useMemo(() => {
    const sections = [
      {
        id: 'profile',
        label: 'Profile basics',
        complete:
          Boolean(form.firstName && form.lastName) && isValidEmail(form.email),
      },
      {
        id: 'security',
        label: 'Security baseline',
        complete:
          Boolean(form.password && form.confirmPassword) &&
          form.password === form.confirmPassword &&
          passwordInsights.valid,
      },
      {
        id: 'compliance',
        label: 'Age & compliance',
        complete: Number.isFinite(derivedAge) && derivedAge >= MINIMUM_SIGNUP_AGE && acceptTerms,
      },
      {
        id: 'persona',
        label: 'Persona journeys',
        complete: selectedRoles.length > 0,
      },
      {
        id: 'communications',
        label: 'Communication prefs',
        complete: communicationsOptIn !== null,
      },
    ];

    const completeCount = sections.filter((section) => section.complete).length;
    const percent = Math.round((completeCount / sections.length) * 100);

    return { sections, completeCount, percent };
  }, [
    acceptTerms,
    communicationsOptIn,
    derivedAge,
    form.confirmPassword,
    form.email,
    form.firstName,
    form.lastName,
    form.password,
    passwordInsights.valid,
    selectedRoles.length,
  ]);

  const completionTone = completionMeta.percent >= 80 ? 'bg-emerald-500' : completionMeta.percent >= 50 ? 'bg-amber-500' : 'bg-rose-500';

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
    const derivedAgeValue = derivedAge;
    if (!Number.isFinite(derivedAgeValue)) {
      setError('Enter a valid date of birth to continue.');
      return;
    }
    if (derivedAgeValue < MINIMUM_SIGNUP_AGE) {
      setError(`You must be at least ${MINIMUM_SIGNUP_AGE} years old to create an account.`);
      return;
    }
    if (!passwordInsights.valid) {
      setError(`Choose a stronger password. ${passwordInsights.recommendations.join(' ')}`);
      return;
    }
    if (!acceptTerms) {
      setError('Please agree to the terms and privacy notice to continue.');
      return;
    }
    setStatus('submitting');
    clearMessage();
    try {
      const normalizedEmail = normaliseEmail(form.email);
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: normalizedEmail,
        password: form.password,
        age: derivedAgeValue,
        twoFactorEnabled: true,
        twoFactorMethod: 'email',
        preferredRoles: selectedRoles,
        memberships: membershipPayload,
        marketingOptIn: communicationsOptIn,
        marketingOptInAt: resolveMarketingOptInAt(communicationsOptIn),
        signupChannel: SIGNUP_CHANNEL,
        dateOfBirth: form.dateOfBirth,
      };
      await registerUser(payload);
      saveRememberedLogin(normalizedEmail);
      setSuccess('Registration complete. You can now sign in and add any additional roles you need.');
      setForm(initialState);
      setRoleSelections(new Set());
      setAcceptTerms(false);
      setCommunicationsOptIn(true);
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
    const providerLabel = PROVIDER_LABELS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
    setInfo(`Redirecting to ${providerLabel} to continue.`);
    setStatus('redirecting');
    const url = redirectToSocialAuth(provider, 'register');
    if (!url) {
      setStatus('idle');
      setError('Social sign up is not available right now. Please try another option.');
    }
  };

  return (
    <div className={`grid gap-10 lg:grid-cols-[1.25fr,0.75fr] lg:items-start ${className ?? ''}`}>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
        <div className="rounded-2xl bg-surfaceMuted/60 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Create your Gigvora identity</p>
          <p className="mt-1">
            Every profile unlocks premium dashboards, guided onboarding, and security defaults that keep you on par with the
            world-class communities we benchmark against.
          </p>
        </div>
        <FormStatusMessage type={messageType ?? 'info'} message={message} {...feedbackProps} />
        {prefillNotice ? (
          <div className="rounded-3xl border border-accent/20 bg-accent/5 p-6">
            <p className="text-sm font-semibold text-slate-900">{prefillNotice.title}</p>
            <p className="mt-1 text-xs text-slate-600">{prefillNotice.description}</p>
            {prefillNotice.personaHint ? (
              <p className="mt-3 text-xs font-semibold text-accent">{prefillNotice.personaHint}</p>
            ) : null}
          </div>
        ) : null}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            <span>Setup progress</span>
            <span className="text-slate-900">{completionMeta.percent}% ready</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white" aria-hidden="true">
            <div className={`h-2 rounded-full transition-all duration-300 ${completionTone}`} style={{ width: `${Math.max(completionMeta.percent, 8)}%` }} />
          </div>
          <ul className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            {completionMeta.sections.map((section) => (
              <li key={section.id} className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    section.complete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                  }`}
                  aria-hidden="true"
                >
                  {section.complete ? '✓' : '•'}
                </span>
                <span>{section.label}</span>
              </li>
            ))}
          </ul>
        </div>
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
            <div className="flex items-center justify-between">
              <label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700">
                Date of birth
              </label>
              <span className="text-xs font-semibold text-slate-400">13+ required</span>
            </div>
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
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-24 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
                minLength={12}
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {passwordPolicySummary ? <p className="text-xs text-slate-500">{passwordPolicySummary}</p> : null}
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
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-24 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
                minLength={12}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((previous) => !previous)}
                className="absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-pressed={showConfirmPassword}
                aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{passwordStrengthMeta.label}</span>
              <span>{passwordStrengthPercent}% secure</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200" aria-hidden="true">
              <div className={`h-2 rounded-full transition-all duration-300 ${passwordStrengthMeta.barClass}`} style={{ width: `${passwordStrengthWidth}%` }} />
            </div>
            <ul className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              {passwordRules.map((rule) => (
                <li key={rule.id} className={`flex items-center gap-2 ${rule.met ? 'text-emerald-600' : ''}`}>
                  <span className={`inline-flex h-2.5 w-2.5 rounded-full ${rule.met ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-hidden="true" />
                  <span>{rule.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Choose the journeys you need on day one</h3>
              <p className="text-xs text-slate-500">Select the experiences that match how you plan to use Gigvora. Add more anytime.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {selectedRoles.length ? `${selectedRoles.length} selected` : 'Optional'}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLE_OPTIONS.map((option) => {
              const selected = roleSelections.has(option.value);
              return (
                <label
                  key={option.value}
                  className={`group flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition ${selected ? 'border-accent bg-white shadow-soft' : 'border-slate-200 bg-white/70 hover:border-accent/50 hover:shadow-sm'}`}
                >
                  <input type="checkbox" className="sr-only" checked={selected} onChange={() => handleRoleToggle(option.value)} />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900">{option.title}</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${selected ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-500'}`}>
                      {option.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{option.description}</p>
                  <span className={`text-xs font-semibold ${selected ? 'text-accent' : 'text-slate-400'}`}>
                    {selected ? 'Included at launch' : 'Tap to include'}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">We&apos;ll preload dashboards for the personas you select and surface curated onboarding tasks.</p>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <label className="flex items-start gap-3 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={handleTermsChange}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
              required
            />
            <span>
              I agree to the{' '}
              <a href="/terms" className="font-semibold text-accent hover:text-accentDark">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="font-semibold text-accent hover:text-accentDark">
                Privacy Notice
              </a>{' '}
              and confirm I’m creating this account for professional use.
            </span>
          </label>
          <label className="flex items-start gap-3 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={communicationsOptIn}
              onChange={handleCommunicationsChange}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
            />
            <span>Keep me updated with onboarding tips, curated opportunities, and mentor spotlights.</span>
          </label>
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-accent px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
          disabled={disableSubmit}
        >
          {status === 'submitting' ? 'Creating your profile…' : 'Create profile'}
        </button>
        {!acceptTerms ? (
          <p className="text-center text-[11px] font-semibold text-rose-500">Agree to the terms to enable profile creation.</p>
        ) : null}
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
                intent="register"
                loading={status !== 'idle'}
                disabled={status !== 'idle'}
                label={`Sign up with ${PROVIDER_LABELS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1)}`}
                onClick={() => handleSocialRedirect(provider)}
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
                <button type="button" disabled className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-400">
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
      {showHighlightsPanel ? (
        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">What you unlock</h2>
            <div className="flex flex-wrap gap-2">
              {membershipPayload.map((key) => (
                <span key={key} className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {roleTitleMap.get(key)}
                </span>
              ))}
            </div>
          </div>
          <ul className="space-y-4 text-sm text-slate-600">
            {personaHighlights.map((item) => (
              <li key={item.key} className="flex gap-3">
                <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                <span>{item.text}</span>
              </li>
            ))}
            {onboardingHighlights.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent/60" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-surfaceMuted p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Create once, shine everywhere.</p>
            <p>
              Your Gigvora identity syncs across web, mobile, and admin hubs so you can pitch, mentor, hire, and collaborate
              without friction.
            </p>
            <p className="text-xs text-slate-500">
              Two-factor authentication is enabled by default, and we verify every new session with device fingerprinting to protect your teams.
            </p>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

SignUpForm.propTypes = {
  className: PropTypes.string,
  showHighlightsPanel: PropTypes.bool,
};
