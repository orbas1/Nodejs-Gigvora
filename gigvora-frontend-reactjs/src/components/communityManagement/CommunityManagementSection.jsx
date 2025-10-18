import PropTypes from 'prop-types';
import GroupManagementPanel from './GroupManagementPanel.jsx';
import PageManagementPanel from './PageManagementPanel.jsx';

function StatCard({ label, value, description, tone = 'default' }) {
  const palette =
    tone === 'accent'
      ? 'border-accent/40 bg-accentSoft/70 text-accent'
      : tone === 'positive'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-white text-slate-700';

  return (
    <div className={`rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${palette}`}>
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  description: PropTypes.string,
  tone: PropTypes.oneOf(['default', 'accent', 'positive', 'warning']),
};

export default function CommunityManagementSection({ data, userId, onRefresh }) {
  const groups = data?.groups ?? { stats: {}, items: [], managed: [] };
  const pages = data?.pages ?? { stats: {}, items: [], managed: [] };
  const groupStats = groups.stats ?? {};
  const pageStats = pages.stats ?? {};

  const groupManagedCount = Number(groupStats.managed ?? 0);
  const pageManagedCount = Number(pageStats.managed ?? 0);
  const groupPendingInvites = Number(groupStats.pendingInvites ?? 0);
  const pagePendingInvites = Number(pageStats.pendingInvites ?? 0);

  return (
    <section
      id="community-management"
      className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-white to-accentSoft/30 p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Group &amp; Page management</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Launch new communities, keep branding assets aligned, publish announcements, and control role-based access without
            leaving your dashboard. Every tool below connects to the live API and supports create, update, and delete flows.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accentSoft px-3 py-1 font-semibold text-accent">
            {groupManagedCount + pageManagedCount} managed spaces
          </span>
          <span className="hidden rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-500 lg:inline-flex">
            {groupPendingInvites + pagePendingInvites} pending invites
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Groups" value={groupStats.total ?? 0} description="Total groups you belong to." />
        <StatCard
          label="Managed groups"
          value={groupManagedCount}
          description="Owner or moderator level access."
          tone={groupManagedCount > 0 ? 'accent' : 'default'}
        />
        <StatCard label="Pages" value={pageStats.total ?? 0} description="Brand and program pages." />
        <StatCard
          label="Managed pages"
          value={pageManagedCount}
          description="Owner or admin level access."
          tone={pageManagedCount > 0 ? 'positive' : 'default'}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GroupManagementPanel groups={groups} userId={userId} onRefresh={onRefresh} />
        <PageManagementPanel pages={pages} userId={userId} onRefresh={onRefresh} />
      </div>
    </section>
  );
}

CommunityManagementSection.propTypes = {
  data: PropTypes.shape({
    groups: PropTypes.shape({
      stats: PropTypes.object,
      items: PropTypes.array,
      managed: PropTypes.array,
    }),
    pages: PropTypes.shape({
      stats: PropTypes.object,
      items: PropTypes.array,
      managed: PropTypes.array,
    }),
  }),
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onRefresh: PropTypes.func,
};

CommunityManagementSection.defaultProps = {
  data: null,
  userId: null,
  onRefresh: undefined,
};
