import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import TagInput from '../../TagInput.jsx';

const FOLLOWER_POLICY_OPTIONS = [
  { value: 'open', label: 'Open — anyone can follow instantly' },
  { value: 'approval_required', label: 'Approval required' },
  { value: 'closed', label: 'Closed — followers disabled' },
];

const CONNECTION_POLICY_OPTIONS = [
  { value: 'open', label: 'Open — instant acceptance' },
  { value: 'invite_only', label: 'Invite only' },
  { value: 'manual_review', label: 'Manual review' },
];

const DEFAULT_BRAND_COLOR = '#2563EB';

function buildInitialState(overview, preferences) {
  const agencyProfile = overview?.agencyProfile ?? {};
  return {
    agencyName: agencyProfile.agencyName ?? overview?.name ?? '',
    focusArea: agencyProfile.focusArea ?? '',
    tagline: agencyProfile.tagline ?? overview?.headline ?? '',
    summary: agencyProfile.summary ?? overview?.bio ?? '',
    about: agencyProfile.about ?? '',
    website: agencyProfile.website ?? '',
    headline: overview?.headline ?? '',
    bio: overview?.bio ?? '',
    missionStatement: overview?.missionStatement ?? '',
    timezone: overview?.timezone ?? '',
    location: agencyProfile.location ?? overview?.location ?? '',
    services: Array.isArray(agencyProfile.services) ? agencyProfile.services : [],
    industries: Array.isArray(agencyProfile.industries) ? agencyProfile.industries : [],
    clients: Array.isArray(agencyProfile.clients) ? agencyProfile.clients : [],
    awards: Array.isArray(agencyProfile.awards) ? agencyProfile.awards : [],
    socialLinks: Array.isArray(agencyProfile.socialLinks) ? agencyProfile.socialLinks : [],
    teamSize: agencyProfile.teamSize ? String(agencyProfile.teamSize) : '',
    foundedYear: agencyProfile.foundedYear ? String(agencyProfile.foundedYear) : '',
    primaryContactName: agencyProfile.primaryContactName ?? overview?.name ?? '',
    primaryContactEmail: agencyProfile.primaryContactEmail ?? overview?.email ?? '',
    primaryContactPhone: agencyProfile.primaryContactPhone ?? '',
    brandColor: agencyProfile.brandColor ?? preferences?.brandColor ?? DEFAULT_BRAND_COLOR,
    bannerUrl: agencyProfile.bannerUrl ?? preferences?.bannerUrl ?? '',
    followerPolicy: preferences?.followerPolicy ?? agencyProfile.followerPolicy ?? 'open',
    connectionPolicy: preferences?.connectionPolicy ?? agencyProfile.connectionPolicy ?? 'open',
    autoAcceptFollowers: preferences?.autoAcceptFollowers ?? agencyProfile.autoAcceptFollowers ?? true,
    defaultConnectionMessage: preferences?.defaultConnectionMessage ?? agencyProfile.defaultConnectionMessage ?? '',
  };
}

function normalizeSocialLinks(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => ({
    label: item?.label ?? '',
    url: item?.url ?? '',
  }));
}

