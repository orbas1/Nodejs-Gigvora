import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import PersonaSelection, { personaShape, DEFAULT_PERSONAS_FOR_SELECTION } from './PersonaSelection.jsx';
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

const INVITE_LIMIT = 20;

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;

const DEFAULT_PRIMER_HIGHLIGHTS = [
  'Personalise your hero, invites, and insights with persona-backed defaults.',
  'Invite your core collaborators so approvals and rituals stay in sync.',
  'Activate AI story starters, analytics, and executive briefs on launch.',
];

function createPersonaPrimerSlides(persona, insights) {
  if (!persona) {
    return [];
  }

  const modules = persona.recommendedModules ?? [];
  const signatureMoments = persona.signatureMoments ?? [];
  const heroMedia = persona.heroMedia ?? {};
  const highlights = Array.isArray(persona.metadata?.primerHighlights) && persona.metadata.primerHighlights.length
    ? persona.metadata.primerHighlights
    : DEFAULT_PRIMER_HIGHLIGHTS;
  const suggestedRoles = Array.isArray(persona.metadata?.recommendedRoles) ? persona.metadata.recommendedRoles : [];
  const [winsInsight] = insights.filter((entry) => entry.label === 'Signature wins');
  const metrics = (persona.metrics ?? []).slice(0, 2).map((metric) => ({
    label: metric.label,
    value: metric.value,
  }));

  const slides = [
    {
      id: `${persona.id}-overview`,
      pill: persona.title,
      title: `Launch the ${persona.title.toLowerCase()}`,
      description: persona.subtitle || persona.headline || '',
      metrics,
      checklist: [
        winsInsight?.value?.[0],
        modules.length ? `Preloaded modules: ${modules.slice(0, 3).join(', ')}` : null,
        highlights[0],
      ].filter(Boolean),
      media:
        heroMedia.poster
          ? {
              type: 'image',
              src: heroMedia.poster,
              alt: heroMedia.alt || `${persona.title} hero media`,
            }
          : undefined,
    },
  ];

  signatureMoments.forEach((moment, index) => {
    slides.push({
      id: `${persona.id}-moment-${index + 1}`,
      pill: `Moment ${index + 1}`,
      title: moment.label,
      description: moment.description,
      checklist: [
        modules[index] ? `Align with ${modules[index]}` : null,
        highlights[(index + 1) % highlights.length],
      ].filter(Boolean),
    });
  });

  slides.push({
    id: `${persona.id}-collaboration`,
    pill: 'Collaboration',
    title: 'Invite collaborators and calibrate signals',
    description:
      'Confirm who publishes updates, reviews analytics, and approves storytelling so workflows stay coordinated.',
    checklist: [
      'Add at least one collaborator before launch',
      persona.metrics?.[0]?.label ? `Track ${persona.metrics[0].label.toLowerCase()} from day one` : null,
      suggestedRoles.length ? `Suggested roles: ${suggestedRoles.join(', ')}` : null,
      highlights[(signatureMoments.length + 1) % highlights.length],
    ].filter(Boolean),
  });

  return slides;
}

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
  const selectedPersonaPillar = selectedPersona?.metadata?.personaPillar ?? null;
  const selectedPersonaPrimaryCta = selectedPersona?.metadata?.primaryCta ?? null;
  const selectedPersonaHero = selectedPersona?.heroMedia ?? {};
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
      personaPillar: selectedPersonaPillar,
    });
  }, [analytics, currentStep, selectedPersonaId, selectedPersonaPillar]);

  const personaInsights = useMemo(() => {
    if (!selectedPersona) {
      return [];
    }
    const modules = selectedPersona.recommendedModules ?? [];
    const base = [
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
    if (selectedPersonaPrimaryCta) {
      base.push({
        label: 'Launch focus',
        value: [selectedPersonaPrimaryCta],
      });
    }
    if (selectedPersonaPillar) {
      base.push({
        label: 'Persona pillar',
        value: [selectedPersonaPillar],
      });
    }
    return base;
  }, [selectedPersona, selectedPersonaPillar, selectedPersonaPrimaryCta]);

  const reviewSummary = useMemo(() => {
    return {
      persona: selectedPersona,
      profile,
      invites: invites.filter((invite) => invite.email.trim()),
      preferences,
      modules: selectedPersona?.recommendedModules ?? [],
    };
  }, [invites, preferences, profile, selectedPersona]);

  const personaPrimerSlides = useMemo(() => {
    return createPersonaPrimerSlides(selectedPersona, personaInsights);
  }, [personaInsights, selectedPersona]);

  const primerHighlights = useMemo(() => {
    if (selectedPersona?.metadata?.primerHighlights?.length) {
      return selectedPersona.metadata.primerHighlights;
    }
    const personaWithHighlights = personaOptions.find((persona) => persona.metadata?.primerHighlights?.length);
    if (personaWithHighlights) {
      return personaWithHighlights.metadata.primerHighlights;
    }
    return DEFAULT_PRIMER_HIGHLIGHTS;
  }, [personaOptions, selectedPersona]);

  const inviteDiagnostics = useMemo(() => {
    const errors = {};
    const seen = new Map();
    let hasValidInvite = false;

    invites.forEach((invite, index) => {
      const email = invite.email?.trim().toLowerCase();
      if (!email) {
        return;
      }
      if (!EMAIL_REGEX.test(email)) {
        errors[index] = 'Enter a valid email.';
        return;
      }
      if (seen.has(email)) {
        errors[index] = 'Duplicate invite.';
        const existingIndex = seen.get(email);
        errors[existingIndex] = 'Duplicate invite.';
        return;
      }
      seen.set(email, index);
      hasValidInvite = true;
    });

    return {
      errors,
      hasValidInvite,
      hasErrors: Object.keys(errors).length > 0,
    };
  }, [invites]);

  const handlePrimerSlideChange = useCallback(
    ({ index, slide }) => {
      analytics?.track?.('web_onboarding_primer_viewed', {
        personaId: selectedPersonaId,
        personaPillar: selectedPersonaPillar,
        slideIndex: index,
        slideId: slide?.id,
      });
    },
    [analytics, selectedPersonaId, selectedPersonaPillar],
  );

  const canProceed = useMemo(() => {
    if (!currentStep) {
      return false;
    }
    if (currentStep.id === 'persona') {
      return Boolean(selectedPersonaId) && !personasLoading;
    }
    if (currentStep.id === 'profile') {
      return Boolean(profile.companyName.trim() && profile.role.trim() && profile.timezone.trim());
    }
    if (currentStep.id === 'team') {
      return inviteDiagnostics.hasValidInvite && !inviteDiagnostics.hasErrors;
    }
    if (currentStep.id === 'preferences') {
      return Boolean(preferences.digestCadence);
    }
    return true;
  }, [
    currentStep,
    inviteDiagnostics.hasErrors,
    inviteDiagnostics.hasValidInvite,
    personasLoading,
    preferences.digestCadence,
    profile.companyName,
    profile.role,
    profile.timezone,
    selectedPersonaId,
  ]);

  const handleNext = () => {
    if (!canProceed) {
      return;
    }
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
      personaPillar: persona?.metadata?.personaPillar,
    });
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
    setInvites((current) => {
      if (current.length >= INVITE_LIMIT) {
        return current;
      }
      return [...current, { email: '', role: 'Collaborator' }];
    });
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
        personaPillar: payload.persona?.metadata?.personaPillar ?? selectedPersonaPillar,
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
      <div className="space-y-6">
        {personaLoadError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {personaLoadError}
          </div>
        )}
        <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
          <div className="space-y-4">
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
          </div>
          <div className="space-y-4">
            <WorkspacePrimerCarousel
              slides={personaPrimerSlides.length ? personaPrimerSlides : undefined}
              onSlideChange={handlePrimerSlideChange}
            />
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-800">Why it matters</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {primerHighlights.map((message) => (
                  <li key={message} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-accent" aria-hidden="true" />
                    <span>{message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfileStep = () => {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Tell us about your brand</h3>
          <p className="mt-2 text-sm text-slate-500">
            This information powers your workspace hero, story templates, and executive summaries. Accuracy here unlocks
            onboarding automations.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Company or brand name
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={profile.companyName}
                onChange={(event) => handleProfileChange('companyName', event.target.value)}
                placeholder="Gigvora Labs"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Your role
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={profile.role}
                onChange={(event) => handleProfileChange('role', event.target.value)}
                placeholder="Head of Talent"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Preferred timezone
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={profile.timezone}
                onChange={(event) => handleProfileChange('timezone', event.target.value)}
                placeholder="GMT / London"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Signature headline
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={profile.headline}
                onChange={(event) => handleProfileChange('headline', event.target.value)}
                placeholder="Where hiring brand, community, and revenue meet"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 md:col-span-2">
              North-star outcome for the next quarter
              <textarea
                rows="3"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={profile.northStar}
                onChange={(event) => handleProfileChange('northStar', event.target.value)}
                placeholder="Scale warm talent pipeline to 150 qualified leads and launch onboarding experience."
              />
            </label>
          </div>
        </section>
        {selectedPersona && (
          <aside className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
            <h4 className="text-lg font-semibold">What this unlocks</h4>
            <p className="mt-2 text-sm text-slate-200">
              Your answers personalise automation, sample copy, and analytics to the {selectedPersona.title.toLowerCase()} playbook.
            </p>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              {personaInsights.map((insight) => (
                <div key={insight.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{insight.label}</dt>
                  <dd className="mt-2 space-y-1 text-sm">
                    {insight.value.map((line) => (
                      <p key={line} className="text-slate-100">
                        {line}
                      </p>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        )}
      </div>
    );
  };

  const renderTeamStep = () => {
    const recommendedRoles = selectedPersona?.metadata?.recommendedRoles ?? [];
    const inviteLimitReached = invites.length >= INVITE_LIMIT;
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
              const helperId = `${inviteId}-helper`;
              const rowError = inviteDiagnostics.errors[index];
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
                        aria-invalid={Boolean(rowError)}
                        aria-describedby={rowError ? helperId : undefined}
                      />
                      <p
                        id={helperId}
                        className={`mt-2 text-xs ${rowError ? 'font-semibold text-rose-600' : 'text-slate-500'}`}
                      >
                        {rowError ?? 'We route invites with the right permissions and analytics tracking.'}
                      </p>
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
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            onClick={addInviteRow}
            disabled={inviteLimitReached}
          >
            + Add teammate
          </button>
          <p className="mt-2 text-xs text-slate-500">
            You can invite up to {INVITE_LIMIT} collaborators during onboarding.
          </p>
          {inviteLimitReached ? (
            <p className="mt-1 text-xs font-semibold text-amber-600">
              You’ve reached the launch limit—invite additional teammates from workspace settings post-launch.
            </p>
          ) : null}
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-inner">
          <h4 className="text-sm font-semibold text-slate-900">Recommended collaborators</h4>
          <p className="mt-2 text-sm text-slate-500">
            {selectedPersona && recommendedRoles.length
              ? `Invite ${recommendedRoles.slice(0, 3).join(', ')} so your ${selectedPersona.title.toLowerCase()} journey launches with the right rituals.`
              : 'Founders invite storytellers and operations leads to keep the journey resilient. Freelancers loop in project managers and accountants. Talent leaders partner with hiring managers and exec sponsors.'}
          </p>
          {recommendedRoles.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {recommendedRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : null}
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
          {selectedPersonaHero?.poster ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
              <img
                src={selectedPersonaHero.poster}
                alt={selectedPersonaHero.alt || `${reviewSummary.persona?.title ?? 'Persona'} hero`}
                className="w-full rounded-2xl object-cover"
                loading="lazy"
              />
            </div>
          ) : null}
          {selectedPersonaPrimaryCta ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedPersonaPrimaryCta}</p>
                <p className="mt-1 text-xs text-slate-500">We’ll prioritise this moment as soon as you launch.</p>
              </div>
              {selectedPersonaPillar ? (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  {selectedPersonaPillar}
                </span>
              ) : null}
            </div>
          ) : null}
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
          {primerHighlights.length ? (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-900">Primer highlights</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {primerHighlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-accent" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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

      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-600"
        >
          {error}
        </p>
      )}
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
