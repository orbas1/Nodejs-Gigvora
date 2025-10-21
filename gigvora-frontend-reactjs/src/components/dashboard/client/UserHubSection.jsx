import PropTypes from 'prop-types';
import ProfileHubQuickPanel from '../../profileHub/ProfileHubQuickPanel.jsx';

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
};

StatCard.defaultProps = {
  hint: null,
};

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function HubList({ title, items }) {
  if (!items?.length) {
    return null;
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

HubList.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string),
};

HubList.defaultProps = {
  items: [],
};

export default function UserHubSection({
  profileOverview,
  profileHub,
  mentoring,
  community,
  websitePreferences,
}) {
  const mentoringSummary = mentoring?.summary ?? {};
  const communitySummary = community?.summary ?? community ?? {};
  const website = websitePreferences ?? {};
  const workspaceHighlights = Array.isArray(profileHub?.workspace?.highlights)
    ? profileHub.workspace.highlights.slice(0, 4)
    : [];
  const communityCallsToAction = Array.isArray(community?.recommendations)
    ? community.recommendations.slice(0, 4).map((item) => item.title ?? item)
    : [];

  const statItems = [
    {
      label: 'Upcoming mentor sessions',
      value: formatNumber(mentoringSummary.upcomingSessions ?? mentoringSummary.totalSessions ?? 0),
      hint: 'Stay ahead with prep briefs and agenda notes.',
    },
    {
      label: 'Community members',
      value: formatNumber(communitySummary.members ?? communitySummary.totalMembers ?? 0),
      hint: 'Engage your champions and alumni.',
    },
    {
      label: 'Active collaborations',
      value: formatNumber(profileHub?.collaborations?.active ?? profileHub?.collaborations ?? 0),
      hint: 'Document rooms and co-author spaces live.',
    },
    {
      label: 'Published artefacts',
      value: formatNumber(profileHub?.documents?.published ?? profileHub?.documents?.count ?? 0),
      hint: 'CVs, cases, and multimedia ready to share.',
    },
  ];

  const preferenceNotes = [];
  if (website.siteUrl) {
    preferenceNotes.push(`Website live at ${website.siteUrl}`);
  }
  if (website.brandColor) {
    preferenceNotes.push(`Brand colour ${website.brandColor}`);
  }
  if (website.embedConsent === false) {
    preferenceNotes.push('Embedded media requires consent updates.');
  }

  return (
    <section
      id="client-hub"
      className="space-y-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Hub</p>
          <h2 className="text-3xl font-semibold text-slate-900">Profile, community, and talent HQ</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Operate your brand, collaborations, and knowledge base in one hub with ready-to-share artefacts and live insights.
          </p>
        </div>
      </header>

      <ProfileHubQuickPanel profileOverview={profileOverview} profileHub={profileHub} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HubList title="Workspace highlights" items={workspaceHighlights} />
        <HubList title="Community moves" items={communityCallsToAction} />
        <HubList
          title="Website preferences"
          items={
            preferenceNotes.length
              ? preferenceNotes
              : ['Configure your site URL, brand colour, and embed controls in preferences.']
          }
        />
      </div>
    </section>
  );
}

UserHubSection.propTypes = {
  profileOverview: PropTypes.object,
  profileHub: PropTypes.object,
  mentoring: PropTypes.object,
  community: PropTypes.object,
  websitePreferences: PropTypes.object,
};

UserHubSection.defaultProps = {
  profileOverview: null,
  profileHub: null,
  mentoring: null,
  community: null,
  websitePreferences: null,
};
