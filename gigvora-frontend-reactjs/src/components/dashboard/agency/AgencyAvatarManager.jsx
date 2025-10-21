import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import UserAvatar from '../../UserAvatar.jsx';

function buildInitialState(overview, preferences) {
  const agencyProfile = overview?.agencyProfile ?? {};
  return {
    brandColor: preferences?.brandColor ?? agencyProfile.brandColor ?? '#2563EB',
    bannerUrl: preferences?.bannerUrl ?? agencyProfile.bannerUrl ?? '',
    avatarUrl: preferences?.avatarUrl ?? agencyProfile.avatarUrl ?? '',
    avatarSeed: overview?.avatarSeed ?? overview?.agencyProfile?.agencyName ?? overview?.name ?? '',
    imageData: null,
  };
}

export default function AgencyAvatarManager({ overview, preferences, onSubmit, saving }) {
  const [draft, setDraft] = useState(() => buildInitialState(overview, preferences));
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const previewImage = draft.imageData || draft.avatarUrl || null;

  useEffect(() => {
    setDraft(buildInitialState(overview, preferences));
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [overview, preferences]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((previous) => ({ ...previous, [name]: value }));
  };

  const handleFileChange = (event) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar images must be 5MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setDraft((previous) => ({ ...previous, imageData: result, avatarUrl: '' }));
      }
    };
    reader.onerror = () => {
      setError('We could not read that file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearAvatar = () => {
    setDraft((previous) => ({ ...previous, imageData: null, avatarUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (typeof onSubmit !== 'function') {
      return;
    }
    setError(null);
    const payload = {
      brandColor: draft.brandColor || undefined,
      bannerUrl: draft.bannerUrl || undefined,
      avatarUrl: draft.avatarUrl || undefined,
      avatarSeed: draft.avatarSeed || undefined,
      imageData: draft.imageData || undefined,
    };

    try {
      await onSubmit(payload);
      setDraft((previous) => ({ ...previous, imageData: null }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (submissionError) {
      setError(submissionError?.message || 'We could not update your avatar.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" id="agency-avatar-settings">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Brand</h2>
          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar name={overview?.agencyProfile?.agencyName ?? overview?.name} imageUrl={previewImage} seed={draft.avatarSeed} size="xl" />
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                Upload new avatar
              </label>
              <button
                type="button"
                onClick={handleClearAvatar}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
              >
                Remove avatar
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Avatar seed (for generated fallback)
              <input
                type="text"
                name="avatarSeed"
                value={draft.avatarSeed}
                onChange={handleChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Brand colour
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="brandColor"
                  value={draft.brandColor || '#2563EB'}
                  onChange={handleChange}
                  className="h-12 w-12 rounded-full border border-slate-200"
                />
                <input
                  type="text"
                  name="brandColor"
                  value={draft.brandColor || ''}
                  onChange={handleChange}
                  placeholder="#2563EB"
                  className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Banner image URL
            <input
              type="url"
              name="bannerUrl"
              value={draft.bannerUrl}
              onChange={handleChange}
              placeholder="https://"
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : 'Save branding'}
          </button>
          <button
            type="button"
            onClick={() => setDraft(buildInitialState(overview, preferences))}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Reset changes
          </button>
        </div>
      </div>
    </form>
  );
}

AgencyAvatarManager.propTypes = {
  overview: PropTypes.shape({
    name: PropTypes.string,
    agencyProfile: PropTypes.object,
    avatarSeed: PropTypes.string,
  }),
  preferences: PropTypes.shape({
    brandColor: PropTypes.string,
    bannerUrl: PropTypes.string,
    avatarUrl: PropTypes.string,
  }),
  onSubmit: PropTypes.func,
  saving: PropTypes.bool,
};

AgencyAvatarManager.defaultProps = {
  overview: undefined,
  preferences: undefined,
  onSubmit: undefined,
  saving: false,
};
