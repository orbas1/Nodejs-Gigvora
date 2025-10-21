import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useCompanyProfileWorkspace } from '../../hooks/useCompanyProfileWorkspace.js';
import {
  addCompanyFollower,
  updateCompanyFollower,
  removeCompanyFollower,
  createCompanyConnection,
  updateCompanyConnection,
  removeCompanyConnection,
} from '../../services/companyProfile.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';
import { formatRelativeTime } from '../../utils/date.js';

const menuSections = COMPANY_DASHBOARD_MENU_SECTIONS;
const availableDashboards = ['company', 'agency', 'headhunter', 'user'];

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default function CompanyHubPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();

  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  const { profile, metrics, followers, connections, permissions, loading, error, lastUpdated, fromCache, refresh } =
    useCompanyProfileWorkspace({ enabled: isAuthenticated && isCompanyMember });

  const [followerForm, setFollowerForm] = useState({ email: '', status: 'active', notificationsEnabled: true, saving: false });
  const [connectionForm, setConnectionForm] = useState({ email: '', relationshipType: 'partner', status: 'active', notes: '', saving: false });
  const [connectionNotesDrafts, setConnectionNotesDrafts] = useState({});
  const [feedback, setFeedback] = useState(null);

  const canManageFollowers = permissions?.canManageFollowers ?? true;
  const canManageConnections = permissions?.canManageConnections ?? true;

  const followerList = useMemo(() => {
    return Array.isArray(followers) ? [...followers].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)) : [];
  }, [followers]);

  const connectionList = useMemo(() => {
    return Array.isArray(connections)
      ? [...connections].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      : [];
  }, [connections]);

  useEffect(() => {
    setConnectionNotesDrafts((current) => {
      const next = {};
      connectionList.forEach((connection) => {
        next[connection.id] = current[connection.id] ?? connection.notes ?? '';
      });
      return next;
    });
  }, [connectionList]);

  const statCards = useMemo(
    () => [
      { label: 'Followers', value: metrics.followersTotal ?? 0, helper: `${metrics.followersActive ?? 0} active` },
      { label: 'New followers (30d)', value: metrics.followersNew30d ?? 0 },
      { label: 'Connections', value: metrics.connectionsTotal ?? 0, helper: `${metrics.connectionsPending ?? 0} pending` },
      { label: 'Active connections', value: metrics.connectionsActive ?? 0 },
    ],
    [metrics],
  );

  const handleFollowerCreate = async (event) => {
    event.preventDefault();
    if (!canManageFollowers || !followerForm.email) {
      return;
    }
    setFeedback(null);
    setFollowerForm((current) => ({ ...current, saving: true }));
    try {
      await addCompanyFollower({
        email: followerForm.email,
        status: followerForm.status,
        notificationsEnabled: followerForm.notificationsEnabled,
      });
      setFollowerForm({ email: '', status: 'active', notificationsEnabled: true, saving: false });
      setFeedback({ type: 'success', message: 'Follower invited successfully.' });
      await refresh({ force: true });
    } catch (createError) {
      setFollowerForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: createError?.message ?? 'Unable to add follower.' });
    }
  };

  const handleFollowerUpdate = async (followerId, patch) => {
    if (!canManageFollowers || !followerId) {
      return;
    }
    setFeedback(null);
    try {
      await updateCompanyFollower(followerId, patch);
      setFeedback({ type: 'success', message: 'Follower updated.' });
      await refresh({ force: true });
    } catch (updateError) {
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to update follower.' });
    }
  };

  const handleFollowerRemove = async (followerId) => {
    if (!canManageFollowers || !followerId) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove follower access?')) {
      return;
    }
    setFeedback(null);
    try {
      await removeCompanyFollower(followerId);
      setFeedback({ type: 'success', message: 'Follower removed.' });
      await refresh({ force: true });
    } catch (removeError) {
      setFeedback({ type: 'error', message: removeError?.message ?? 'Unable to remove follower.' });
    }
  };

  const handleConnectionCreate = async (event) => {
    event.preventDefault();
    if (!canManageConnections || !connectionForm.email) {
      return;
    }
    setFeedback(null);
    setConnectionForm((current) => ({ ...current, saving: true }));
    try {
      await createCompanyConnection({
        targetEmail: connectionForm.email,
        relationshipType: connectionForm.relationshipType,
        status: connectionForm.status,
        notes: connectionForm.notes || undefined,
      });
      setConnectionForm({ email: '', relationshipType: 'partner', status: 'active', notes: '', saving: false });
      setFeedback({ type: 'success', message: 'Connection added.' });
      await refresh({ force: true });
    } catch (createError) {
      setConnectionForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: createError?.message ?? 'Unable to create connection.' });
    }
  };

  const handleConnectionUpdate = async (connectionId, patch) => {
    if (!canManageConnections || !connectionId) {
      return;
    }
    setFeedback(null);
    try {
      await updateCompanyConnection(connectionId, patch);
      setFeedback({ type: 'success', message: 'Connection updated.' });
      await refresh({ force: true });
    } catch (updateError) {
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to update connection.' });
    }
  };

  const handleConnectionRemove = async (connectionId) => {
    if (!canManageConnections || !connectionId) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this connection?')) {
      return;
    }
    setFeedback(null);
    try {
      await removeCompanyConnection(connectionId);
      setFeedback({ type: 'success', message: 'Connection removed.' });
      await refresh({ force: true });
    } catch (removeError) {
      setFeedback({ type: 'error', message: removeError?.message ?? 'Unable to remove connection.' });
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/hub' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Hub"
        subtitle="Collaborators & supporters"
        description="Manage followers, partners, and workspace collaborations from one hub."
        menuSections={menuSections}
        availableDashboards={availableDashboards}
      >
        <AccessDeniedPanel
          availableDashboards={memberships.filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Company hub"
      subtitle="Followers, partners, and workspace allies"
      description="Activate your advocates, track partner status, and keep collaboration signals fresh across Gigvora."
      menuSections={menuSections}
      availableDashboards={availableDashboards}
      profile={profile}
      activeMenuItem="company-hub"
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">Community & partners</h1>
            <p className="text-sm text-slate-600">
              Invite supporters, manage notifications, and document strategic relationships in one orchestrated view.
            </p>
          </div>
          <DataStatus loading={loading} error={error} lastUpdated={lastUpdated} fromCache={fromCache} onRefresh={() => refresh({ force: true })} />
        </div>

        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Followers</h2>
                <p className="text-sm text-slate-600">Invite employees, advisors, and brand champions to follow workspace updates.</p>
              </div>
            </header>
            <form className="space-y-3" onSubmit={handleFollowerCreate}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-600">
                  Email
                  <input
                    type="email"
                    value={followerForm.email}
                    onChange={(event) => setFollowerForm((current) => ({ ...current, email: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    required
                    disabled={!canManageFollowers || followerForm.saving}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Status
                  <select
                    value={followerForm.status}
                    onChange={(event) => setFollowerForm((current) => ({ ...current, status: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    disabled={!canManageFollowers || followerForm.saving}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </label>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={followerForm.notificationsEnabled}
                  onChange={(event) => setFollowerForm((current) => ({ ...current, notificationsEnabled: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                  disabled={!canManageFollowers || followerForm.saving}
                />
                Send digests and milestone alerts
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canManageFollowers || followerForm.saving}
              >
                {followerForm.saving ? 'Inviting…' : 'Invite follower'}
              </button>
            </form>

            <div className="space-y-3">
              {followerList.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                  No followers yet. Invite your hiring stakeholders to stay close to the action.
                </p>
              ) : (
                followerList.map((follower) => {
                  const followerName = follower.follower?.name ?? follower.follower?.email ?? follower.followerId;
                  return (
                    <div
                      key={follower.followerId}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{followerName}</p>
                        <p className="text-xs text-slate-500">{follower.follower?.email ?? 'Workspace member'}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          Updated {follower.updatedAt ? formatRelativeTime(follower.updatedAt) : 'recently'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={follower.status}
                          onChange={(event) => handleFollowerUpdate(follower.followerId, { status: event.target.value })}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                          disabled={!canManageFollowers}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleFollowerUpdate(follower.followerId, { notificationsEnabled: !follower.notificationsEnabled })}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            follower.notificationsEnabled
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border border-slate-200 bg-white text-slate-600'
                          }`}
                          disabled={!canManageFollowers}
                        >
                          {follower.notificationsEnabled ? 'Alerts on' : 'Alerts off'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFollowerRemove(follower.followerId)}
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                          disabled={!canManageFollowers}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Connections</h2>
                <p className="text-sm text-slate-600">Document agencies, partners, and internal sponsors collaborating on hiring.</p>
              </div>
            </header>
            <form className="space-y-3" onSubmit={handleConnectionCreate}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-600">
                  Contact email
                  <input
                    type="email"
                    value={connectionForm.email}
                    onChange={(event) => setConnectionForm((current) => ({ ...current, email: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    required
                    disabled={!canManageConnections || connectionForm.saving}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Relationship
                  <input
                    type="text"
                    value={connectionForm.relationshipType}
                    onChange={(event) => setConnectionForm((current) => ({ ...current, relationshipType: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    disabled={!canManageConnections || connectionForm.saving}
                  />
                </label>
              </div>
              <label className="text-sm font-semibold text-slate-600">
                Status
                <select
                  value={connectionForm.status}
                  onChange={(event) => setConnectionForm((current) => ({ ...current, status: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  disabled={!canManageConnections || connectionForm.saving}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="archived">Archived</option>
                  <option value="blocked">Blocked</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-600">
                Notes
                <textarea
                  value={connectionForm.notes}
                  onChange={(event) => setConnectionForm((current) => ({ ...current, notes: event.target.value }))}
                  className="mt-1 h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  disabled={!canManageConnections || connectionForm.saving}
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canManageConnections || connectionForm.saving}
              >
                {connectionForm.saving ? 'Saving…' : 'Add connection'}
              </button>
            </form>

            <div className="space-y-3">
              {connectionList.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                  No connections recorded. Document agencies, executive sponsors, and partners here.
                </p>
              ) : (
                connectionList.map((connection) => {
                  const name = connection.target?.name ?? connection.targetCompanyProfile?.companyName ?? connection.contactEmail;
                  return (
                    <div
                      key={connection.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">{connection.contactEmail ?? connection.target?.email ?? 'No email recorded'}</p>
                          {connection.targetCompanyProfile?.tagline ? (
                            <p className="text-xs text-slate-500">{connection.targetCompanyProfile.tagline}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={connection.status}
                            onChange={(event) => handleConnectionUpdate(connection.id, { status: event.target.value })}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                            disabled={!canManageConnections}
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="archived">Archived</option>
                            <option value="blocked">Blocked</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleConnectionRemove(connection.id)}
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                            disabled={!canManageConnections}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={connectionNotesDrafts[connection.id] ?? ''}
                        onChange={(event) =>
                          setConnectionNotesDrafts((current) => ({ ...current, [connection.id]: event.target.value }))
                        }
                        placeholder="Add context, goals, or follow-up actions"
                        className="h-20 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        disabled={!canManageConnections}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setConnectionNotesDrafts((current) => ({ ...current, [connection.id]: connection.notes ?? '' }))
                          }
                          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                          disabled={!canManageConnections || (connectionNotesDrafts[connection.id] ?? '') === (connection.notes ?? '')}
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleConnectionUpdate(connection.id, {
                              notes: connectionNotesDrafts[connection.id] ?? '',
                            })
                          }
                          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                          disabled={!canManageConnections || (connectionNotesDrafts[connection.id] ?? '') === (connection.notes ?? '')}
                        >
                          Save notes
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

CompanyHubPage.propTypes = {};

