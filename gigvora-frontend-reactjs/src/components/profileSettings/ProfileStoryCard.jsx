import { SparklesIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

export default function ProfileStoryCard({ profileDraft, onProfileChange, canEdit }) {
  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Story</h3>
        <SparklesIcon className="h-6 w-6 text-accent" aria-hidden="true" />
      </header>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</span>
        <input
          type="text"
          value={profileDraft.headline}
          onChange={(event) => onProfileChange('headline', event.target.value)}
          placeholder="Product strategist &amp; growth advisor"
          disabled={!canEdit}
          maxLength={255}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mission statement</span>
        <textarea
          rows={2}
          value={profileDraft.missionStatement}
          onChange={(event) => onProfileChange('missionStatement', event.target.value)}
          disabled={!canEdit}
          maxLength={2000}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="I help mission-driven teams launch inclusive products and scalable service blueprints."
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</span>
        <textarea
          rows={4}
          value={profileDraft.bio}
          onChange={(event) => onProfileChange('bio', event.target.value)}
          disabled={!canEdit}
          maxLength={5000}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Share your impact, industries, and programs you lead."
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Education &amp; learning</span>
        <textarea
          rows={3}
          value={profileDraft.education}
          onChange={(event) => onProfileChange('education', event.target.value)}
          disabled={!canEdit}
          maxLength={2000}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Degrees, bootcamps, and signature learning programmes."
        />
      </label>

      <p className="text-xs text-slate-500">Share a short overview for anyone viewing your profile.</p>
    </section>
  );
}

ProfileStoryCard.propTypes = {
  profileDraft: PropTypes.shape({
    headline: PropTypes.string,
    missionStatement: PropTypes.string,
    bio: PropTypes.string,
    education: PropTypes.string,
  }).isRequired,
  onProfileChange: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
};

ProfileStoryCard.defaultProps = {
  canEdit: false,
};
