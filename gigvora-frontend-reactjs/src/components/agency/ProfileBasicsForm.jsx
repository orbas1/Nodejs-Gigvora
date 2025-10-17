import { useEffect, useMemo, useState } from 'react';
import PanelDialog from './PanelDialog.jsx';

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

  useEffect(() => {
    setFormState(normalizeProfile(profile));
  }, [profile]);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? '';
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
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
            <input
              id="tagline"
              name="tagline"
              type="text"
              value={formState.tagline}
              onChange={handleChange('tagline')}
              placeholder="Add a short intro"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-semibold text-slate-700">
              Overview
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              value={formState.description}
              onChange={handleChange('description')}
              placeholder="Describe your team and services"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="bannerImageUrl" className="text-sm font-semibold text-slate-700">
                Banner image URL
              </label>
              <input
                id="bannerImageUrl"
                name="bannerImageUrl"
                type="url"
                value={formState.bannerImageUrl}
                onChange={handleChange('bannerImageUrl')}
                placeholder="https://..."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label htmlFor="profileImageUrl" className="text-sm font-semibold text-slate-700">
                Profile badge URL
              </label>
              <input
                id="profileImageUrl"
                name="profileImageUrl"
                type="url"
                value={formState.profileImageUrl}
                onChange={handleChange('profileImageUrl')}
                placeholder="https://..."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="introVideoUrl" className="text-sm font-semibold text-slate-700">
              Intro video URL
            </label>
            <input
              id="introVideoUrl"
              name="introVideoUrl"
              type="url"
              value={formState.introVideoUrl}
              onChange={handleChange('introVideoUrl')}
              placeholder="https://player.vimeo.com/..."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="space-y-6">
          <BannerPreview
            bannerImageUrl={formState.bannerImageUrl}
            profileImageUrl={formState.profileImageUrl}
            onPreview={() => setPreviewOpen(true)}
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">Workforce availability</h3>
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
                  placeholder="e.g. 24"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
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
                  placeholder="Add quick notes"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {status.message ? (
        <div
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
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
          disabled={submitting}
        >
          Reset
        </button>
      </div>
      </form>
      <PanelDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Profile preview"
        size="xl"
      >
        <div className="space-y-4">
          {formState.bannerImageUrl ? (
            <img
              src={formState.bannerImageUrl}
              alt="Banner preview"
              className="w-full rounded-2xl object-cover"
            />
          ) : null}
          {formState.profileImageUrl ? (
            <img
              src={formState.profileImageUrl}
              alt="Profile badge preview"
              className="h-32 w-32 rounded-full object-cover"
            />
          ) : null}
          {!formState.bannerImageUrl && !formState.profileImageUrl ? (
            <p className="text-sm text-slate-500">Add a banner or badge to preview it here.</p>
          ) : null}
        </div>
      </PanelDialog>
    </>
  );
}
