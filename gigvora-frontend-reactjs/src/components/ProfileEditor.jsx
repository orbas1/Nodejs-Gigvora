import { useEffect, useMemo, useRef, useState } from 'react';
import TagInput from './TagInput.jsx';

function toDateInput(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

function uniqueStrings(values = []) {
  const result = [];
  const seen = new Set();
  values.forEach((value) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(trimmed);
  });
  return result;
}

function trimmedOrNull(value) {
  if (value == null) {
    return null;
  }
  const trimmed = `${value}`.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  if (!value) return true;
  return /^[+0-9()\-\s]{6,}$/.test(value);
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function buildDraft(profile) {
  if (!profile) {
    return {
      headline: '',
      bio: '',
      missionStatement: '',
      education: '',
      location: '',
      timezone: '',
      avatarSeed: '',
      skills: [],
      areasOfFocus: [],
      preferredEngagements: [],
      statusFlags: [],
      volunteerBadges: [],
      experience: [],
      qualifications: [],
      portfolioLinks: [],
      references: [],
      collaborationRoster: [],
      impactHighlights: [],
      pipelineInsights: [],
    };
  }

  return {
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    missionStatement: profile.missionStatement ?? '',
    education: profile.education ?? '',
    location: profile.location ?? '',
    timezone: profile.timezone ?? '',
    avatarSeed: profile.avatarSeed ?? '',
    skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
    areasOfFocus: Array.isArray(profile.areasOfFocus) ? [...profile.areasOfFocus] : [],
    preferredEngagements: Array.isArray(profile.preferredEngagements) ? [...profile.preferredEngagements] : [],
    statusFlags: Array.isArray(profile.statusFlags) ? [...profile.statusFlags] : [],
    volunteerBadges: Array.isArray(profile.volunteerBadges) ? [...profile.volunteerBadges] : [],
    experience: Array.isArray(profile.experience)
      ? profile.experience.map((entry) => ({
          organization: entry.organization ?? '',
          role: entry.role ?? '',
          startDate: toDateInput(entry.startDate),
          endDate: toDateInput(entry.endDate),
          description: entry.description ?? '',
          highlights: Array.isArray(entry.highlights) ? [...entry.highlights] : [],
        }))
      : [],
    qualifications: Array.isArray(profile.qualifications)
      ? profile.qualifications.map((item) => ({
          title: item.title ?? '',
          authority: item.authority ?? '',
          year: item.year ?? '',
          credentialId: item.credentialId ?? '',
          credentialUrl: item.credentialUrl ?? '',
          description: item.description ?? '',
        }))
      : [],
    portfolioLinks: Array.isArray(profile.portfolioLinks)
      ? profile.portfolioLinks.map((link) => ({
          label: link.label ?? '',
          url: link.url ?? '',
          description: link.description ?? '',
        }))
      : [],
    references: Array.isArray(profile.references)
      ? profile.references.map((reference) => ({
          id: reference.id ?? null,
          name: reference.name ?? '',
          relationship: reference.relationship ?? '',
          company: reference.company ?? '',
          email: reference.email ?? '',
          phone: reference.phone ?? '',
          endorsement: reference.endorsement ?? '',
          isVerified: Boolean(reference.verified),
          weight: reference.weight ?? '',
          lastInteractedAt: toDateInput(reference.lastInteractedAt),
        }))
      : [],
    collaborationRoster: Array.isArray(profile.collaborationRoster)
      ? profile.collaborationRoster.map((collaborator) => ({
          name: collaborator.name ?? '',
          role: collaborator.role ?? '',
          avatarSeed: collaborator.avatarSeed ?? '',
          contact: collaborator.contact ?? '',
        }))
      : [],
    impactHighlights: Array.isArray(profile.impactHighlights)
      ? profile.impactHighlights.map((highlight) => ({
          title: highlight.title ?? '',
          value: highlight.value ?? '',
          description: highlight.description ?? '',
        }))
      : [],
    pipelineInsights: Array.isArray(profile.pipelineInsights)
      ? profile.pipelineInsights.map((insight) => ({
          project: insight.project ?? '',
          payout: insight.payout ?? '',
          status: insight.status ?? '',
          countdown: insight.countdown ?? '',
        }))
      : [],
  };
}

function normalizeDraft(draft) {
  const errors = [];

  const skills = uniqueStrings(draft.skills);
  const preferredEngagements = uniqueStrings(draft.preferredEngagements);
  const statusFlags = uniqueStrings(draft.statusFlags);
  const volunteerBadges = uniqueStrings(draft.volunteerBadges);
  const areasOfFocus = uniqueStrings(draft.areasOfFocus);

  const experienceEntries = (draft.experience ?? [])
    .map((entry, index) => {
      const organization = trimmedOrNull(entry.organization);
      const role = trimmedOrNull(entry.role);
      const description = trimmedOrNull(entry.description);
      const startDate = entry.startDate ? `${entry.startDate}` : null;
      const endDate = entry.endDate ? `${entry.endDate}` : null;
      const highlights = uniqueStrings(entry.highlights ?? []);

      if (!organization && !role && !description && highlights.length === 0) {
        return null;
      }

      if (startDate && Number.isNaN(new Date(startDate).getTime())) {
        errors.push(`Experience #${index + 1} has an invalid start date.`);
      }
      if (endDate && Number.isNaN(new Date(endDate).getTime())) {
        errors.push(`Experience #${index + 1} has an invalid end date.`);
      }

      return {
        organization,
        role,
        description,
        startDate: startDate || null,
        endDate: endDate || null,
        highlights,
      };
    })
    .filter(Boolean);

  const qualifications = (draft.qualifications ?? [])
    .map((item) => {
      const title = trimmedOrNull(item.title);
      const authority = trimmedOrNull(item.authority);
      const year = trimmedOrNull(item.year);
      const credentialId = trimmedOrNull(item.credentialId);
      const credentialUrl = trimmedOrNull(item.credentialUrl);
      const description = trimmedOrNull(item.description);

      if (!title && !authority && !credentialId && !credentialUrl && !description && !year) {
        return null;
      }

      if (credentialUrl && !isValidHttpUrl(credentialUrl)) {
        errors.push(`Credential link for ${title || authority || 'a qualification'} must be a valid URL.`);
      }

      return { title, authority, year, credentialId, credentialUrl, description };
    })
    .filter(Boolean);

  const portfolioLinks = (draft.portfolioLinks ?? [])
    .map((link, index) => {
      const label = trimmedOrNull(link.label);
      const url = trimmedOrNull(link.url);
      const description = trimmedOrNull(link.description);
      if (!label && !url && !description) {
        return null;
      }
      if (url && !isValidHttpUrl(url)) {
        errors.push(`Portfolio link #${index + 1} must include a valid URL (http or https).`);
      }
      return { label, url, description };
    })
    .filter(Boolean);

  const references = (draft.references ?? [])
    .map((reference, index) => {
      const name = trimmedOrNull(reference.name);
      const relationship = trimmedOrNull(reference.relationship);
      const company = trimmedOrNull(reference.company);
      const email = trimmedOrNull(reference.email);
      const phone = trimmedOrNull(reference.phone);
      const endorsement = trimmedOrNull(reference.endorsement);
      const weight = reference.weight === '' || reference.weight == null ? null : Number(reference.weight);
      const lastInteractedAt = toIsoDate(reference.lastInteractedAt);
      const id = reference.id != null && reference.id !== '' ? Number(reference.id) : null;

      if (!name && !relationship && !company && !email && !phone && !endorsement) {
        return null;
      }
      if (!name) {
        errors.push(`Reference #${index + 1} requires a name.`);
        return null;
      }
      if (email && !isValidEmail(email)) {
        errors.push(`Reference ${name} has an invalid email address.`);
      }
      if (phone && !isValidPhone(phone)) {
        errors.push(`Reference ${name} has an invalid phone number.`);
      }
      if (weight != null && (!Number.isFinite(weight) || weight < 0 || weight > 1)) {
        errors.push(`Reference ${name} must have a weight between 0 and 1.`);
      }
      if (reference.lastInteractedAt && !lastInteractedAt) {
        errors.push(`Reference ${name} has an invalid interaction date.`);
      }

      return {
        id: id && Number.isFinite(id) ? id : undefined,
        name,
        relationship,
        company,
        email,
        phone,
        endorsement,
        isVerified: Boolean(reference.isVerified),
        weight: weight == null ? null : Number(weight.toFixed(2)),
        lastInteractedAt,
      };
    })
    .filter(Boolean);

  const collaborationRoster = (draft.collaborationRoster ?? [])
    .map((member) => {
      const name = trimmedOrNull(member.name);
      const role = trimmedOrNull(member.role);
      const avatarSeed = trimmedOrNull(member.avatarSeed);
      const contact = trimmedOrNull(member.contact);
      if (!name && !role && !avatarSeed && !contact) {
        return null;
      }
      if (!name) {
        errors.push('Collaboration roster entries must include a name.');
        return null;
      }
      return { name, role, avatarSeed, contact };
    })
    .filter(Boolean);

  const impactHighlights = (draft.impactHighlights ?? [])
    .map((highlight) => {
      const title = trimmedOrNull(highlight.title);
      const value = trimmedOrNull(highlight.value);
      const description = trimmedOrNull(highlight.description);
      if (!title && !value && !description) {
        return null;
      }
      if (!title && !value) {
        errors.push('Impact highlights must include a title or a metric value.');
        return null;
      }
      return { title, value, description };
    })
    .filter(Boolean);

  const pipelineInsights = (draft.pipelineInsights ?? [])
    .map((insight) => {
      const project = trimmedOrNull(insight.project);
      const payout = trimmedOrNull(insight.payout);
      const status = trimmedOrNull(insight.status);
      const countdown = trimmedOrNull(insight.countdown);
      if (!project && !payout && !status && !countdown) {
        return null;
      }
      if (!project && !payout) {
        errors.push('Pipeline insights require at least a project or payout value.');
        return null;
      }
      return { project, payout, status, countdown };
    })
    .filter(Boolean);

  const payload = {
    headline: trimmedOrNull(draft.headline),
    bio: trimmedOrNull(draft.bio),
    missionStatement: trimmedOrNull(draft.missionStatement),
    education: trimmedOrNull(draft.education),
    location: trimmedOrNull(draft.location),
    timezone: trimmedOrNull(draft.timezone),
    avatarSeed: trimmedOrNull(draft.avatarSeed),
    skills,
    areasOfFocus,
    preferredEngagements,
    statusFlags,
    volunteerBadges,
    experienceEntries,
    qualifications,
    portfolioLinks,
    references,
    collaborationRoster,
    impactHighlights,
    pipelineInsights,
  };

  return { payload, errors };
}

function stableHash(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

export default function ProfileEditor({ open, profile, saving = false, onClose, onSave }) {
  const initialDraft = useMemo(() => buildDraft(profile), [profile]);
  const [draft, setDraft] = useState(initialDraft);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const headlineRef = useRef(null);

  useEffect(() => {
    setDraft(initialDraft);
    setSubmitError(null);
    setValidationErrors([]);
  }, [initialDraft, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, saving]);

  useEffect(() => {
    if (open && headlineRef.current) {
      headlineRef.current.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const { payload: normalizedInitial } = useMemo(() => normalizeDraft(initialDraft), [initialDraft]);
  const { payload: normalizedCurrent } = useMemo(() => normalizeDraft(draft), [draft]);

  const isDirty = stableHash(normalizedCurrent) !== stableHash(normalizedInitial);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    const { payload, errors } = normalizeDraft(draft);
    setValidationErrors(errors);
    if (errors.length > 0) {
      return;
    }
    if (!isDirty) {
      onClose();
      return;
    }
    try {
      await onSave(payload);
    } catch (error) {
      setSubmitError(error?.body?.message ?? error.message ?? 'Unable to update profile.');
    }
  };

  const updateDraft = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateArrayItem = (key, index, updates) => {
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].map((item, idx) => (idx === index ? { ...item, ...updates } : item)),
    }));
  };

  const removeArrayItem = (key, index) => {
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, idx) => idx !== index),
    }));
  };

  const appendArrayItem = (key, item) => {
    setDraft((prev) => ({
      ...prev,
      [key]: [...prev[key], item],
    }));
  };

  const renderValidationErrors = validationErrors.length > 0 || submitError;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-slate-900/60"
        onClick={() => {
          if (!saving) {
            onClose();
          }
        }}
        role="presentation"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
        className="relative ml-auto flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-surfaceMuted/70 px-8 py-6">
            <div>
              <h2 id="profile-editor-title" className="text-lg font-semibold text-slate-900">
                Edit profile
              </h2>
              <p className="text-sm text-slate-500">
                Update marketplace-facing details, availability focus areas, and trust collateral in one place.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="rounded-2xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-10 overflow-y-auto px-8 py-10">
            {renderValidationErrors ? (
              <div className="rounded-3xl border border-red-200 bg-red-50/70 p-5 text-sm text-red-700 shadow-inner">
                {submitError ? <p className="font-semibold">{submitError}</p> : null}
                {validationErrors.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {validationErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Profile headline & location</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-600">Headline</span>
                  <input
                    ref={headlineRef}
                    type="text"
                    value={draft.headline}
                    onChange={(event) => updateDraft('headline', event.target.value)}
                    maxLength={255}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-600">Location</span>
                  <input
                    type="text"
                    value={draft.location}
                    onChange={(event) => updateDraft('location', event.target.value)}
                    maxLength={255}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-600">Timezone</span>
                  <input
                    type="text"
                    value={draft.timezone}
                    onChange={(event) => updateDraft('timezone', event.target.value)}
                    maxLength={120}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-600">Avatar seed</span>
                  <input
                    type="text"
                    value={draft.avatarSeed}
                    onChange={(event) => updateDraft('avatarSeed', event.target.value)}
                    maxLength={255}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-600">Mission statement</span>
                <textarea
                  value={draft.missionStatement}
                  onChange={(event) => updateDraft('missionStatement', event.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Describe how you deliver impact across Launchpad, Volunteers, and marketplace programmes."
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-600">Bio</span>
                <textarea
                  value={draft.bio}
                  onChange={(event) => updateDraft('bio', event.target.value)}
                  rows={4}
                  maxLength={5000}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Share your specialisms, programmes, and story."
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-600">Education</span>
                <textarea
                  value={draft.education}
                  onChange={(event) => updateDraft('education', event.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
            </section>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Focus areas & engagement tags</h3>
              <TagInput
                label="Skills"
                items={draft.skills}
                onChange={(value) => updateDraft('skills', value)}
                placeholder="Add a skill"
                description="Used across search, auto-assign, and Launchpad scoring."
              />
              <TagInput
                label="Areas of focus"
                items={draft.areasOfFocus}
                onChange={(value) => updateDraft('areasOfFocus', value)}
                placeholder="Add a focus area"
                description="Surfaces in availability widgets and volunteer matchmaking."
              />
              <TagInput
                label="Preferred engagements"
                items={draft.preferredEngagements}
                onChange={(value) => updateDraft('preferredEngagements', value)}
                placeholder="e.g. Retained strategy, Sprint facilitation"
              />
              <TagInput
                label="Status flags"
                items={draft.statusFlags}
                onChange={(value) => updateDraft('statusFlags', value)}
                placeholder="e.g. Launchpad Alumni"
              />
              <TagInput
                label="Volunteer badges"
                items={draft.volunteerBadges}
                onChange={(value) => updateDraft('volunteerBadges', value)}
                placeholder="e.g. Safeguarding cleared"
              />
            </section>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Experience timeline</h3>
                <button
                  type="button"
                  onClick={() =>
                    appendArrayItem('experience', {
                      organization: '',
                      role: '',
                      startDate: '',
                      endDate: '',
                      description: '',
                      highlights: [],
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40"
                >
                  Add experience
                </button>
              </div>
              {draft.experience.length === 0 ? (
                <p className="text-sm text-slate-500">Add roles, cohorts, and programmes that demonstrate delivery impact.</p>
              ) : null}
              <div className="space-y-6">
                {draft.experience.map((item, index) => (
                  <article key={`experience-${index}`} className="rounded-3xl border border-slate-200 bg-surfaceMuted/50 p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Experience #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('experience', index)}
                        className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Organisation</span>
                        <input
                          type="text"
                          value={item.organization}
                          onChange={(event) =>
                            updateArrayItem('experience', index, { organization: event.target.value })
                          }
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Role</span>
                        <input
                          type="text"
                          value={item.role}
                          onChange={(event) => updateArrayItem('experience', index, { role: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Start date</span>
                        <input
                          type="date"
                          value={item.startDate}
                          onChange={(event) =>
                            updateArrayItem('experience', index, { startDate: event.target.value })
                          }
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">End date</span>
                        <input
                          type="date"
                          value={item.endDate}
                          onChange={(event) => updateArrayItem('experience', index, { endDate: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    </div>
                    <label className="mt-4 flex flex-col gap-2">
                      <span className="text-xs font-medium text-slate-500">Highlights (one per line)</span>
                      <textarea
                        rows={3}
                        value={(item.highlights ?? []).join('\n')}
                        onChange={(event) =>
                          updateArrayItem('experience', index, {
                            highlights: event.target.value
                              .split('\n')
                              .map((line) => line.trim())
                              .filter((line) => line.length > 0),
                          })
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                    <label className="mt-4 flex flex-col gap-2">
                      <span className="text-xs font-medium text-slate-500">Description</span>
                      <textarea
                        rows={3}
                        value={item.description}
                        onChange={(event) => updateArrayItem('experience', index, { description: event.target.value })}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Qualifications</h3>
                <button
                  type="button"
                  onClick={() =>
                    appendArrayItem('qualifications', {
                      title: '',
                      authority: '',
                      year: '',
                      credentialId: '',
                      credentialUrl: '',
                      description: '',
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40"
                >
                  Add qualification
                </button>
              </div>
              {draft.qualifications.length === 0 ? (
                <p className="text-sm text-slate-500">Add certifications, degrees, or accreditations supporting compliance readiness.</p>
              ) : null}
              <div className="space-y-6">
                {draft.qualifications.map((item, index) => (
                  <article key={`qualification-${index}`} className="rounded-3xl border border-slate-200 bg-surfaceMuted/50 p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Qualification #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('qualifications', index)}
                        className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Title</span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(event) => updateArrayItem('qualifications', index, { title: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Issuing authority</span>
                        <input
                          type="text"
                          value={item.authority}
                          onChange={(event) => updateArrayItem('qualifications', index, { authority: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Year</span>
                        <input
                          type="text"
                          value={item.year}
                          onChange={(event) => updateArrayItem('qualifications', index, { year: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Credential ID</span>
                        <input
                          type="text"
                          value={item.credentialId}
                          onChange={(event) => updateArrayItem('qualifications', index, { credentialId: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="md:col-span-2 flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Credential URL</span>
                        <input
                          type="url"
                          value={item.credentialUrl}
                          onChange={(event) => updateArrayItem('qualifications', index, { credentialUrl: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          placeholder="https://"
                        />
                      </label>
                    </div>
                    <label className="mt-4 flex flex-col gap-2">
                      <span className="text-xs font-medium text-slate-500">Description</span>
                      <textarea
                        rows={3}
                        value={item.description}
                        onChange={(event) => updateArrayItem('qualifications', index, { description: event.target.value })}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Portfolio links</h3>
                <button
                  type="button"
                  onClick={() =>
                    appendArrayItem('portfolioLinks', {
                      label: '',
                      url: '',
                      description: '',
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40"
                >
                  Add link
                </button>
              </div>
              {draft.portfolioLinks.length === 0 ? (
                <p className="text-sm text-slate-500">Publish case studies, showreels, and compliance documents for clients and agencies.</p>
              ) : null}
              <div className="space-y-6">
                {draft.portfolioLinks.map((link, index) => (
                  <article key={`portfolio-${index}`} className="rounded-3xl border border-slate-200 bg-surfaceMuted/50 p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Link #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('portfolioLinks', index)}
                        className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Label</span>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(event) => updateArrayItem('portfolioLinks', index, { label: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">URL</span>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(event) => updateArrayItem('portfolioLinks', index, { url: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          placeholder="https://"
                        />
                      </label>
                    </div>
                    <label className="mt-4 flex flex-col gap-2">
                      <span className="text-xs font-medium text-slate-500">Description</span>
                      <textarea
                        rows={2}
                        value={link.description}
                        onChange={(event) => updateArrayItem('portfolioLinks', index, { description: event.target.value })}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">References</h3>
                <button
                  type="button"
                  onClick={() =>
                    appendArrayItem('references', {
                      id: null,
                      name: '',
                      relationship: '',
                      company: '',
                      email: '',
                      phone: '',
                      endorsement: '',
                      isVerified: false,
                      weight: '',
                      lastInteractedAt: '',
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40"
                >
                  Add reference
                </button>
              </div>
              {draft.references.length === 0 ? (
                <p className="text-sm text-slate-500">Capture employer testimonials and programme endorsements with optional weighting.</p>
              ) : null}
              <div className="space-y-6">
                {draft.references.map((reference, index) => (
                  <article key={`reference-${index}`} className="rounded-3xl border border-slate-200 bg-surfaceMuted/50 p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Reference #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('references', index)}
                        className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Name *</span>
                        <input
                          type="text"
                          value={reference.name}
                          onChange={(event) => updateArrayItem('references', index, { name: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Relationship</span>
                        <input
                          type="text"
                          value={reference.relationship}
                          onChange={(event) => updateArrayItem('references', index, { relationship: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Company</span>
                        <input
                          type="text"
                          value={reference.company}
                          onChange={(event) => updateArrayItem('references', index, { company: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Email</span>
                        <input
                          type="email"
                          value={reference.email}
                          onChange={(event) => updateArrayItem('references', index, { email: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Phone</span>
                        <input
                          type="text"
                          value={reference.phone}
                          onChange={(event) => updateArrayItem('references', index, { phone: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Weight (0-1)</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={reference.weight}
                          onChange={(event) => updateArrayItem('references', index, { weight: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Last interacted</span>
                        <input
                          type="date"
                          value={reference.lastInteractedAt}
                          onChange={(event) =>
                            updateArrayItem('references', index, { lastInteractedAt: event.target.value })
                          }
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    </div>
                    <label className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={reference.isVerified}
                        onChange={(event) =>
                          updateArrayItem('references', index, { isVerified: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                      Mark as verified
                    </label>
                    <label className="mt-4 flex flex-col gap-2">
                      <span className="text-xs font-medium text-slate-500">Endorsement</span>
                      <textarea
                        rows={3}
                        value={reference.endorsement}
                        onChange={(event) => updateArrayItem('references', index, { endorsement: event.target.value })}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Collaboration roster</h3>
                <button
                  type="button"
                  onClick={() =>
                    appendArrayItem('collaborationRoster', {
                      name: '',
                      role: '',
                      avatarSeed: '',
                      contact: '',
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40"
                >
                  Add collaborator
                </button>
              </div>
              {draft.collaborationRoster.length === 0 ? (
                <p className="text-sm text-slate-500">Showcase your current pods across agencies, strategists, and Launchpad alumni.</p>
              ) : null}
              <div className="space-y-6">
                {draft.collaborationRoster.map((member, index) => (
                  <article key={`collaborator-${index}`} className="rounded-3xl border border-slate-200 bg-surfaceMuted/50 p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Collaborator #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('collaborationRoster', index)}
                        className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Name *</span>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(event) => updateArrayItem('collaborationRoster', index, { name: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Role</span>
                        <input
                          type="text"
                          value={member.role}
                          onChange={(event) => updateArrayItem('collaborationRoster', index, { role: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Avatar seed</span>
                        <input
                          type="text"
                          value={member.avatarSeed}
                          onChange={(event) => updateArrayItem('collaborationRoster', index, { avatarSeed: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Contact</span>
                        <input
                          type="text"
                          value={member.contact}
                          onChange={(event) => updateArrayItem('collaborationRoster', index, { contact: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Impact & pipeline insights</h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      appendArrayItem('impactHighlights', {
                        title: '',
                        value: '',
                        description: '',
                      })
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40"
                  >
                    Add impact highlight
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      appendArrayItem('pipelineInsights', {
                        project: '',
                        payout: '',
                        status: '',
                        countdown: '',
                      })
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40"
                  >
                    Add pipeline insight
                  </button>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  {draft.impactHighlights.length === 0 ? (
                    <p className="text-sm text-slate-500">Showcase key outcomes from engagements or volunteer missions.</p>
                  ) : null}
                  {draft.impactHighlights.map((highlight, index) => (
                    <article key={`impact-${index}`} className="rounded-3xl border border-slate-200 bg-surfaceMuted/50 p-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">Impact highlight #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('impactHighlights', index)}
                          className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <label className="mt-4 flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Title</span>
                        <input
                          type="text"
                          value={highlight.title}
                          onChange={(event) => updateArrayItem('impactHighlights', index, { title: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="mt-3 flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Metric/value</span>
                        <input
                          type="text"
                          value={highlight.value}
                          onChange={(event) => updateArrayItem('impactHighlights', index, { value: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="mt-3 flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Description</span>
                        <textarea
                          rows={3}
                          value={highlight.description}
                          onChange={(event) => updateArrayItem('impactHighlights', index, { description: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    </article>
                  ))}
                </div>
                <div className="space-y-6">
                  {draft.pipelineInsights.length === 0 ? (
                    <p className="text-sm text-slate-500">Add active pipeline items with payout visibility for transparency.</p>
                  ) : null}
                  {draft.pipelineInsights.map((insight, index) => (
                    <article key={`pipeline-${index}`} className="rounded-3xl border border-slate-200 bg-surfaceMuted/50 p-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">Pipeline insight #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('pipelineInsights', index)}
                          className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <label className="mt-4 flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Project</span>
                        <input
                          type="text"
                          value={insight.project}
                          onChange={(event) => updateArrayItem('pipelineInsights', index, { project: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="mt-3 flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Payout</span>
                        <input
                          type="text"
                          value={insight.payout}
                          onChange={(event) => updateArrayItem('pipelineInsights', index, { payout: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="mt-3 flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Status</span>
                        <input
                          type="text"
                          value={insight.status}
                          onChange={(event) => updateArrayItem('pipelineInsights', index, { status: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="mt-3 flex flex-col gap-2">
                        <span className="text-xs font-medium text-slate-500">Countdown</span>
                        <input
                          type="text"
                          value={insight.countdown}
                          onChange={(event) => updateArrayItem('pipelineInsights', index, { countdown: event.target.value })}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}
