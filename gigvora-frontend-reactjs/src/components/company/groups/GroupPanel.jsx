import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'member', label: 'Member' },
  { value: 'guest', label: 'Guest' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
];

const DEFAULT_INVITE = { userId: '', role: 'member', status: 'invited', notes: '' };

function normalizeMembers(group) {
  if (!group) {
    return [];
  }
  const list = Array.isArray(group.members)
    ? group.members
    : Array.isArray(group.memberships)
    ? group.memberships
    : [];
  return list
    .map((membership) => {
      const member = membership.member ?? membership.user ?? {};
      const composedName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
      const resolvedName = member.name ?? composedName;
      return {
        id: membership.id ?? membership.membershipId ?? `${group.id}:${membership.userId}`,
        membershipId: membership.id ?? membership.membershipId ?? membership.id,
        userId: membership.userId ?? member.id,
        name:
          resolvedName && resolvedName.length
            ? resolvedName
            : `User #${membership.userId ?? member.id ?? ''}`,
        email: member.email ?? membership.email ?? null,
        role: membership.role ?? 'member',
        status: membership.status ?? 'pending',
        joinedAt: membership.joinedAt ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function GroupPanel({
  open,
  group,
  onClose,
  onSave,
  onInvite,
  onUpdateMember,
  onRemoveMember,
  status,
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    visibility: 'private',
    memberPolicy: 'request',
    avatarColor: '#2563eb',
  });
  const [inviteForm, setInviteForm] = useState(DEFAULT_INVITE);
  const [inviteStatus, setInviteStatus] = useState({ state: 'idle', message: null });
  const [memberDrafts, setMemberDrafts] = useState({});
  const [memberStatus, setMemberStatus] = useState({});

  useEffect(() => {
    if (group) {
      setForm({
        name: group.name ?? '',
        description: group.description ?? '',
        visibility: group.visibility ?? 'private',
        memberPolicy: group.memberPolicy ?? 'request',
        avatarColor: group.avatarColor ?? '#2563eb',
      });
      setInviteForm(DEFAULT_INVITE);
      setInviteStatus({ state: 'idle', message: null });
      setMemberDrafts({});
      setMemberStatus({});
    }
  }, [group]);

  const members = useMemo(() => normalizeMembers(group), [group]);

  if (!open || !group) {
    return null;
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    await onSave(group.id, form);
  };

  const handleInviteChange = (event) => {
    const { name, value } = event.target;
    setInviteForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    if (!inviteForm.userId?.toString().trim()) {
      setInviteStatus({ state: 'error', message: 'User ID required' });
      return;
    }
    setInviteStatus({ state: 'loading', message: null });
    try {
      await onInvite(group.id, {
        userId: Number.parseInt(inviteForm.userId, 10),
        role: inviteForm.role,
        status: inviteForm.status,
        notes: inviteForm.notes || undefined,
      });
      setInviteForm(DEFAULT_INVITE);
      setInviteStatus({ state: 'success', message: 'Invite sent' });
    } catch (error) {
      setInviteStatus({ state: 'error', message: error?.message ?? 'Unable to invite' });
    }
  };

  const handleMemberDraftChange = (membershipId, field, value) => {
    setMemberDrafts((previous) => ({
      ...previous,
      [membershipId]: {
        ...previous[membershipId],
        [field]: value,
      },
    }));
  };

  const updateMember = async (member) => {
    const membershipId = member.membershipId ?? member.id;
    const draft = memberDrafts[membershipId] ?? {};
    const payload = {
      role: draft.role ?? member.role,
      status: draft.status ?? member.status,
    };
    setMemberStatus((previous) => ({
      ...previous,
      [membershipId]: { state: 'loading', message: null },
    }));
    try {
      await onUpdateMember(group.id, membershipId, payload);
      setMemberStatus((previous) => ({
        ...previous,
        [membershipId]: { state: 'success', message: 'Updated' },
      }));
    } catch (error) {
      setMemberStatus((previous) => ({
        ...previous,
        [membershipId]: { state: 'error', message: error?.message ?? 'Unable to update' },
      }));
    }
  };

  const removeMember = async (member) => {
    const membershipId = member.membershipId ?? member.id;
    setMemberStatus((previous) => ({
      ...previous,
      [membershipId]: { state: 'loading', message: null },
    }));
    try {
      await onRemoveMember(group.id, membershipId);
      setMemberStatus((previous) => ({
        ...previous,
        [membershipId]: { state: 'success', message: 'Removed' },
      }));
    } catch (error) {
      setMemberStatus((previous) => ({
        ...previous,
        [membershipId]: { state: 'error', message: error?.message ?? 'Unable to remove' },
      }));
    }
  };

  const renderMemberStatus = (membershipId) => {
    const current = memberStatus[membershipId];
    if (!current || current.state === 'idle') {
      return null;
    }
    if (current.state === 'loading') {
      return <span className="text-xs font-semibold text-slate-400">Saving…</span>;
    }
    if (current.state === 'success') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <CheckCircleIcon className="h-4 w-4" /> {current.message ?? 'Saved'}
        </span>
      );
    }
    if (current.state === 'error') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
          <ExclamationCircleIcon className="h-4 w-4" /> {current.message ?? 'Error'}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div className="relative h-full w-full max-w-4xl overflow-y-auto bg-white px-8 py-10 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
        >
          <XMarkIcon className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <form onSubmit={handleSave} className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Group</p>
            <h2 className="text-2xl font-semibold text-slate-900">{group.name}</h2>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleFieldChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visibility</span>
              <select
                name="visibility"
                value={form.visibility}
                onChange={handleFieldChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="secret">Secret</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policy</span>
              <select
                name="memberPolicy"
                value={form.memberPolicy}
                onChange={handleFieldChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="open">Open</option>
                <option value="request">Request</option>
                <option value="invite">Invite</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Colour</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="avatarColor"
                  value={form.avatarColor}
                  onChange={handleFieldChange}
                  className="h-10 w-16 cursor-pointer rounded-2xl border border-slate-200"
                />
                <input
                  name="avatarColor"
                  value={form.avatarColor}
                  onChange={handleFieldChange}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFieldChange}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              disabled={status.state === 'loading'}
            >
              {status.state === 'loading' ? 'Saving…' : 'Save changes'}
            </button>
            {status.state === 'success' ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                <CheckCircleIcon className="h-5 w-5" /> {status.message ?? 'Saved'}
              </span>
            ) : null}
            {status.state === 'error' ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                <ExclamationCircleIcon className="h-5 w-5" /> {status.message ?? 'Unable to save'}
              </span>
            ) : null}
          </div>
        </form>

        <section className="mt-10 space-y-5">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">People</h3>
          </header>

          <form onSubmit={handleInviteSubmit} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 sm:grid-cols-5">
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</span>
              <input
                name="userId"
                value={inviteForm.userId}
                onChange={handleInviteChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
              <select
                name="role"
                value={inviteForm.role}
                onChange={handleInviteChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <select
                name="status"
                value={inviteForm.status}
                onChange={handleInviteChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
              <input
                name="notes"
                value={inviteForm.notes}
                onChange={handleInviteChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="sm:col-span-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                disabled={inviteStatus.state === 'loading'}
              >
                <UserPlusIcon className="h-4 w-4" />
                {inviteStatus.state === 'loading' ? 'Sending…' : 'Send invite'}
              </button>
              {inviteStatus.state === 'success' ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                  <CheckCircleIcon className="h-4 w-4" /> {inviteStatus.message}
                </span>
              ) : null}
              {inviteStatus.state === 'error' ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                  <ExclamationCircleIcon className="h-4 w-4" /> {inviteStatus.message}
                </span>
              ) : null}
            </div>
          </form>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {members.map((member) => {
                  const membershipId = member.membershipId ?? member.id;
                  return (
                    <tr key={membershipId} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        {member.email ? <div className="text-xs text-slate-500">{member.email}</div> : null}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={memberDrafts[membershipId]?.role ?? member.role}
                          onChange={(event) => handleMemberDraftChange(membershipId, 'role', event.target.value)}
                          className="w-full rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={memberDrafts[membershipId]?.status ?? member.status}
                          onChange={(event) => handleMemberDraftChange(membershipId, 'status', event.target.value)}
                          className="w-full rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="flex items-center justify-end gap-3 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => updateMember(member)}
                          className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMember(member)}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Remove
                        </button>
                        {renderMemberStatus(membershipId)}
                      </td>
                    </tr>
                  );
                })}
                {!members.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                      No members yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

GroupPanel.propTypes = {
  open: PropTypes.bool,
  group: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    description: PropTypes.string,
    visibility: PropTypes.string,
    memberPolicy: PropTypes.string,
    avatarColor: PropTypes.string,
    members: PropTypes.array,
    memberships: PropTypes.array,
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onInvite: PropTypes.func.isRequired,
  onUpdateMember: PropTypes.func.isRequired,
  onRemoveMember: PropTypes.func.isRequired,
  status: PropTypes.shape({
    state: PropTypes.string,
    message: PropTypes.string,
  }).isRequired,
};

GroupPanel.defaultProps = {
  open: false,
  group: null,
};
