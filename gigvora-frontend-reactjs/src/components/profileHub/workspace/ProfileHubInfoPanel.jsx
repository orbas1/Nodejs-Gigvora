import clsx from 'clsx';
import PropTypes from 'prop-types';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'members', label: 'Members' },
  { value: 'connections', label: 'Connections' },
  { value: 'private', label: 'Private' },
];

export default function ProfileHubInfoPanel({
  draft,
  onChange,
  onSave,
  saving,
  onOpenAdvanced,
  layout = 'default',
}) {
  const fieldClass = clsx(
    'mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-0',
    layout === 'modal' ? 'bg-white' : 'bg-white/80',
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">
          Name headline
          <input
            type="text"
            value={draft.headline}
            onChange={(event) => onChange('headline', event.target.value)}
            placeholder="Product strategist"
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-medium text-slate-600">
          Location
          <input
            type="text"
            value={draft.location}
            onChange={(event) => onChange('location', event.target.value)}
            placeholder="City, Country"
            className={fieldClass}
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">
          Timezone
          <input
            type="text"
            value={draft.timezone}
            onChange={(event) => onChange('timezone', event.target.value)}
            placeholder="Europe/London"
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-medium text-slate-600">
          Mission line
          <input
            type="text"
            value={draft.missionStatement}
            onChange={(event) => onChange('missionStatement', event.target.value)}
            placeholder="Share what you deliver"
            className={fieldClass}
          />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-600">
        Bio
        <textarea
          rows={4}
          value={draft.bio}
          onChange={(event) => onChange('bio', event.target.value)}
          placeholder="Keep it short and clear"
          className={clsx(fieldClass, 'resize-none')}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-600">
          Profile
          <select
            value={draft.profileVisibility}
            onChange={(event) => onChange('profileVisibility', event.target.value)}
            className={fieldClass}
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-600">
          Network
          <select
            value={draft.networkVisibility}
            onChange={(event) => onChange('networkVisibility', event.target.value)}
            className={fieldClass}
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-600">
          Followers
          <select
            value={draft.followersVisibility}
            onChange={(event) => onChange('followersVisibility', event.target.value)}
            className={fieldClass}
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center rounded-2xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onOpenAdvanced}
          className="inline-flex items-center rounded-2xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          Advanced editor
        </button>
      </div>
    </div>
  );
}

ProfileHubInfoPanel.propTypes = {
  draft: PropTypes.shape({
    headline: PropTypes.string,
    location: PropTypes.string,
    timezone: PropTypes.string,
    missionStatement: PropTypes.string,
    bio: PropTypes.string,
    profileVisibility: PropTypes.string,
    networkVisibility: PropTypes.string,
    followersVisibility: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  onOpenAdvanced: PropTypes.func.isRequired,
  layout: PropTypes.oneOf(['default', 'modal']),
};

ProfileHubInfoPanel.defaultProps = {
  saving: false,
  layout: 'default',
};
