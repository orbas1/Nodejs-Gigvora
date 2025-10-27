import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import PersonaSelection, { personaShape, DEFAULT_PERSONAS_FOR_SELECTION } from './PersonaSelection.jsx';
import ProfileBasicsForm from './ProfileBasicsForm.jsx';
import WorkspacePrimerCarousel from './WorkspacePrimerCarousel.jsx';
import { listOnboardingPersonas, createOnboardingJourney } from '../../../services/onboarding.js';

const STEP_SEQUENCE = [
  { id: 'persona', title: 'Persona', caption: 'Pick the journey that reflects your current goals.' },
  {
    id: 'profile',
    title: 'Profile & goals',
    caption: 'Tell us about your brand voice, milestones, and success measures.',
  },
  { id: 'team', title: 'Team', caption: 'Invite collaborators who will help run this workspace.' },
  { id: 'preferences', title: 'Preferences', caption: 'Tune insights, digests, and storytelling cadence.' },
  { id: 'summary', title: 'Review', caption: 'Confirm launch plan and next milestones.' },
];

const DEFAULT_PROFILE = {
  companyName: '',
  role: '',
  timezone: '',
  headline: '',
  northStar: '',
};

const DEFAULT_PREFERENCES = {
  updates: true,
  digestCadence: 'weekly',
  focusSignals: ['Hiring velocity', 'Community engagement'],
  storyThemes: ['Culture', 'Product launches'],
  enableAiDrafts: true,
};

const DEFAULT_INVITES = [{ email: '', role: 'Collaborator' }];

