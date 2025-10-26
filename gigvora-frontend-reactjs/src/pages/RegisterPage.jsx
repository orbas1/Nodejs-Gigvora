import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import PageHeader from '../components/PageHeader.jsx';
import { registerUser, loginWithGoogle } from '../services/auth.js';
import apiClient from '../services/apiClient.js';
import useSession from '../hooks/useSession.js';
import SocialAuthButton, { SOCIAL_PROVIDERS } from '../components/SocialAuthButton.jsx';
import useFormState from '../hooks/useFormState.js';
import FormStatusMessage from '../components/forms/FormStatusMessage.jsx';
import PersonaSelection from '../components/onboarding/PersonaSelection.jsx';
import ProfileBasicsForm from '../components/onboarding/ProfileBasicsForm.jsx';
import WorkspacePrimerCarousel from '../components/onboarding/WorkspacePrimerCarousel.jsx';
import { isValidEmail, validatePasswordStrength } from '../utils/validation.js';
import { normaliseEmail, saveRememberedLogin, redirectToSocialAuth } from '../utils/authHelpers.js';

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
  linkedin: 'LinkedIn',
};

const ROLE_OPTIONS = [
  {
    value: 'freelancer',
    title: 'Freelancer',
    description: 'Showcase your craft, pitch new clients, and access project-ready workspaces.',
    badge: 'Solo talent',
    icon: '✦',
    insights: ['AI bid summaries & proposal templates', 'Invoice-ready workspace with ledger syncing'],
    accentClass: 'from-emerald-500 to-teal-500',
    selectedAccentClass: 'from-emerald-500 to-teal-500',
    badgeClass: 'bg-slate-100 text-slate-500',
    selectedBadgeClass: 'bg-emerald-100 text-emerald-600',
    runtimeEstimate: '5 min setup',
  },
  {
    value: 'agency',
    title: 'Agency',
    description: 'Coordinate teams, manage retainers, and collaborate on large-scale briefs.',
    badge: 'Collective',
    icon: '◎',
    insights: ['Shared pipelines & deal health analytics', 'Role-aware permissions for collaborators'],
    accentClass: 'from-purple-500 to-indigo-500',
    selectedAccentClass: 'from-purple-500 to-indigo-500',
    badgeClass: 'bg-slate-100 text-slate-500',
    selectedBadgeClass: 'bg-indigo-100 text-indigo-600',
    runtimeEstimate: '7 min setup',
  },
  {
    value: 'company',
    title: 'Company',
    description: 'Hire premium talent, manage vendor pipelines, and monitor onboarding.',
    badge: 'Hiring team',
    icon: '▣',
    insights: ['Hiring dashboards & vendor governance', 'Compliance and onboarding checklists baked in'],
    accentClass: 'from-blue-500 to-sky-500',
    selectedAccentClass: 'from-blue-500 to-sky-500',
    badgeClass: 'bg-slate-100 text-slate-500',
    selectedBadgeClass: 'bg-sky-100 text-sky-600',
    runtimeEstimate: '6 min setup',
  },
  {
    value: 'mentor',
    title: 'Mentor',
    description: 'Guide rising professionals, host sessions, and share playbooks with the community.',
    badge: 'Advisor',
    icon: '✺',
    insights: ['Session scheduling & resource sharing', 'Progress tracking with mentee insights'],
    accentClass: 'from-rose-500 to-amber-500',
    selectedAccentClass: 'from-rose-500 to-amber-500',
    badgeClass: 'bg-slate-100 text-slate-500',
    selectedBadgeClass: 'bg-rose-100 text-rose-600',
    runtimeEstimate: '4 min setup',
  },
];

const DEFAULT_MEMBERSHIP = 'user';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: '',
};

const onboardingHighlights = [
  {
    id: 'dashboards',
    title: 'Launch-ready dashboards',
    description: 'Curate persona-based dashboards with guided onboarding journeys for every role you enable.',
    metrics: ['Persona briefings', 'Checklist automation', 'AI tour overlays'],
    icon: '📊',
    accent: 'from-amber-500 to-rose-500',
    footer: 'We preload analytics tiles, tasks, and success metrics as soon as you complete sign-up.',
  },
  {
    id: 'discovery',
    title: 'Tailored discovery rails',
    description: 'Unlock feeds across jobs, gigs, projects, and volunteering with analytics overlays tuned to your goals.',
    metrics: ['Saved searches', 'Persona signals', 'Cross-network alerts'],
    icon: '🌐',
    accent: 'from-teal-500 to-cyan-500',
    footer: 'Recommendations refresh instantly based on personas and preferences you confirm.',
  },
  {
    id: 'security',
    title: 'Enterprise-grade security',
    description: 'Secure your workspace with two-factor defaults, compliance-ready templates, and device fingerprinting.',
    metrics: ['2FA auto-enrolment', 'Session trust scoring', 'Audit-ready playbooks'],
    icon: '🛡️',
    accent: 'from-slate-800 to-slate-600',
    footer: 'Security guardrails stay on from day one so your data and teams remain protected.',
  },
];

