import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import PanelDialog from './PanelDialog.jsx';

const FIELD_LIMITS = {
  tagline: 120,
  description: 1200,
  workforceNotes: 420,
};

const URL_LABELS = {
  bannerImageUrl: 'Banner image URL',
  profileImageUrl: 'Profile badge URL',
  introVideoUrl: 'Intro video URL',
};

function normalizeProfile(profile = {}) {
  return {
    tagline: profile.tagline ?? '',
    description: profile.description ?? '',
    bannerImageUrl: profile.bannerImageUrl ?? '',
    profileImageUrl: profile.profileImageUrl ?? '',
    introVideoUrl: profile.introVideoUrl ?? '',
    workforceAvailable: profile.workforceAvailable ?? '',
    workforceNotes: profile.workforceNotes ?? '',
  };
}

function toPayload(formState) {
  const payload = {
    tagline: formState.tagline?.trim() || null,
    description: formState.description?.trim() || null,
    bannerImageUrl: formState.bannerImageUrl?.trim() || null,
    profileImageUrl: formState.profileImageUrl?.trim() || null,
    introVideoUrl: formState.introVideoUrl?.trim() || null,
    workforceNotes: formState.workforceNotes?.trim() || null,
  };

  if (formState.workforceAvailable === '' || formState.workforceAvailable == null) {
    payload.workforceAvailable = null;
  } else {
    const numeric = Number(formState.workforceAvailable);
    payload.workforceAvailable = Number.isFinite(numeric) ? numeric : null;
  }

  return payload;
}

function BannerPreview({ bannerImageUrl, profileImageUrl, onPreview }) {
  if (!bannerImageUrl && !profileImageUrl) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onPreview}
      className="group w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 text-left transition hover:border-accent/60"
    >
      {bannerImageUrl ? (
        <img
          src={bannerImageUrl}
          alt="Agency banner preview"
          className="h-40 w-full object-cover transition duration-200 group-hover:scale-[1.01]"
          loading="lazy"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-gradient-to-r from-slate-100 to-slate-200 text-xs text-slate-500">
          Banner preview
        </div>
      )}
      {profileImageUrl ? (
        <div className="-mt-10 flex justify-start px-6 pb-6">
          <img
            src={profileImageUrl}
            alt="Profile badge"
            className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
            loading="lazy"
          />
        </div>
      ) : null}
    </button>
  );
}

