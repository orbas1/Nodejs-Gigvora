import PropTypes from 'prop-types';
import UserAvatar from '../UserAvatar.jsx';
import { formatStatusLabel } from '../userNetworking/utils.js';

function HighlightCard({ title, value, description }) {
  return (
    <article className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
    </article>
  );
}

HighlightCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string,
};

HighlightCard.defaultProps = {
  description: '',
};

function StatPill({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-surfaceMuted/60 px-3 py-2 text-left shadow-sm">
      <p className="font-semibold text-slate-700">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      {helper ? <p className="mt-1 text-[11px] text-slate-400">{helper}</p> : null}
    </div>
  );
}

StatPill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
};

StatPill.defaultProps = {
  helper: undefined,
};

function formatList(values) {
  return values.map((entry) => formatStatusLabel(entry));
}

export default function ProfileOverview({
  profile,
  profileNumber,
  impactHighlights,
  statCards,
  statusFlags,
  volunteerBadges,
  areasOfFocus,
  canEdit,
  editDisabled,
  onEdit,
  profileLink,
}) {
  const formattedStatusFlags = formatList(statusFlags);
  const formattedVolunteerBadges = formatList(volunteerBadges);

  return (
    <section className="grid items-start gap-10 rounded-4xl border border-slate-200/70 bg-white/80 p-10 shadow-xl backdrop-blur lg:grid-cols-[auto,1fr]">
      <div className="space-y-4 text-center lg:text-left">
        <UserAvatar
          name={profile?.name}
          imageUrl={profile?.avatarUrl}
          seed={profile?.avatarSeed ?? profile?.name}
          size="lg"
          className="mx-auto lg:mx-0"
        />
        <div>
          {profileNumber ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">Profile #{profileNumber}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{profile?.name ?? 'Gigvora member'}</h1>
          {profile?.headline ? <p className="mt-2 text-base text-slate-600">{profile.headline}</p> : null}
          {profile?.location ? <p className="mt-2 text-sm text-slate-500">{profile.location}</p> : null}
        </div>
        {(formattedStatusFlags.length || formattedVolunteerBadges.length) && (
          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 lg:justify-start">
            {formattedStatusFlags.map((flag) => (
              <span key={`flag:${flag}`} className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                {flag}
              </span>
            ))}
            {formattedVolunteerBadges.map((badge) => (
              <span key={`badge:${badge}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                {badge}
              </span>
            ))}
          </div>
        )}
        {areasOfFocus.length ? (
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500 lg:justify-start">
            {areasOfFocus.map((area) => (
              <span key={area} className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-accent">
                {area}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
          {canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              disabled={editDisabled}
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {editDisabled ? 'Saving…' : 'Edit profile'}
            </button>
          ) : null}
          {profileLink ? (
            <a
              href={profileLink}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              View public profile
            </a>
          ) : null}
        </div>
      </div>
      <div className="space-y-6">
        <article className="rounded-3xl border border-slate-200/80 bg-surfaceMuted/70 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mission</h2>
          <p className="mt-3 text-sm text-slate-700">{profile?.missionStatement ?? profile?.bio ?? 'Share a mission statement to frame your story.'}</p>
        </article>
        {impactHighlights.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {impactHighlights.map((highlight) => (
              <HighlightCard
                key={`${highlight.title}-${highlight.value}`}
                title={highlight.title}
                value={highlight.value}
                description={highlight.description}
              />
            ))}
          </div>
        ) : null}
        {statCards.length ? (
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {statCards.map((stat) => (
              <StatPill key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

ProfileOverview.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    headline: PropTypes.string,
    location: PropTypes.string,
    missionStatement: PropTypes.string,
    bio: PropTypes.string,
    avatarUrl: PropTypes.string,
    avatarSeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  profileNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  impactHighlights: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      description: PropTypes.string,
    }),
  ),
  statCards: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      helper: PropTypes.string,
    }),
  ),
  statusFlags: PropTypes.arrayOf(PropTypes.string),
  volunteerBadges: PropTypes.arrayOf(PropTypes.string),
  areasOfFocus: PropTypes.arrayOf(PropTypes.string),
  canEdit: PropTypes.bool,
  editDisabled: PropTypes.bool,
  onEdit: PropTypes.func,
  profileLink: PropTypes.string,
};

ProfileOverview.defaultProps = {
  profile: undefined,
  profileNumber: undefined,
  impactHighlights: [],
  statCards: [],
  statusFlags: [],
  volunteerBadges: [],
  areasOfFocus: [],
  canEdit: false,
  editDisabled: false,
  onEdit: undefined,
  profileLink: undefined,
};