const ROLE_HIGHLIGHTS = {
  [DEFAULT_MEMBERSHIP]: 'Universal feed, saved searches, and cross-network notifications to keep you in sync.',
  freelancer: 'Proposal workspace with AI summaries, invoice-ready ledgers, and reputation insights per pitch.',
  agency: 'Shared pipelines, deal health analytics, client governance, and collaborative permissions for every engagement.',
  company: 'Hiring dashboards, vendor governance, onboarding automations, and compliance controls in one hub.',
  mentor: 'Session scheduling, resource sharing, mentee progress tracking, and automated follow-up reminders.',
};

export default function RegisterPage() {
  const [form, setForm] = useState(initialState);
  const { status, setStatus, setError, setInfo, setSuccess, clearMessage, message, messageType, feedbackProps } = useFormState();
  const navigate = useNavigate();
  const { login } = useSession();
  const [roleSelections, setRoleSelections] = useState(() => new Set());
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [communicationsOptIn, setCommunicationsOptIn] = useState(true);

  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const maxBirthDate = new Date().toISOString().split('T')[0];

  const selectedRoles = useMemo(() => Array.from(roleSelections), [roleSelections]);
  const membershipPayload = useMemo(() => {
    if (!selectedRoles.length) {
      return [DEFAULT_MEMBERSHIP];
    }
    return Array.from(new Set([...selectedRoles, DEFAULT_MEMBERSHIP]));
  }, [selectedRoles]);

  const roleTitleMap = useMemo(() => {
    const map = new Map([[DEFAULT_MEMBERSHIP, 'Community member']]);
    ROLE_OPTIONS.forEach((option) => {
      map.set(option.value, option.title);
    });
    return map;
  }, []);

  const personaHighlights = useMemo(() => {
    const optionMap = new Map(ROLE_OPTIONS.map((option) => [option.value, option]));
    return membershipPayload
      .map((key) => {
        const highlight = ROLE_HIGHLIGHTS[key];
        if (!highlight) {
          return null;
        }
        if (key === DEFAULT_MEMBERSHIP) {
          return {
            key,
            title: roleTitleMap.get(key) ?? 'Community member',
            description: highlight,
            accent: 'from-slate-500 to-slate-700',
            metrics: ['Universal feed access', 'Saved searches sync', 'Cross-network notifications'],
          };
        }
        const option = optionMap.get(key);
        if (!option) {
          return null;
        }
        return {
          key,
          title: option.title,
          description: highlight,
          accent: option.selectedAccentClass,
          metrics: option.insights,
        };
      })
      .filter(Boolean);
  }, [membershipPayload, roleTitleMap]);

  const membershipSummary = useMemo(() => {
    const labels = membershipPayload
      .map((key) => roleTitleMap.get(key))
      .filter(Boolean);
    if (!labels.length) {
      return 'Tailored for you';
    }
    return labels.join(' • ');
  }, [membershipPayload, roleTitleMap]);

  const primaryDashboard = useMemo(() => {
    if (selectedRoles.length) {
      const prioritized = selectedRoles.find((role) => role !== DEFAULT_MEMBERSHIP);
      return prioritized ?? selectedRoles[0];
    }
    const fallback = membershipPayload.find((role) => role !== DEFAULT_MEMBERSHIP);
    return fallback ?? DEFAULT_MEMBERSHIP;
  }, [membershipPayload, selectedRoles]);

  const disableSubmit = status !== 'idle' || !acceptTerms;

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

  const handleBasicsFieldChange = (field, nextValue) => {
    setForm((prev) => ({ ...prev, [field]: nextValue }));
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
    const passwordInsights = validatePasswordStrength(form.password);
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
        dateOfBirth: form.dateOfBirth,
        password: form.password,
        twoFactorEnabled: false,
        preferredRoles: selectedRoles,
        memberships: membershipPayload,
        primaryDashboard,
        marketingOptIn: communicationsOptIn,
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
            <ProfileBasicsForm
              value={form}
              onFieldChange={handleBasicsFieldChange}
              maxBirthDate={maxBirthDate}
            />
            <PersonaSelection
              options={ROLE_OPTIONS}
              selectedValues={roleSelections}
              onToggle={handleRoleToggle}
              title="Choose the journeys you need on day one"
              subtitle="Select the experiences that match how you plan to use Gigvora. Add more anytime."
              helperText="We\u2019ll preload dashboards for the personas you select and surface curated onboarding tasks."
            />
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
              <p className="text-center text-[11px] font-semibold text-rose-500">
                Agree to the terms to enable profile creation.
              </p>
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
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">Your persona mix</h2>
              <div className="flex flex-wrap gap-2">
                {membershipPayload.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                  >
                    {roleTitleMap.get(key)}
                  </span>
                ))}
              </div>
            </div>
            <WorkspacePrimerCarousel
              personaHighlights={personaHighlights}
              onboardingHighlights={onboardingHighlights}
              membershipSummary={membershipSummary}
            />
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-surfaceMuted p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Create once, shine everywhere.</p>
              <p>
                Your Gigvora identity syncs across web, mobile, and admin hubs so you can pitch, mentor, hire, and collaborate without friction.
              </p>
              <p className="text-xs text-slate-500">
                Two-factor authentication is enabled by default, and we verify every new session with device fingerprinting to protect your teams.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
