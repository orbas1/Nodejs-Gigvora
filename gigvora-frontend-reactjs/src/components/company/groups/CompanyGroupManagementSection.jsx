import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../DataStatus.jsx';
import GroupStats from './GroupStats.jsx';
import GroupGrid from './GroupGrid.jsx';
import GroupPanel from './GroupPanel.jsx';
import GroupWizard from './GroupWizard.jsx';
import {
  fetchManagedGroups,
  createGroup,
  addMember,
  updateMember,
  removeMember,
  updateGroup,
} from '../../../services/groups.js';

const TABS = [
  { id: 'group-overview', label: 'Overview' },
  { id: 'group-collection', label: 'Groups' },
  { id: 'group-create', label: 'New' },
];

function computeMetrics(groups) {
  if (!Array.isArray(groups)) {
    return { total: 0, active: 0, pending: 0, privateCount: 0 };
  }

  return groups.reduce(
    (totals, group) => {
      const members = Array.isArray(group.members)
        ? group.members
        : Array.isArray(group.memberships)
        ? group.memberships
        : [];
      const active = members.filter((member) => (member.status ?? 'pending') === 'active').length;
      const pending = members.filter((member) => (member.status ?? 'pending') !== 'active').length;
      return {
        total: totals.total + 1,
        active: totals.active + active,
        pending: totals.pending + pending,
        privateCount: totals.privateCount + (group.visibility === 'public' ? 0 : 1),
      };
    },
    { total: 0, active: 0, pending: 0, privateCount: 0 },
  );
}

function resolveGroupFromResponse(response) {
  if (!response) {
    return null;
  }
  if (response.data && !Array.isArray(response.data) && response.data.id) {
    return response.data;
  }
  if (response.id) {
    return response;
  }
  if (response.group?.id) {
    return response.group;
  }
  return null;
}

export default function CompanyGroupManagementSection() {
  const [state, setState] = useState({ loading: true, error: null, groups: [] });
  const [view, setView] = useState(TABS[0].id);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [panelStatus, setPanelStatus] = useState({ state: 'idle', message: null });

  const loadGroups = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true }));
    try {
      const response = await fetchManagedGroups({ includeMembers: true, limit: 250 });
      const groups = Array.isArray(response?.data) ? response.data : [];
      setState({ loading: false, error: null, groups });
    } catch (error) {
      setState({ loading: false, error, groups: [] });
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const metrics = useMemo(() => computeMetrics(state.groups), [state.groups]);
  const sortedGroups = useMemo(() => {
    return [...state.groups].sort((a, b) => {
      const aActive = a.metrics?.activeMembers ?? a.metrics?.totalMembers ?? 0;
      const bActive = b.metrics?.activeMembers ?? b.metrics?.totalMembers ?? 0;
      return bActive - aActive;
    });
  }, [state.groups]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) {
      return null;
    }
    return state.groups.find((group) => group.id === selectedGroupId) ?? null;
  }, [selectedGroupId, state.groups]);

  const handleCreateGroup = useCallback(
    async (payload) => {
      const response = await createGroup(payload);
      const created = resolveGroupFromResponse(response);
      await loadGroups();
      return created ?? null;
    },
    [loadGroups],
  );

  const handleInviteMember = useCallback(
    async (groupId, payload) => {
      await addMember(groupId, payload);
      await loadGroups();
    },
    [loadGroups],
  );

  const handleUpdateMember = useCallback(
    async (groupId, membershipId, payload) => {
      await updateMember(groupId, membershipId, payload);
      await loadGroups();
    },
    [loadGroups],
  );

  const handleRemoveMember = useCallback(
    async (groupId, membershipId) => {
      await removeMember(groupId, membershipId);
      await loadGroups();
    },
    [loadGroups],
  );

  const handleSaveGroup = useCallback(
    async (groupId, payload) => {
      setPanelStatus({ state: 'loading', message: null });
      try {
        const response = await updateGroup(groupId, payload);
        const updated = resolveGroupFromResponse(response);
        await loadGroups();
        setPanelStatus({ state: 'success', message: 'Saved' });
        return updated ?? null;
      } catch (error) {
        setPanelStatus({ state: 'error', message: error?.message ?? 'Unable to save' });
        throw error;
      }
    },
    [loadGroups],
  );

  const openPanel = useCallback(
    (groupId) => {
      setSelectedGroupId(groupId);
      setPanelOpen(true);
      setPanelStatus({ state: 'idle', message: null });
    },
    [],
  );

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setPanelStatus({ state: 'idle', message: null });
  }, []);

  const handleWizardComplete = useCallback(
    (group) => {
      if (group?.id) {
        setView('group-collection');
        setSelectedGroupId(group.id);
        setPanelOpen(true);
      } else {
        setView('group-collection');
      }
    },
    [],
  );

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-100 p-1">
          {TABS.map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={[
                  'rounded-full px-4 py-1.5 text-sm font-semibold transition',
                  active ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadGroups}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setView('group-create')}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            New group
          </button>
        </div>
      </div>

      <section id="group-overview" hidden={view !== 'group-overview'} className="h-full">
        {state.loading ? (
          <DataStatus state="loading" title="Loading groups" />
        ) : state.error ? (
          <DataStatus
            state="error"
            title="Could not load groups"
            description={state.error?.message ?? 'Please try refreshing.'}
            onRetry={loadGroups}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <GroupStats metrics={metrics} />
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Top groups</h3>
                  <button
                    type="button"
                    onClick={() => setView('group-collection')}
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    View all
                  </button>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {sortedGroups.slice(0, 4).map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => openPanel(group.id)}
                      className="group flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-blue-200 hover:bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{group.name}</span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                          {group.metrics?.activeMembers ?? group.metrics?.totalMembers ?? 0} active
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-white px-2 py-0.5">{group.visibility ?? 'private'}</span>
                        <span className="rounded-full bg-white px-2 py-0.5">{group.memberPolicy ?? 'request'}</span>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        Updated {group.updatedAt ? new Date(group.updatedAt).toLocaleDateString() : 'recently'}
                      </div>
                    </button>
                  ))}
                  {!sortedGroups.length ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                      No groups yet. Create one to get started.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section id="group-collection" hidden={view !== 'group-collection'} className="h-full">
        <GroupGrid
          loading={state.loading}
          error={state.error}
          groups={sortedGroups}
          onReload={loadGroups}
          onOpen={openPanel}
        />
      </section>

      <section id="group-create" hidden={view !== 'group-create'} className="h-full">
        <GroupWizard
          onCreate={handleCreateGroup}
          onInvite={handleInviteMember}
          onComplete={handleWizardComplete}
        />
      </section>

      <GroupPanel
        open={panelOpen && Boolean(selectedGroup)}
        group={selectedGroup}
        onClose={closePanel}
        onSave={handleSaveGroup}
        onInvite={handleInviteMember}
        onUpdateMember={handleUpdateMember}
        onRemoveMember={handleRemoveMember}
        status={panelStatus}
      />
    </div>
  );
}
