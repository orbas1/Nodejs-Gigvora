import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function formatParticipantName(participant) {
  if (participant.fullName) return participant.fullName;
  if (participant.user?.name) return participant.user.name;
  if (participant.email) return participant.email;
  return `Participant #${participant.id}`;
}

export default function SpeedNetworkingParticipantManager({
  session,
  catalog,
  onCreate,
  onUpdate,
  onDelete,
  busy,
}) {
  const participants = session?.participants ?? [];
  const rooms = session?.rooms ?? [];

  const roleOptions = useMemo(() => catalog?.participantRoles ?? [], [catalog?.participantRoles]);
  const statusOptions = useMemo(() => catalog?.participantStatuses ?? [], [catalog?.participantStatuses]);

  const [drafts, setDrafts] = useState({});
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', role: roleOptions?.[0]?.value ?? 'attendee', status: statusOptions?.[0]?.value ?? 'invited', assignedRoomId: '' });
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    setDrafts(() =>
      participants.reduce((acc, participant) => {
        acc[participant.id] = {
          role: participant.role,
          status: participant.status,
          assignedRoomId: participant.assignedRoom?.id ? String(participant.assignedRoom.id) : '',
        };
        return acc;
      }, {}),
    );
  }, [participants]);

  useEffect(() => {
    setCreateForm((current) => ({
      ...current,
      role: current.role ?? roleOptions?.[0]?.value ?? 'attendee',
      status: current.status ?? statusOptions?.[0]?.value ?? 'invited',
    }));
  }, [roleOptions, statusOptions]);

  const handleDraftChange = (id, patch) => {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  };

  const handleSave = (participant) => {
    const draft = drafts[participant.id] ?? {};
    onUpdate(participant.id, {
      role: draft.role,
      status: draft.status,
      assignedRoomId: draft.assignedRoomId ? Number(draft.assignedRoomId) : null,
    });
  };

  const handleCreate = (event) => {
    event.preventDefault();
    if (!createForm.fullName?.trim() && !createForm.email?.trim()) {
      setCreateError('Name or email is required.');
      return;
    }
    setCreateError(null);
    onCreate({
      fullName: createForm.fullName?.trim() || null,
      email: createForm.email?.trim() || null,
      role: createForm.role,
      status: createForm.status,
      assignedRoomId: createForm.assignedRoomId ? Number(createForm.assignedRoomId) : null,
    });
    setCreateForm({ fullName: '', email: '', role: createForm.role, status: createForm.status, assignedRoomId: '' });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Participants</h2>
          <p className="text-sm text-slate-500">Manage invitations, assignments, and attendance status.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{participants.length} total</span>
      </header>

      <div className="mt-4 space-y-4">
        {!participants.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
            No participants added yet. Use the form below to invite attendees.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Participant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Room</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {participants.map((participant) => {
                  const draft = drafts[participant.id] ?? {};
                  return (
                    <tr key={participant.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{formatParticipantName(participant)}</span>
                          <span className="text-xs text-slate-500">{participant.email || participant.user?.email || 'Email unavailable'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={draft.role}
                          onChange={(event) => handleDraftChange(participant.id, { role: event.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={draft.status}
                          onChange={(event) => handleDraftChange(participant.id, { status: event.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={draft.assignedRoomId}
                          onChange={(event) => handleDraftChange(participant.id, { assignedRoomId: event.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          <option value="">Lobby</option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleSave(participant)}
                            disabled={busy}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(participant.id)}
                            disabled={busy}
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Add participant</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Full name</span>
              <input
                type="text"
                value={createForm.fullName}
                onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</span>
              <input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Role</span>
              <select
                value={createForm.role}
                onChange={(event) => setCreateForm((current) => ({ ...current, role: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</span>
              <select
                value={createForm.status}
                onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Room assignment</span>
              <select
                value={createForm.assignedRoomId}
                onChange={(event) => setCreateForm((current) => ({ ...current, assignedRoomId: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">Lobby</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {createError ? <p className="text-xs text-rose-600">{createError}</p> : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Add participant'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

SpeedNetworkingParticipantManager.propTypes = {
  session: PropTypes.shape({
    participants: PropTypes.array,
    rooms: PropTypes.array,
  }),
  catalog: PropTypes.shape({
    participantRoles: PropTypes.array,
    participantStatuses: PropTypes.array,
  }),
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  busy: PropTypes.bool,
};

SpeedNetworkingParticipantManager.defaultProps = {
  session: null,
  catalog: null,
  busy: false,
};