export default function AgencyProfileEditForm({ overview, preferences, onSubmit, saving }) {
  const initialState = useMemo(() => buildInitialState(overview, preferences), [overview, preferences]);
  const [formState, setFormState] = useState(initialState);
  const [socialLinks, setSocialLinks] = useState(normalizeSocialLinks(initialState.socialLinks));

  useEffect(() => {
    const nextState = buildInitialState(overview, preferences);
    setFormState(nextState);
    setSocialLinks(normalizeSocialLinks(nextState.socialLinks));
  }, [overview, preferences]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setFormState((previous) => ({ ...previous, [name]: checked }));
  };

  const handleTagUpdate = (field) => (items) => {
    setFormState((previous) => ({ ...previous, [field]: items }));
  };

  const handleSocialLinkChange = (index, key, value) => {
    setSocialLinks((previous) => {
      const next = [...previous];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleAddSocialLink = () => {
    setSocialLinks((previous) => [...previous, { label: '', url: '' }]);
  };

  const handleRemoveSocialLink = (index) => {
    setSocialLinks((previous) => previous.filter((_, idx) => idx !== index));
  };

  const handleReset = () => {
    const next = buildInitialState(overview, preferences);
    setFormState(next);
    setSocialLinks(normalizeSocialLinks(next.socialLinks));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (typeof onSubmit !== 'function') {
      return;
    }

    const payload = {
      agencyName: formState.agencyName || undefined,
      focusArea: formState.focusArea || undefined,
      tagline: formState.tagline || undefined,
      summary: formState.summary || undefined,
      about: formState.about || undefined,
      website: formState.website || undefined,
      headline: formState.headline || undefined,
      bio: formState.bio || undefined,
      missionStatement: formState.missionStatement || undefined,
      timezone: formState.timezone || undefined,
      location: formState.location || undefined,
      services: formState.services,
      industries: formState.industries,
      clients: formState.clients,
      awards: formState.awards,
      socialLinks: socialLinks
        .map((link) => ({ label: link.label?.trim() ?? '', url: link.url?.trim() ?? '' }))
        .filter((link) => link.url.length),
      teamSize: formState.teamSize ? Number(formState.teamSize) : undefined,
      foundedYear: formState.foundedYear ? Number(formState.foundedYear) : undefined,
      primaryContactName: formState.primaryContactName || undefined,
      primaryContactEmail: formState.primaryContactEmail || undefined,
      primaryContactPhone: formState.primaryContactPhone || undefined,
      brandColor: formState.brandColor || undefined,
      bannerUrl: formState.bannerUrl || undefined,
      autoAcceptFollowers: Boolean(formState.autoAcceptFollowers),
      defaultConnectionMessage: formState.defaultConnectionMessage || undefined,
      followerPolicy: formState.followerPolicy || undefined,
      connectionPolicy: formState.connectionPolicy || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Agency name
            <input
              type="text"
              name="agencyName"
              value={formState.agencyName}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Tagline
            <input
              type="text"
              name="tagline"
              value={formState.tagline}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Focus area
            <input
              type="text"
              name="focusArea"
              value={formState.focusArea}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Summary
            <textarea
              name="summary"
              rows={4}
              value={formState.summary}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            About
            <textarea
              name="about"
              rows={4}
              value={formState.about}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
        </div>

        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Website
            <input
              type="url"
              name="website"
              value={formState.website}
              onChange={handleInputChange}
              placeholder="https://"
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Location
            <input
              type="text"
              name="location"
              value={formState.location}
              onChange={handleInputChange}
              placeholder="City, Country"
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Timezone
            <input
              type="text"
              name="timezone"
              value={formState.timezone}
              onChange={handleInputChange}
              placeholder="e.g. UTC+1"
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Team size
              <input
                type="number"
                name="teamSize"
                min="1"
                value={formState.teamSize}
                onChange={handleInputChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Founded year
              <input
                type="number"
                name="foundedYear"
                min="1900"
                max="2100"
                value={formState.foundedYear}
                onChange={handleInputChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Mission statement
            <textarea
              name="missionStatement"
              rows={3}
              value={formState.missionStatement}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TagInput label="Services" items={formState.services} onChange={handleTagUpdate('services')} description="Add up to 25 services." />
        <TagInput label="Industries" items={formState.industries} onChange={handleTagUpdate('industries')} description="Industries you specialise in." />
        <TagInput label="Notable clients" items={formState.clients} onChange={handleTagUpdate('clients')} description="Highlight trusted clients or partners." />
        <TagInput label="Awards" items={formState.awards} onChange={handleTagUpdate('awards')} description="Certifications, accolades, or recognition." />
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Social links</h3>
        <div className="space-y-3">
          {socialLinks.map((link, index) => (
            <div key={`social-link-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-[1fr_1fr_auto]">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Label
                <input
                  type="text"
                  value={link.label}
                  onChange={(event) => handleSocialLinkChange(index, 'label', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                URL
                <input
                  type="url"
                  value={link.url}
                  onChange={(event) => handleSocialLinkChange(index, 'url', event.target.value)}
                  placeholder="https://"
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <button
                type="button"
                onClick={() => handleRemoveSocialLink(index)}
                className="self-end rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddSocialLink}
            className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          >
            Add social link
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Primary contact name
            <input
              type="text"
              name="primaryContactName"
              value={formState.primaryContactName}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Primary contact email
            <input
              type="email"
              name="primaryContactEmail"
              value={formState.primaryContactEmail}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Primary contact phone
            <input
              type="text"
              name="primaryContactPhone"
              value={formState.primaryContactPhone}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <span>Brand color</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="brandColor"
                value={formState.brandColor || DEFAULT_BRAND_COLOR}
                onChange={handleInputChange}
                className="h-12 w-12 rounded-full border border-slate-200"
              />
              <input
                type="text"
                name="brandColor"
                value={formState.brandColor || ''}
                onChange={handleInputChange}
                placeholder="#2563EB"
                className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Banner image URL
            <input
              type="url"
              name="bannerUrl"
              value={formState.bannerUrl}
              onChange={handleInputChange}
              placeholder="https://"
              className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Follower policy</p>
            <select
              name="followerPolicy"
              value={formState.followerPolicy}
              onChange={handleInputChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {FOLLOWER_POLICY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="autoAcceptFollowers"
                checked={Boolean(formState.autoAcceptFollowers)}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
              />
              Auto-approve new followers
            </label>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Connection policy</p>
            <select
              name="connectionPolicy"
              value={formState.connectionPolicy}
              onChange={handleInputChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {CONNECTION_POLICY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              Default connection message
              <textarea
                name="defaultConnectionMessage"
                rows={3}
                value={formState.defaultConnectionMessage}
                onChange={handleInputChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}

AgencyProfileEditForm.propTypes = {
  overview: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    headline: PropTypes.string,
    bio: PropTypes.string,
    missionStatement: PropTypes.string,
    timezone: PropTypes.string,
    location: PropTypes.string,
    agencyProfile: PropTypes.object,
  }),
  preferences: PropTypes.shape({
    brandColor: PropTypes.string,
    bannerUrl: PropTypes.string,
    followerPolicy: PropTypes.string,
    connectionPolicy: PropTypes.string,
    autoAcceptFollowers: PropTypes.bool,
  }),
  onSubmit: PropTypes.func,
  saving: PropTypes.bool,
};

AgencyProfileEditForm.defaultProps = {
  overview: undefined,
  preferences: undefined,
  onSubmit: undefined,
  saving: false,
};