export default function OnboardingWizard({
  personas = DEFAULT_PERSONAS_FOR_SELECTION,
  analytics,
  onComplete,
  initialPersonaId,
  defaultProfile = DEFAULT_PROFILE,
  defaultPreferences = DEFAULT_PREFERENCES,
  defaultInvites = DEFAULT_INVITES,
  onExit,
}) {
  const hasExternalPersonas = Array.isArray(personas) && personas.length && personas !== DEFAULT_PERSONAS_FOR_SELECTION;
  const [personaOptions, setPersonaOptions] = useState(() => {
    if (hasExternalPersonas) {
      return personas;
    }
    return DEFAULT_PERSONAS_FOR_SELECTION;
  });
  const [personasLoading, setPersonasLoading] = useState(false);
  const [personaLoadError, setPersonaLoadError] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedPersonaId, setSelectedPersonaId] = useState(() => {
    if (initialPersonaId) {
      const source = hasExternalPersonas ? personas : DEFAULT_PERSONAS_FOR_SELECTION;
      if (source.some((persona) => persona.id === initialPersonaId)) {
        return initialPersonaId;
      }
    }
    return null;
  });
  const [profile, setProfile] = useState(defaultProfile);
  const [invites, setInvites] = useState(defaultInvites);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState(null);
  const [attemptedSteps, setAttemptedSteps] = useState({});

  useEffect(() => {
    if (hasExternalPersonas) {
      setPersonaOptions(personas);
      setPersonasLoading(false);
      setPersonaLoadError(null);
      return;
    }

    let isActive = true;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;

    setPersonasLoading(true);
    setPersonaLoadError(null);

    listOnboardingPersonas({ signal: controller?.signal })
      .then((fetched) => {
        if (!isActive) {
          return;
        }
        if (Array.isArray(fetched) && fetched.length) {
          setPersonaOptions(fetched);
        } else {
          setPersonaOptions(DEFAULT_PERSONAS_FOR_SELECTION);
        }
      })
      .catch((loadError) => {
        if (!isActive || loadError?.name === 'AbortError') {
          return;
        }
        setPersonaLoadError(loadError?.message || 'We could not load personas right now.');
        setPersonaOptions((current) => (Array.isArray(current) && current.length ? current : DEFAULT_PERSONAS_FOR_SELECTION));
      })
      .finally(() => {
        if (isActive) {
          setPersonasLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller?.abort();
    };
  }, [hasExternalPersonas, personas]);

  useEffect(() => {
    if (initialPersonaId && personaOptions.some((persona) => persona.id === initialPersonaId)) {
      setSelectedPersonaId((current) => current ?? initialPersonaId);
      setCurrentStepIndex((index) => (index === 0 ? 1 : index));
    }
  }, [initialPersonaId, personaOptions]);

  useEffect(() => {
    if (selectedPersonaId && !personaOptions.some((persona) => persona.id === selectedPersonaId)) {
      setSelectedPersonaId(null);
      setCurrentStepIndex(0);
    }
  }, [personaOptions, selectedPersonaId]);

  const currentStep = STEP_SEQUENCE[currentStepIndex];
  const selectedPersona = useMemo(
    () => personaOptions.find((persona) => persona.id === selectedPersonaId),
    [personaOptions, selectedPersonaId],
  );
  const progress = useMemo(
    () => Math.round(((currentStepIndex + 1) / STEP_SEQUENCE.length) * 100),
    [currentStepIndex],
  );

  useEffect(() => {
    if (!currentStep) {
      return;
    }
    analytics?.track?.('web_onboarding_step_viewed', {
      stepId: currentStep.id,
      stepTitle: currentStep.title,
      hasPersona: Boolean(selectedPersonaId),
    });
  }, [analytics, currentStep, selectedPersonaId]);

  const personaInsights = useMemo(() => {
    if (!selectedPersona) {
      return [];
    }
    const modules = selectedPersona.recommendedModules ?? [];
    return [
      {
        label: 'Signature wins',
        value: selectedPersona.benefits.slice(0, 2),
      },
      {
        label: 'Recommended modules',
        value: modules.length ? modules : ['Workspace customization', 'Insights dashboard'],
      },
      {
        label: 'North-star metrics',
        value: (selectedPersona.metrics ?? []).map((metric) => `${metric.label}: ${metric.value}`),
      },
    ];
  }, [selectedPersona]);

  const validInviteCount = useMemo(
    () => invites.filter((invite) => invite.email && invite.email.trim()).length,
    [invites],
  );

  const focusSignals = useMemo(
    () => (Array.isArray(preferences.focusSignals) ? preferences.focusSignals.filter((signal) => signal?.trim()) : []),
    [preferences.focusSignals],
  );

  const workspacePrimerSlides = useMemo(() => {
    const personaTitle = selectedPersona?.title ?? 'Workspace';
    const modules = Array.isArray(selectedPersona?.recommendedModules)
      ? selectedPersona.recommendedModules
      : ['Insights dashboard', 'Launch checklist', 'Storytelling studio'];
    const metrics = Array.isArray(selectedPersona?.metrics)
      ? selectedPersona.metrics.slice(0, 3).map((metric) => ({
          label: metric.label,
          value: metric.value,
        }))
      : [];
    const trimmedNorthStar = profile.northStar?.trim();

    return [
      {
        id: 'launch-readiness',
        eyebrow: 'Launch plan',
        title: `Launch your ${personaTitle.toLowerCase()} workspace`,
        description:
          'We tailor automations, copy, and analytics so your flagship workspace feels ready for LinkedIn, Instagram, and Facebook audiences from day one.',
        highlights: [
          modules.length
            ? `Signature modules: ${modules.slice(0, 3).join(', ')}`
            : 'Signature modules unlock once you select a persona.',
          trimmedNorthStar
            ? `North-star focus: ${trimmedNorthStar}`
            : 'Add a north-star outcome to calibrate analytics and prompts.',
        ],
        metrics:
          metrics.length > 0
            ? metrics
            : [
                { label: 'Launch readiness', value: 'Under 5 minutes' },
                { label: 'Guided playbooks', value: '12+ automations' },
              ],
      },
      {
        id: 'collaboration-momentum',
        eyebrow: 'Collaboration',
        title: 'Bring collaborators into the story',
        description:
          'Invite marketing, recruiting, and leadership partners to co-create updates, approvals, and insights in one shared workspace.',
        highlights: [
          `Invites prepared: ${validInviteCount}`,
          'Roles covered: Collaborator, Approver, Executive',
          'Automated nudges keep everyone aligned once you launch.',
        ],
        metrics: [
          { label: 'Realtime invites', value: validInviteCount },
          { label: 'Approval workflows', value: 'Included' },
        ],
      },
      {
        id: 'signal-intelligence',
        eyebrow: 'Signals',
        title: 'Stay ahead with personalised signals',
        description:
          'Digest cadence, focus signals, and AI drafting options align your rituals with the outcomes you care about.',
        highlights: [
          `Digest cadence: ${preferences.digestCadence ?? 'weekly'}`,
          focusSignals.length
            ? `Focus signals: ${focusSignals.join(', ')}`
            : 'Select focus signals to tailor analytics to your priorities.',
          preferences.enableAiDrafts
            ? 'AI drafts enabled — we pre-seed stories based on your highlights.'
            : 'Enable AI drafts to accelerate storytelling and reviews.',
        ],
        metrics: [
          { label: 'Signal themes', value: focusSignals.length },
          { label: 'AI assistance', value: preferences.enableAiDrafts ? 'Enabled' : 'Off' },
        ],
      },
    ];
  }, [focusSignals, preferences.digestCadence, preferences.enableAiDrafts, profile.northStar, selectedPersona?.metrics, selectedPersona?.recommendedModules, selectedPersona?.title, validInviteCount]);

  const isProfileComplete = useMemo(
    () => Boolean(profile.companyName.trim() && profile.role.trim() && profile.timezone.trim()),
    [profile.companyName, profile.role, profile.timezone],
  );

  useEffect(() => {
    if (attemptedSteps.profile && isProfileComplete) {
      setAttemptedSteps((current) => ({ ...current, profile: false }));
    }
  }, [attemptedSteps.profile, isProfileComplete]);

  const reviewSummary = useMemo(() => {
    return {
      persona: selectedPersona,
      profile,
      invites: invites.filter((invite) => invite.email.trim()),
      preferences,
      modules: selectedPersona?.recommendedModules ?? [],
    };
  }, [invites, preferences, profile, selectedPersona]);

  const canProceed = useMemo(() => {
    if (!currentStep) {
      return false;
    }
    if (currentStep.id === 'persona') {
      return Boolean(selectedPersonaId) && !personasLoading;
    }
    if (currentStep.id === 'profile') {
      return isProfileComplete;
    }
    if (currentStep.id === 'team') {
      return invites.some((invite) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invite.email.trim()));
    }
    if (currentStep.id === 'preferences') {
      return Boolean(preferences.digestCadence);
    }
    return true;
  }, [currentStep, invites, isProfileComplete, personasLoading, preferences.digestCadence, selectedPersonaId]);

  const handleNext = () => {
    if (!canProceed) {
      setAttemptedSteps((current) => ({ ...current, [currentStep.id]: true }));
      return;
    }
    setAttemptedSteps((current) => ({ ...current, [currentStep.id]: false }));
    setCurrentStepIndex((index) => Math.min(index + 1, STEP_SEQUENCE.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  };

  const handlePersonaChange = (personaId, persona) => {
    setSelectedPersonaId(personaId);
    analytics?.track?.('web_onboarding_persona_selected', {
      personaId,
      title: persona?.title,
    });
    if (personaId) {
      setAttemptedSteps((current) => ({ ...current, persona: false }));
    }
    if (currentStep.id === 'persona' && personaId) {
      setCurrentStepIndex(1);
    }
  };

  const handleProfileChange = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handleInviteChange = (index, patch) => {
    setInvites((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addInviteRow = () => {
    setInvites((current) => [...current, { email: '', role: 'Collaborator' }]);
  };

  const removeInviteRow = (index) => {
    setInvites((current) => current.filter((_, idx) => idx !== index));
  };

  const togglePreference = (key) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const updateStoryThemes = (theme) => {
    setPreferences((current) => {
      const themes = new Set(current.storyThemes);
      if (themes.has(theme)) {
        themes.delete(theme);
      } else {
        themes.add(theme);
      }
      return { ...current, storyThemes: Array.from(themes) };
    });
  };

  const handleDigestCadenceChange = (event) => {
    setPreferences((current) => ({ ...current, digestCadence: event.target.value }));
  };

  const handleFocusSignalToggle = (signal) => {
    setPreferences((current) => {
      const signals = new Set(current.focusSignals);
      if (signals.has(signal)) {
        signals.delete(signal);
      } else {
        signals.add(signal);
      }
      return { ...current, focusSignals: Array.from(signals) };
    });
  };

  const handleLaunch = async () => {
    if (!canProceed) {
      return;
    }
    setLaunching(true);
    setError(null);
    try {
      const payload = {
        persona: selectedPersona,
        profile: {
          ...profile,
          companyName: profile.companyName.trim(),
          role: profile.role.trim(),
          timezone: profile.timezone.trim(),
          headline: profile.headline.trim() || undefined,
          northStar: profile.northStar.trim() || undefined,
        },
        invites: invites
          .filter((invite) => invite.email.trim())
          .map((invite) => ({
            email: invite.email.trim().toLowerCase(),
            role: invite.role,
          })),
        preferences: {
          ...preferences,
          storyThemes: preferences.storyThemes.map((theme) => theme.trim()).filter(Boolean),
          focusSignals: preferences.focusSignals.map((signal) => signal.trim()).filter(Boolean),
        },
      };

      const journey = await createOnboardingJourney({
        personaKey: selectedPersona?.id ?? selectedPersonaId,
        profile: payload.profile,
        invites: payload.invites,
        preferences: {
          updates: payload.preferences.updates,
          digestCadence: payload.preferences.digestCadence,
          focusSignals: payload.preferences.focusSignals,
          storyThemes: payload.preferences.storyThemes,
          enableAiDrafts: payload.preferences.enableAiDrafts,
        },
      });

      analytics?.track?.('web_onboarding_completed', {
        personaId: payload.persona?.id ?? selectedPersonaId,
        inviteCount: payload.invites.length,
        digestCadence: payload.preferences.digestCadence,
        hasAiDrafts: payload.preferences.enableAiDrafts,
        journeyId: journey?.id,
      });

      onComplete?.({ ...payload, journey });
      setCurrentStepIndex(STEP_SEQUENCE.length - 1);
    } catch (launchError) {
      const fallbackMessage = 'We could not launch your workspace right now.';
      const message = launchError?.body?.message ?? launchError?.message ?? fallbackMessage;
      setError(message);
    } finally {
      setLaunching(false);
    }
  };

  const renderPersonaStep = () => {
    return (
      <div className="space-y-4">
        {personaLoadError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {personaLoadError}
          </div>
        )}
        <PersonaSelection
          personas={personaOptions}
          value={selectedPersonaId}
          onChange={handlePersonaChange}
          disabled={launching || personasLoading}
        />
        {personasLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
            Loading personas…
          </div>
        )}
        {attemptedSteps.persona && !selectedPersonaId && (
          <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">
            Select a persona to continue.
          </p>
        )}
        <WorkspacePrimerCarousel slides={workspacePrimerSlides} analytics={analytics} />
      </div>
    );
  };

  const renderProfileStep = () => {
    return (
      <ProfileBasicsForm
        value={profile}
        onChange={handleProfileChange}
        persona={selectedPersona}
        personaInsights={personaInsights}
        workspacePrimerSlides={workspacePrimerSlides}
        analytics={analytics}
        shouldShowErrors={attemptedSteps.profile && !isProfileComplete}
      />
    );
  };

  const renderTeamStep = () => {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Invite collaborators</h3>
          <p className="mt-2 text-sm text-slate-500">
            Bring teammates who will publish updates, review insights, or manage workflows. We recommend inviting sourcing,
            marketing, and leadership partners.
          </p>
          <div className="mt-6 space-y-4">
            {invites.map((invite, index) => {
              const inviteId = `invite-${index}`;
              const emailId = `${inviteId}-email`;
              const roleId = `${inviteId}-role`;
              const isValid = invite.email ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invite.email.trim()) : true;
              return (
                <div key={inviteId} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <label htmlFor={emailId} className="flex-1 text-sm font-medium text-slate-600">
                      Email
                      <input
                        id={emailId}
                        type="email"
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        value={invite.email}
                        onChange={(event) => handleInviteChange(index, { email: event.target.value })}
                        placeholder="alex@gigvora.com"
                      />
                    </label>
                    <label htmlFor={roleId} className="w-full text-sm font-medium text-slate-600 md:w-48">
                      Role
                      <select
                        id={roleId}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        value={invite.role}
                        onChange={(event) => handleInviteChange(index, { role: event.target.value })}
                      >
                        <option value="Collaborator">Collaborator</option>
                        <option value="Approver">Approver</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className="h-10 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 md:w-auto"
                      onClick={() => removeInviteRow(index)}
                      disabled={invites.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                  {!isValid && <p className="mt-2 text-xs text-rose-600">Use a valid email address so we can send invites.</p>}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            onClick={addInviteRow}
          >
            + Add teammate
          </button>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-inner">
          <h4 className="text-sm font-semibold text-slate-900">Recommended collaborators</h4>
          <p className="mt-2 text-sm text-slate-500">
            Founders invite storytellers and operations leads to keep the journey resilient. Freelancers loop in project managers
            and accountants. Talent leaders partner with hiring managers and exec sponsors.
          </p>
        </section>
      </div>
    );
  };

  const renderPreferencesStep = () => {
    const digestOptions = [
      { value: 'daily', label: 'Daily pulse' },
      { value: 'weekly', label: 'Weekly briefing' },
      { value: 'monthly', label: 'Monthly deep-dive' },
    ];
    const signals = [
      'Hiring velocity',
      'Pipeline health',
      'Community engagement',
      'Deal progress',
      'Mentor momentum',
    ];
    const storyThemeOptions = [
      'Culture',
      'Product launches',
      'Customer love',
      'Team wins',
      'Data insights',
    ];
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">How often should we nudge you?</h3>
          <p className="mt-2 text-sm text-slate-500">
            Tailor notifications, recaps, and AI-drafted stories to match your rituals. You can fine-tune this later in settings.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {digestOptions.map((option) => (
              <label
                key={option.value}
                className={[
                  'flex cursor-pointer flex-col rounded-3xl border p-4 transition',
                  preferences.digestCadence === option.value
                    ? 'border-accent bg-accent/5 shadow-lg'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="digest"
                  value={option.value}
                  checked={preferences.digestCadence === option.value}
                  onChange={handleDigestCadenceChange}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-slate-900">{option.label}</span>
                <span className="mt-2 text-xs text-slate-500">
                  {option.value === 'daily' && 'Ideal for active hiring teams wanting real-time signals.'}
                  {option.value === 'weekly' && 'Perfect for executive briefings and prioritisation rituals.'}
                  {option.value === 'monthly' && 'Great for strategic reviews and board-ready storytelling.'}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">Signals to spotlight</h4>
          <p className="mt-2 text-sm text-slate-500">Pick the metrics that surface in your dashboards and AI summaries.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {signals.map((signal) => {
              const isActive = preferences.focusSignals.includes(signal);
              return (
                <button
                  key={signal}
                  type="button"
                  onClick={() => handleFocusSignalToggle(signal)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                  ].join(' ')}
                >
                  {signal}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">Story themes</h4>
          <p className="mt-2 text-sm text-slate-500">
            Select the themes you want AI drafts and templates to prioritise. We tailor prompts, asset callouts, and distribution
            plans accordingly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {storyThemeOptions.map((theme) => {
              const isActive = preferences.storyThemes.includes(theme);
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => updateStoryThemes(theme)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-gradient-to-r from-accent to-indigo-500 text-white shadow-lg'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                  ].join(' ')}
                >
                  {theme}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">AI-crafted drafts</p>
              <p className="mt-1 text-xs text-slate-500">
                Let our AI assistant spin up stories, release notes, and campaign recaps pre-loaded with your voice.
              </p>
            </div>
            <button
              type="button"
              onClick={() => togglePreference('enableAiDrafts')}
              className={[
                'relative inline-flex h-7 w-12 rounded-full border transition',
                preferences.enableAiDrafts ? 'border-accent bg-accent' : 'border-slate-200 bg-white',
              ].join(' ')}
              role="switch"
              aria-checked={preferences.enableAiDrafts}
            >
              <span
                className={[
                  'absolute top-0.5 inline-block h-6 w-6 rounded-full bg-white transition',
                  preferences.enableAiDrafts ? 'translate-x-5 shadow-lg' : 'translate-x-0.5 shadow-sm',
                ].join(' ')}
              />
            </button>
          </div>
        </section>
      </div>
    );
  };

  const renderSummaryStep = () => {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Launch checklist</h3>
          <p className="mt-2 text-sm text-slate-500">
            Confirm the highlights of your onboarding launch. You can revisit any step post-launch from workspace settings.
          </p>
          <dl className="mt-6 space-y-4 text-sm text-slate-600">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Persona</dt>
              <dd className="mt-1 text-base font-semibold text-slate-900">{reviewSummary.persona?.title ?? 'Not selected'}</dd>
              {reviewSummary.persona?.subtitle && <p className="mt-1 text-sm text-slate-500">{reviewSummary.persona.subtitle}</p>}
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile</dt>
              <dd className="mt-1 text-sm text-slate-600">
                {reviewSummary.profile.companyName} · {reviewSummary.profile.role} · {reviewSummary.profile.timezone}
              </dd>
              {reviewSummary.profile.northStar && (
                <p className="mt-1 text-sm text-slate-500">North-star: {reviewSummary.profile.northStar}</p>
              )}
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invites</dt>
              <dd className="mt-1 text-sm text-slate-600">
                {reviewSummary.invites.length > 0
                  ? reviewSummary.invites.map((invite) => `${invite.email} (${invite.role})`).join(', ')
                  : 'Add at least one teammate to unlock collaboration insights.'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferences</dt>
              <dd className="mt-1 text-sm text-slate-600">
                Digest cadence: {preferences.digestCadence}. Focus signals: {preferences.focusSignals.join(', ')}. Story themes:{' '}
                {preferences.storyThemes.join(', ')}.
              </dd>
              <p className="mt-1 text-xs text-slate-500">
                AI drafts {preferences.enableAiDrafts ? 'enabled' : 'disabled'}.
              </p>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-inner">
          <h4 className="text-sm font-semibold text-slate-900">Next milestones</h4>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-accent" />
              {selectedPersona
                ? `Activate the ${selectedPersona.recommendedModules?.[0] ?? 'workspace insights'} module to unlock signature wins.`
                : 'Select a persona to unlock tailored modules.'}
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-accent" />
              Schedule a 30-minute alignment with your invited collaborators to confirm rituals.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-accent" />
              Publish your first story to announce the journey across LinkedIn, Instagram, and community channels.
            </li>
          </ul>
        </section>
      </div>
    );
  };

  return (
    <div className="space-y-8 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Onboarding wizard</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Build your flagship presence in minutes</h1>
          <p className="mt-2 text-sm text-slate-500">
            We orchestrate persona-aligned setup, invite the right collaborators, and activate insights so you can operate at
            LinkedIn, Instagram, and Facebook calibre from day one.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-semibold text-slate-700">{progress}% complete</span>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-accent via-indigo-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <ol className="grid gap-3 md:grid-cols-5">
        {STEP_SEQUENCE.map((step, index) => {
          const state = index === currentStepIndex ? 'current' : index < currentStepIndex ? 'complete' : 'upcoming';
          return (
            <li
              key={step.id}
              className={[
                'rounded-2xl border px-4 py-3 text-sm transition',
                state === 'current'
                  ? 'border-accent bg-white shadow-lg'
                  : state === 'complete'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-slate-200 bg-white/70 text-slate-500',
              ].join(' ')}
            >
              <p className="text-xs font-semibold uppercase tracking-wide">{step.title}</p>
              <p className="mt-1 text-xs text-slate-500">{step.caption}</p>
            </li>
          );
        })}
      </ol>

      <div>
        {currentStep.id === 'persona' && renderPersonaStep()}
        {currentStep.id === 'profile' && renderProfileStep()}
        {currentStep.id === 'team' && renderTeamStep()}
        {currentStep.id === 'preferences' && renderPreferencesStep()}
        {currentStep.id === 'summary' && renderSummaryStep()}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>
            {currentStep.id === 'summary'
              ? 'Launch now to activate AI copilots, analytics, and invite workflows.'
              : 'We auto-save as you go. Invite collaborators anytime.'}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handlePrevious}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
            disabled={currentStepIndex === 0 || launching}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => (currentStep.id === 'summary' ? handleLaunch() : handleNext())}
            className="rounded-full bg-gradient-to-r from-accent via-indigo-500 to-purple-500 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60"
            disabled={!canProceed || launching}
          >
            {currentStep.id === 'summary' ? (launching ? 'Launching…' : 'Launch workspace') : 'Continue'}
          </button>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-400 transition hover:text-slate-600"
            >
              Exit setup
            </button>
          )}
        </div>
      </div>

      {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

OnboardingWizard.propTypes = {
  personas: PropTypes.arrayOf(personaShape),
  analytics: PropTypes.shape({
    track: PropTypes.func,
  }),
  onComplete: PropTypes.func,
  initialPersonaId: PropTypes.string,
  defaultProfile: PropTypes.shape({
    companyName: PropTypes.string,
    role: PropTypes.string,
    timezone: PropTypes.string,
    headline: PropTypes.string,
    northStar: PropTypes.string,
  }),
  defaultPreferences: PropTypes.shape({
    updates: PropTypes.bool,
    digestCadence: PropTypes.string,
    focusSignals: PropTypes.arrayOf(PropTypes.string),
    storyThemes: PropTypes.arrayOf(PropTypes.string),
    enableAiDrafts: PropTypes.bool,
  }),
  defaultInvites: PropTypes.arrayOf(
    PropTypes.shape({
      email: PropTypes.string,
      role: PropTypes.string,
    }),
  ),
  onExit: PropTypes.func,
};

OnboardingWizard.defaultProps = {
  personas: DEFAULT_PERSONAS_FOR_SELECTION,
  analytics: undefined,
  onComplete: undefined,
  initialPersonaId: undefined,
  defaultProfile: DEFAULT_PROFILE,
  defaultPreferences: DEFAULT_PREFERENCES,
  defaultInvites: DEFAULT_INVITES,
  onExit: undefined,
};