export default function ProfileBasicsForm({ profile, onSubmit }) {
  const initialState = useMemo(() => normalizeProfile(profile), [profile]);
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const nextState = normalizeProfile(profile);
    setFormState(nextState);
    setErrors({});
    setStatus({ type: null, message: '' });
  }, [profile]);

  const isDirty = useMemo(() => {
    return Object.entries(formState).some(([key, value]) => value !== initialState[key]);
  }, [formState, initialState]);

  const characterUsage = useMemo(() => {
    return {
      tagline: formState.tagline.length,
      description: formState.description.length,
      workforceNotes: formState.workforceNotes.length,
    };
  }, [formState]);

  const validateForm = (state) => {
    const nextErrors = {};

    if (state.tagline && state.tagline.length > FIELD_LIMITS.tagline) {
      nextErrors.tagline = `Keep your tagline under ${FIELD_LIMITS.tagline} characters.`;
    }

    if (state.description && state.description.length > FIELD_LIMITS.description) {
      nextErrors.description = `Trim the overview under ${FIELD_LIMITS.description} characters.`;
    }

    if (state.workforceNotes && state.workforceNotes.length > FIELD_LIMITS.workforceNotes) {
      nextErrors.workforceNotes = `Notes should stay under ${FIELD_LIMITS.workforceNotes} characters.`;
    }

    if (state.workforceAvailable && Number(state.workforceAvailable) < 0) {
      nextErrors.workforceAvailable = 'Available headcount must be zero or greater.';
    }

    Object.entries(URL_LABELS).forEach(([field, label]) => {
      const value = state[field];
      if (!value) {
        return;
      }
      try {
        const parsed = new URL(value);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          nextErrors[field] = `${label} must be an http or https link.`;
        }
      } catch (error) {
        nextErrors[field] = `${label} must be a valid URL.`;
      }
    });

    return nextErrors;
  };

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? '';
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prevErrors) => {
      if (!prevErrors[field]) {
        return prevErrors;
      }
      const nextErrors = { ...prevErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleBlur = (field) => () => {
    const nextErrors = validateForm(formState);
    setErrors(nextErrors);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    const nextErrors = validateForm(formState);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({ type: 'error', message: 'Double-check highlighted fields before saving.' });
      return;
    }
    setSubmitting(true);
    setStatus({ type: null, message: '' });
    try {
      await onSubmit?.(toPayload(formState));
      setStatus({ type: 'success', message: 'Profile details updated.' });
    } catch (error) {
      const message = error?.body?.message ?? error?.message ?? 'Unable to save your changes right now.';
      setStatus({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormState(initialState);
    setStatus({ type: null, message: '' });
    setErrors({});
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
          <div className="space-y-6">
            <div>
              <label htmlFor="tagline" className="text-sm font-semibold text-slate-700">
                Tagline
              </label>
              <div className="mt-2 space-y-2">
                <input
                  id="tagline"
                  name="tagline"
                  type="text"
                  value={formState.tagline}
                  onChange={handleChange('tagline')}
                  onBlur={handleBlur('tagline')}
                  placeholder="Add a short intro"
                  maxLength={FIELD_LIMITS.tagline + 40}
                  aria-invalid={Boolean(errors.tagline)}
                  aria-describedby="tagline-helper"
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                    errors.tagline ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/60' : 'border-slate-200 bg-white'
                  }`}
                />
                <div className="flex items-center justify-between text-xs">
                  <p id="tagline-helper" className={`font-medium ${errors.tagline ? 'text-rose-600' : 'text-slate-500'}`}>
                    Keep it sharp so prospects understand your promise instantly.
                  </p>
                  <span className={characterUsage.tagline > FIELD_LIMITS.tagline ? 'text-rose-600' : 'text-slate-400'}>
                    {characterUsage.tagline}/{FIELD_LIMITS.tagline}
                  </span>
                </div>
                {errors.tagline ? <p className="text-xs font-semibold text-rose-600">{errors.tagline}</p> : null}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-semibold text-slate-700">
                Overview
              </label>
              <div className="mt-2 space-y-2">
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  value={formState.description}
                  onChange={handleChange('description')}
                  onBlur={handleBlur('description')}
                  placeholder="Describe your team and services"
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby="description-helper"
                  className={`w-full rounded-xl border px-3 py-3 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                    errors.description
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/60'
                      : 'border-slate-200 bg-white'
                  }`}
                />
                <div className="flex items-center justify-between text-xs">
                  <p id="description-helper" className={`font-medium ${errors.description ? 'text-rose-600' : 'text-slate-500'}`}>
                    Outline your services, proof, and voice to personalise onboarding journeys.
                  </p>
                  <span className={characterUsage.description > FIELD_LIMITS.description ? 'text-rose-600' : 'text-slate-400'}>
                    {characterUsage.description}/{FIELD_LIMITS.description}
                  </span>
                </div>
                {errors.description ? <p className="text-xs font-semibold text-rose-600">{errors.description}</p> : null}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="bannerImageUrl" className="text-sm font-semibold text-slate-700">
                  Banner image URL
                </label>
                <div className="mt-2 space-y-2">
                  <input
                    id="bannerImageUrl"
                    name="bannerImageUrl"
                    type="url"
                    value={formState.bannerImageUrl}
                    onChange={handleChange('bannerImageUrl')}
                    onBlur={handleBlur('bannerImageUrl')}
                    placeholder="https://..."
                    aria-invalid={Boolean(errors.bannerImageUrl)}
                    className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                      errors.bannerImageUrl
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  />
                  <p className={`text-xs font-medium ${errors.bannerImageUrl ? 'text-rose-600' : 'text-slate-500'}`}>
                    Use 1440×480 imagery for hero-grade clarity.
                  </p>
                  {errors.bannerImageUrl ? (
                    <p className="text-xs font-semibold text-rose-600">{errors.bannerImageUrl}</p>
                  ) : null}
                </div>
              </div>
              <div>
                <label htmlFor="profileImageUrl" className="text-sm font-semibold text-slate-700">
                  Profile badge URL
                </label>
                <div className="mt-2 space-y-2">
                  <input
                    id="profileImageUrl"
                    name="profileImageUrl"
                    type="url"
                    value={formState.profileImageUrl}
                    onChange={handleChange('profileImageUrl')}
                    onBlur={handleBlur('profileImageUrl')}
                    placeholder="https://..."
                    aria-invalid={Boolean(errors.profileImageUrl)}
                    className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                      errors.profileImageUrl
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  />
                  <p className={`text-xs font-medium ${errors.profileImageUrl ? 'text-rose-600' : 'text-slate-500'}`}>
                    Square imagery (min 400×400) keeps the avatar crisp.
                  </p>
                  {errors.profileImageUrl ? (
                    <p className="text-xs font-semibold text-rose-600">{errors.profileImageUrl}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="introVideoUrl" className="text-sm font-semibold text-slate-700">
                Intro video URL
              </label>
              <div className="mt-2 space-y-2">
                <input
                  id="introVideoUrl"
                  name="introVideoUrl"
                  type="url"
                  value={formState.introVideoUrl}
                  onChange={handleChange('introVideoUrl')}
                  onBlur={handleBlur('introVideoUrl')}
                  placeholder="https://player.vimeo.com/..."
                  aria-invalid={Boolean(errors.introVideoUrl)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                    errors.introVideoUrl
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/60'
                      : 'border-slate-200 bg-white'
                  }`}
                />
                <p className={`text-xs font-medium ${errors.introVideoUrl ? 'text-rose-600' : 'text-slate-500'}`}>
                  Paste a hosted link to surface in the onboarding carousel and workspace primer.
                </p>
                {errors.introVideoUrl ? (
                  <p className="text-xs font-semibold text-rose-600">{errors.introVideoUrl}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <BannerPreview
              bannerImageUrl={formState.bannerImageUrl}
              profileImageUrl={formState.profileImageUrl}
              onPreview={() => setPreviewOpen(true)}
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Workforce availability</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Optional telemetry
                </span>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="workforceAvailable" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Available headcount
                  </label>
                  <input
                    id="workforceAvailable"
                    name="workforceAvailable"
                    type="number"
                    min="0"
                    value={formState.workforceAvailable}
                    onChange={handleChange('workforceAvailable')}
                    onBlur={handleBlur('workforceAvailable')}
                    placeholder="e.g. 24"
                    aria-invalid={Boolean(errors.workforceAvailable)}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                      errors.workforceAvailable
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  />
                  <p className="mt-1 text-xs text-slate-500">Signal the collaborators and workspace automations we should enable.</p>
                  {errors.workforceAvailable ? (
                    <p className="text-xs font-semibold text-rose-600">{errors.workforceAvailable}</p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="workforceNotes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </label>
                  <textarea
                    id="workforceNotes"
                    name="workforceNotes"
                    rows={4}
                    value={formState.workforceNotes}
                    onChange={handleChange('workforceNotes')}
                    onBlur={handleBlur('workforceNotes')}
                    placeholder="Add quick notes"
                    aria-invalid={Boolean(errors.workforceNotes)}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                      errors.workforceNotes
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <p className={errors.workforceNotes ? 'font-semibold text-rose-600' : 'text-slate-500'}>
                      Share pipeline nuances, locations, or partner context.
                    </p>
                    <span className={characterUsage.workforceNotes > FIELD_LIMITS.workforceNotes ? 'text-rose-600' : 'text-slate-400'}>
                      {characterUsage.workforceNotes}/{FIELD_LIMITS.workforceNotes}
                    </span>
                  </div>
                  {errors.workforceNotes ? (
                    <p className="text-xs font-semibold text-rose-600">{errors.workforceNotes}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {status.message ? (
          <div
            role={status.type === 'error' ? 'alert' : 'status'}
            aria-live={status.type === 'error' ? 'assertive' : 'polite'}
            className={`rounded-2xl border px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
            disabled={submitting || !isDirty}
          >
            Reset
          </button>
          <span className="text-xs font-medium text-slate-400">Autosave-ready. We’ll highlight conflicts automatically.</span>
        </div>
      </form>
      <PanelDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Profile preview"
        size="xl"
      >
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Workspace hero preview</p>
            <h2 className="mt-3 text-2xl font-semibold">
              {formState.tagline || 'Spotlight your signature work'}
            </h2>
            <p className="mt-3 text-sm text-slate-200">
              {formState.description || 'Your overview will appear here alongside metrics, testimonials, and spotlight media once published.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-200">
              {formState.workforceAvailable ? (
                <span className="rounded-full border border-white/20 px-3 py-1">
                  {formState.workforceAvailable} collaborators ready
                </span>
              ) : null}
              {formState.introVideoUrl ? (
                <span className="rounded-full border border-white/20 px-3 py-1">Intro video linked</span>
              ) : null}
              <span className="rounded-full border border-white/20 px-3 py-1">Premium profile layout</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">Media preview</h3>
              {formState.bannerImageUrl ? (
                <img
                  src={formState.bannerImageUrl}
                  alt="Banner preview"
                  className="mt-3 h-32 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="mt-3 flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                  Upload a banner to preview the hero shell.
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">Badge preview</h3>
              {formState.profileImageUrl ? (
                <img
                  src={formState.profileImageUrl}
                  alt="Profile badge preview"
                  className="mt-3 h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="mt-3 flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-slate-200 text-xs text-slate-400">
                  Upload badge
                </div>
              )}
            </div>
          </div>

          {!formState.bannerImageUrl && !formState.profileImageUrl ? (
            <p className="text-sm text-slate-500">Add a banner or badge to preview it here.</p>
          ) : null}
        </div>
      </PanelDialog>
    </>
  );
}

ProfileBasicsForm.propTypes = {
  profile: PropTypes.shape({
    tagline: PropTypes.string,
    description: PropTypes.string,
    bannerImageUrl: PropTypes.string,
    profileImageUrl: PropTypes.string,
    introVideoUrl: PropTypes.string,
    workforceAvailable: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    workforceNotes: PropTypes.string,
  }),
  onSubmit: PropTypes.func,
};

ProfileBasicsForm.defaultProps = {
  profile: undefined,
  onSubmit: undefined,
};
