import { useState } from 'react';

const ROLE_STATUSES = ['draft', 'active', 'backfill', 'closed'];
const INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired'];
const HR_STATUSES = ['planned', 'active', 'on_leave', 'completed'];
const TIME_ENTRY_STATUSES = ['draft', 'submitted', 'approved', 'rejected'];

export default function WorkspaceTeamTab({
  roleAssignments = [],
  invites = [],
  hrRecords = [],
  timeEntries = [],
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onCreateInvite,
  onUpdateInvite,
  onDeleteInvite,
  onCreateHr,
  onUpdateHr,
  onDeleteHr,
  onCreateTimeEntry,
  onUpdateTimeEntry,
  onDeleteTimeEntry,
}) {
  const [roleForm, setRoleForm] = useState(null);
  const [inviteForm, setInviteForm] = useState(null);
  const [hrForm, setHrForm] = useState(null);
  const [timeForm, setTimeForm] = useState(null);

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Roles & delegation</h2>
          <button
            type="button"
            onClick={() => setRoleForm({})}
            className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            {roleForm?.id ? 'Editing role…' : 'Add role'}
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {roleAssignments.map((role) => (
            <div key={role.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{role.roleName}</p>
                  <p className="text-xs text-slate-500">{role.description || 'No description'}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {role.memberName || 'Unassigned'} · {role.status?.replace(/_/g, ' ') ?? 'draft'} · {role.allocationPercent ?? 0}% allocation
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRoleForm({
                        id: role.id,
                        roleName: role.roleName ?? '',
                        description: role.description ?? '',
                        memberName: role.memberName ?? '',
                        memberEmail: role.memberEmail ?? '',
                        status: role.status ?? 'draft',
                        allocationPercent: role.allocationPercent ?? '',
                      })
                    }
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRole?.(role.id)}
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {roleAssignments.length === 0 ? (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No roles assigned yet.
            </div>
          ) : null}
        </div>

        {roleForm !== null ? (
          <form
            className="mt-6 grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!roleForm.roleName) {
                return;
              }
              const payload = {
                roleName: roleForm.roleName,
                description: roleForm.description,
                memberName: roleForm.memberName,
                memberEmail: roleForm.memberEmail,
                status: roleForm.status,
                allocationPercent: roleForm.allocationPercent,
              };
              if (roleForm.id) {
                onUpdateRole?.(roleForm.id, payload);
              } else {
                onCreateRole?.(payload);
              }
              setRoleForm(null);
            }}
          >
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role name
              <input
                type="text"
                value={roleForm.roleName ?? ''}
                onChange={(event) => setRoleForm((state) => ({ ...(state ?? {}), roleName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={roleForm.status ?? 'draft'}
                onChange={(event) => setRoleForm((state) => ({ ...(state ?? {}), status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {ROLE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Member name
              <input
                type="text"
                value={roleForm.memberName ?? ''}
                onChange={(event) => setRoleForm((state) => ({ ...(state ?? {}), memberName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Member email
              <input
                type="email"
                value={roleForm.memberEmail ?? ''}
                onChange={(event) => setRoleForm((state) => ({ ...(state ?? {}), memberEmail: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Allocation (%)
              <input
                type="number"
                min="0"
                max="100"
                value={roleForm.allocationPercent ?? ''}
                onChange={(event) => setRoleForm((state) => ({ ...(state ?? {}), allocationPercent: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
              <textarea
                value={roleForm.description ?? ''}
                onChange={(event) => setRoleForm((state) => ({ ...(state ?? {}), description: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRoleForm(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {roleForm.id ? 'Save role' : 'Add role'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Invites</h2>
          <button
            type="button"
            onClick={() => setInviteForm({ status: 'pending' })}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            {inviteForm?.id ? 'Editing invite…' : 'Send invite'}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {invites.map((invite) => (
            <div key={invite.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{invite.email}</p>
                <p className="text-xs text-slate-500">
                  {invite.role} · {invite.status?.replace(/_/g, ' ') ?? 'pending'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setInviteForm({
                      id: invite.id,
                      email: invite.email ?? '',
                      role: invite.role ?? '',
                      status: invite.status ?? 'pending',
                      invitedByName: invite.invitedByName ?? '',
                      invitedByEmail: invite.invitedByEmail ?? '',
                      message: invite.message ?? '',
                      invitedAt: invite.invitedAt ? invite.invitedAt.slice(0, 16) : '',
                      respondedAt: invite.respondedAt ? invite.respondedAt.slice(0, 16) : '',
                    })
                  }
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteInvite?.(invite.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {invites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No invitations sent.
            </div>
          ) : null}
        </div>

        {inviteForm !== null ? (
          <form
            className="mt-6 grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!inviteForm.email || !inviteForm.role) {
                return;
              }
              const payload = {
                email: inviteForm.email,
                role: inviteForm.role,
                status: inviteForm.status,
                invitedByName: inviteForm.invitedByName,
                invitedByEmail: inviteForm.invitedByEmail,
                message: inviteForm.message,
                invitedAt: inviteForm.invitedAt,
                respondedAt: inviteForm.respondedAt,
              };
              if (inviteForm.id) {
                onUpdateInvite?.(inviteForm.id, payload);
              } else {
                onCreateInvite?.(payload);
              }
              setInviteForm(null);
            }}
          >
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
              <input
                type="email"
                value={inviteForm.email ?? ''}
                onChange={(event) => setInviteForm((state) => ({ ...(state ?? {}), email: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
              <input
                type="text"
                value={inviteForm.role ?? ''}
                onChange={(event) => setInviteForm((state) => ({ ...(state ?? {}), role: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={inviteForm.status ?? 'pending'}
                onChange={(event) => setInviteForm((state) => ({ ...(state ?? {}), status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {INVITE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Invited by
              <input
                type="text"
                value={inviteForm.invitedByName ?? ''}
                onChange={(event) => setInviteForm((state) => ({ ...(state ?? {}), invitedByName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Invited at
              <input
                type="datetime-local"
                value={inviteForm.invitedAt ?? ''}
                onChange={(event) => setInviteForm((state) => ({ ...(state ?? {}), invitedAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Responded at
              <input
                type="datetime-local"
                value={inviteForm.respondedAt ?? ''}
                onChange={(event) => setInviteForm((state) => ({ ...(state ?? {}), respondedAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Message
              <textarea
                value={inviteForm.message ?? ''}
                onChange={(event) => setInviteForm((state) => ({ ...(state ?? {}), message: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setInviteForm(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {inviteForm.id ? 'Save invite' : 'Send invite'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">HR & staffing</h2>
          <button
            type="button"
            onClick={() => setHrForm({ status: 'planned', employmentType: 'contract' })}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            {hrForm?.id ? 'Editing record…' : 'Add team member'}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {hrRecords.map((record) => (
            <div key={record.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{record.memberName}</p>
                <p className="text-xs text-slate-500">
                  {record.roleTitle || 'Role TBD'} · {record.status?.replace(/_/g, ' ') ?? 'planned'} · {record.hourlyRate ? `$${record.hourlyRate}/h` : 'Rate TBD'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setHrForm({
                      id: record.id,
                      memberName: record.memberName ?? '',
                      roleTitle: record.roleTitle ?? '',
                      employmentType: record.employmentType ?? 'contract',
                      status: record.status ?? 'planned',
                      startDate: record.startDate ? record.startDate.slice(0, 10) : '',
                      endDate: record.endDate ? record.endDate.slice(0, 10) : '',
                      hourlyRate: record.hourlyRate ?? '',
                      weeklyCapacityHours: record.weeklyCapacityHours ?? '',
                      allocationPercent: record.allocationPercent ?? '',
                      notes: record.notes ?? '',
                    })
                  }
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteHr?.(record.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {hrRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No team members allocated.
            </div>
          ) : null}
        </div>

        {hrForm !== null ? (
          <form
            className="mt-6 grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!hrForm.memberName) {
                return;
              }
              const payload = {
                memberName: hrForm.memberName,
                roleTitle: hrForm.roleTitle,
                employmentType: hrForm.employmentType,
                status: hrForm.status,
                startDate: hrForm.startDate,
                endDate: hrForm.endDate,
                hourlyRate: hrForm.hourlyRate,
                weeklyCapacityHours: hrForm.weeklyCapacityHours,
                allocationPercent: hrForm.allocationPercent,
                notes: hrForm.notes,
              };
              if (hrForm.id) {
                onUpdateHr?.(hrForm.id, payload);
              } else {
                onCreateHr?.(payload);
              }
              setHrForm(null);
            }}
          >
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
              <input
                type="text"
                value={hrForm.memberName ?? ''}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), memberName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role title
              <input
                type="text"
                value={hrForm.roleTitle ?? ''}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), roleTitle: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Employment type
              <input
                type="text"
                value={hrForm.employmentType ?? 'contract'}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), employmentType: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={hrForm.status ?? 'planned'}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {HR_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start date
              <input
                type="date"
                value={hrForm.startDate ?? ''}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), startDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              End date
              <input
                type="date"
                value={hrForm.endDate ?? ''}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), endDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hourly rate
              <input
                type="number"
                step="0.01"
                min="0"
                value={hrForm.hourlyRate ?? ''}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), hourlyRate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Weekly capacity (hours)
              <input
                type="number"
                step="0.1"
                min="0"
                value={hrForm.weeklyCapacityHours ?? ''}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), weeklyCapacityHours: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Allocation (%)
              <input
                type="number"
                min="0"
                max="100"
                value={hrForm.allocationPercent ?? ''}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), allocationPercent: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
              <textarea
                value={hrForm.notes ?? ''}
                onChange={(event) => setHrForm((state) => ({ ...(state ?? {}), notes: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setHrForm(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {hrForm.id ? 'Save record' : 'Add record'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Hourly tracker</h2>
          <button
            type="button"
            onClick={() => setTimeForm({ status: 'submitted' })}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            {timeForm?.id ? 'Editing entry…' : 'Log time'}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {timeEntries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{entry.memberName}</p>
                <p className="text-xs text-slate-500">
                  {entry.entryDate} · {entry.hours ?? 0}h · {entry.status?.replace(/_/g, ' ') ?? 'submitted'}
                </p>
                {entry.notes ? <p className="mt-1 text-xs text-slate-500">{entry.notes}</p> : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTimeForm({
                      id: entry.id,
                      memberName: entry.memberName ?? '',
                      entryDate: entry.entryDate ?? '',
                      hours: entry.hours ?? '',
                      billable: entry.billable ?? true,
                      status: entry.status ?? 'submitted',
                      notes: entry.notes ?? '',
                      approvedByName: entry.approvedByName ?? '',
                    })
                  }
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTimeEntry?.(entry.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {timeEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No time entries yet.
            </div>
          ) : null}
        </div>

        {timeForm !== null ? (
          <form
            className="mt-6 grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!timeForm.memberName || !timeForm.entryDate) {
                return;
              }
              const payload = {
                memberName: timeForm.memberName,
                entryDate: timeForm.entryDate,
                hours: timeForm.hours,
                billable: timeForm.billable,
                status: timeForm.status,
                notes: timeForm.notes,
                approvedByName: timeForm.approvedByName,
              };
              if (timeForm.id) {
                onUpdateTimeEntry?.(timeForm.id, payload);
              } else {
                onCreateTimeEntry?.(payload);
              }
              setTimeForm(null);
            }}
          >
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Member name
              <input
                type="text"
                value={timeForm.memberName ?? ''}
                onChange={(event) => setTimeForm((state) => ({ ...(state ?? {}), memberName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Entry date
              <input
                type="date"
                value={timeForm.entryDate ?? ''}
                onChange={(event) => setTimeForm((state) => ({ ...(state ?? {}), entryDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hours
              <input
                type="number"
                step="0.1"
                min="0"
                value={timeForm.hours ?? ''}
                onChange={(event) => setTimeForm((state) => ({ ...(state ?? {}), hours: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={timeForm.status ?? 'submitted'}
                onChange={(event) => setTimeForm((state) => ({ ...(state ?? {}), status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {TIME_ENTRY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Billable
              <select
                value={String(timeForm.billable ?? true)}
                onChange={(event) => setTimeForm((state) => ({ ...(state ?? {}), billable: event.target.value === 'true' }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="true">Billable</option>
                <option value="false">Non-billable</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Approved by
              <input
                type="text"
                value={timeForm.approvedByName ?? ''}
                onChange={(event) => setTimeForm((state) => ({ ...(state ?? {}), approvedByName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
              <textarea
                value={timeForm.notes ?? ''}
                onChange={(event) => setTimeForm((state) => ({ ...(state ?? {}), notes: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTimeForm(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {timeForm.id ? 'Save entry' : 'Log time'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
