import { useCallback, useEffect, useMemo, useState } from 'react';
import groupsService from '../../../services/groups.js';

const DEFAULT_FORM = {
  name: '',
  description: '',
  memberPolicy: 'request',
  visibility: 'private',
  avatarColor: '#2563eb',
};

const MEMBER_POLICIES = [
  { value: 'open', label: 'Open access' },
  { value: 'request', label: 'Request to join' },
  { value: 'invite', label: 'Invite only' },
];

const VISIBILITIES = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Workspace only' },
  { value: 'secret', label: 'Hidden' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${numeric.toFixed(0)}%`;
}

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(numeric));
}

export default function AdminGroupManagementPanel() {
  const [catalog, setCatalog] = useState({ loading: true, error: null, groups: [] });
  const [form, setForm] = useState(DEFAULT_FORM);
  const [createState, setCreateState] = useState({ status: 'idle', message: null });
  const [memberForms, setMemberForms] = useState({});
  const [memberState, setMemberState] = useState({});

  const loadGroups = useCallback(async () => {
    setCatalog((previous) => ({ ...previous, loading: true }));
    try {
      const response = await groupsService.fetchManagedGroups({ includeMembers: true, pageSize: 50 });
      setCatalog({ loading: false, error: null, groups: response?.data ?? [] });
    } catch (error) {
      setCatalog({ loading: false, error: error?.message ?? 'Unable to load groups.', groups: [] });
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setCreateState({ status: 'error', message: 'Name is required.' });
      return;
    }
    setCreateState({ status: 'loading', message: null });
    try {
      await groupsService.createGroup({ ...form });
      setCreateState({ status: 'success', message: 'Group created successfully.' });
      resetForm();
      await loadGroups();
    } catch (error) {
      setCreateState({ status: 'error', message: error?.message ?? 'Unable to create the group.' });
    }
  };

  const handleMemberFormChange = (groupId, field, value) => {
    setMemberForms((previous) => ({
      ...previous,
      [groupId]: {
        ...(previous[groupId] ?? { role: 'member', status: 'invited' }),
        [field]: value,
      },
    }));
  };

  const handleInviteMember = async (groupId) => {
    const formState = memberForms[groupId] ?? {};
    if (!formState.userId) {
      setMemberState((previous) => ({
        ...previous,
        [groupId]: { status: 'error', message: 'Provide a user ID to invite.' },
      }));
      return;
    }
    setMemberState((previous) => ({ ...previous, [groupId]: { status: 'loading', message: null } }));
    try {
      await groupsService.addMember(groupId, {
        userId: Number.parseInt(formState.userId, 10),
        role: formState.role,
        status: formState.status,
        notes: formState.notes,
      });
      setMemberForms((previous) => ({ ...previous, [groupId]: { role: 'member', status: 'invited', userId: '', notes: '' } }));
      setMemberState((previous) => ({ ...previous, [groupId]: { status: 'success', message: 'Invitation queued.' } }));
      await loadGroups();
    } catch (error) {
      setMemberState((previous) => ({
        ...previous,
        [groupId]: { status: 'error', message: error?.message ?? 'Unable to add member.' },
      }));
    }
  };

  const handleActivateMember = async (groupId, membershipId) => {
    setMemberState((previous) => ({ ...previous, [`${groupId}:${membershipId}`]: { status: 'loading' } }));
    try {
      await groupsService.updateMember(groupId, membershipId, { status: 'active' });
      setMemberState((previous) => ({ ...previous, [`${groupId}:${membershipId}`]: { status: 'success' } }));
      await loadGroups();
    } catch (error) {
      setMemberState((previous) => ({
        ...previous,
        [`${groupId}:${membershipId}`]: { status: 'error', message: error?.message ?? 'Unable to update member.' },
      }));
    }
  };

  const groups = useMemo(() => catalog.groups ?? [], [catalog.groups]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Community command centre</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Launch new circles, review membership pipelines, and keep every group aligned with enterprise guardrails.
          </p>
        </div>
        <button
          type="button"
          onClick={loadGroups}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
        >
          Refresh overview
        </button>
      </div>

      <form onSubmit={handleCreate} className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-inner sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="group-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Group name
          </label>
          <input
            id="group-name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Community Ops Council"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="group-description" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </label>
          <textarea
            id="group-description"
            name="description"
            value={form.description}
            onChange={handleFormChange}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={3}
            placeholder="A senior forum for shipping platform-wide rituals and playbooks."
          />
        </div>
        <div>
          <label htmlFor="group-visibility" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Visibility
          </label>
          <select
            id="group-visibility"
            name="visibility"
            value={form.visibility}
            onChange={handleFormChange}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {VISIBILITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="group-memberPolicy" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Membership policy
          </label>
          <select
            id="group-memberPolicy"
            name="memberPolicy"
            value={form.memberPolicy}
            onChange={handleFormChange}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {MEMBER_POLICIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="group-avatarColor" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Accent colour
          </label>
          <input
            id="group-avatarColor"
            name="avatarColor"
            value={form.avatarColor}
            onChange={handleFormChange}
            className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-2"
            type="color"
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={createState.status === 'loading'}
          >
            {createState.status === 'loading' ? 'Creating…' : 'Create group'}
          </button>
          {createState.status === 'error' ? (
            <span className="text-xs font-semibold text-red-600">{createState.message}</span>
          ) : null}
          {createState.status === 'success' ? (
            <span className="text-xs font-semibold text-emerald-600">{createState.message}</span>
          ) : null}
        </div>
      </form>

      <div className="mt-8 space-y-6">
        {catalog.loading && (
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Syncing community metrics…
          </div>
        )}
        {catalog.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">{catalog.error}</div>
        ) : null}
        {groups.map((group) => {
          const metrics = group.metrics ?? {};
          const memberships = Array.isArray(group.members)
            ? group.members
            : Array.isArray(group.memberships)
              ? group.memberships
              : [];
          const latestMembers = memberships.slice(0, 5);
          return (
            <div key={group.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.visibility ?? 'public'} · {group.memberPolicy ?? 'request'}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{group.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{group.description ?? 'No description provided.'}</p>
                </div>
                <div className="grid gap-2 text-center sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/60 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active members</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(metrics.activeMembers)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending reviews</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(metrics.pendingMembers)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Acceptance rate</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{formatPercent(metrics.acceptanceRate)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last member joined</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(metrics.lastMemberJoinedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(220px,1fr)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent members</p>
                  <ul className="mt-3 space-y-3 text-sm">
                    {latestMembers.length ? (
                      latestMembers.map((member) => (
                        <li key={member.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{member.member?.name ?? `User ${member.userId}`}</p>
                              <p className="text-xs text-slate-500">
                                {member.role ?? 'member'} · {member.status ?? 'pending'}
                              </p>
                            </div>
                            {member.status !== 'active' ? (
                              <button
                                type="button"
                                onClick={() => handleActivateMember(group.id, member.id)}
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                                disabled={memberState[`${group.id}:${member.id}`]?.status === 'loading'}
                              >
                                {memberState[`${group.id}:${member.id}`]?.status === 'loading' ? 'Approving…' : 'Approve'}
                              </button>
                            ) : null}
                          </div>
                          {memberState[`${group.id}:${member.id}`]?.status === 'error' ? (
                            <p className="mt-2 text-xs font-semibold text-red-600">
                              {memberState[`${group.id}:${member.id}`]?.message ?? 'Unable to update membership.'}
                            </p>
                          ) : null}
                        </li>
                      ))
                    ) : (
                      <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                        No members to display yet.
                      </li>
                    )}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add member by ID</p>
                  <div className="mt-3 space-y-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      placeholder="User ID"
                      value={memberForms[group.id]?.userId ?? ''}
                      onChange={(event) => handleMemberFormChange(group.id, 'userId', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <select
                      value={memberForms[group.id]?.role ?? 'member'}
                      onChange={(event) => handleMemberFormChange(group.id, 'role', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="owner">Owner</option>
                      <option value="moderator">Moderator</option>
                      <option value="member">Member</option>
                      <option value="observer">Observer</option>
                    </select>
                    <select
                      value={memberForms[group.id]?.status ?? 'invited'}
                      onChange={(event) => handleMemberFormChange(group.id, 'status', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="invited">Invited</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <textarea
                      rows={2}
                      placeholder="Notes for moderators"
                      value={memberForms[group.id]?.notes ?? ''}
                      onChange={(event) => handleMemberFormChange(group.id, 'notes', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleInviteMember(group.id)}
                      className="w-full rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      disabled={memberState[group.id]?.status === 'loading'}
                    >
                      {memberState[group.id]?.status === 'loading' ? 'Adding…' : 'Add member'}
                    </button>
                    {memberState[group.id]?.status === 'error' ? (
                      <p className="text-xs font-semibold text-red-600">{memberState[group.id]?.message}</p>
                    ) : null}
                    {memberState[group.id]?.status === 'success' ? (
                      <p className="text-xs font-semibold text-emerald-600">{memberState[group.id]?.message}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
