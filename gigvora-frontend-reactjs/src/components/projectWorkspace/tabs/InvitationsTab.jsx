import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_FORM = {
  email: '',
  role: '',
  status: 'pending',
  invitedBy: '',
  expiresAt: '',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
];

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { dateStyle: 'medium' });
}

export default function InvitationsTab({ project, actions, canManage }) {
  const invitations = Array.isArray(project.invitations) ? project.invitations : [];
  const statusSummary = useMemo(() => {
    return STATUS_OPTIONS.map((option) => ({
      ...option,
      count: invitations.filter((invitation) => invitation.status === option.value).length,
    }));
  }, [invitations]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (event, setter) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const buildPayload = (payload) => ({
    email: payload.email,
    role: payload.role,
    status: payload.status,
    invitedBy: payload.invitedBy || undefined,
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt).toISOString() : undefined,
  });

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createInvitation(project.id, buildPayload(form));
      resetForm();
      setFeedback({ status: 'success', message: 'Invitation sent.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to send invitation.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (invitation) => {
    setEditingId(invitation.id);
    setEditingForm({
      email: invitation.email || '',
      role: invitation.role || '',
      status: invitation.status || 'pending',
      invitedBy: invitation.invitedBy || '',
      expiresAt: toDateInput(invitation.expiresAt),
    });
    setFeedback(null);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateInvitation(project.id, editingId, buildPayload(editingForm));
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Invitation updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update invitation.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (invitationId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteInvitation(project.id, invitationId);
      setFeedback({ status: 'success', message: 'Invitation removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove invitation.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.status === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statusSummary.map((status) => (
          <div key={status.value} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{status.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{status.count}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total invites</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{invitations.length}</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Invite collaborator</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm text-slate-700">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={(event) => handleChange(event, setForm)}
              required
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Role
            <input
              type="text"
              name="role"
              value={form.role}
              onChange={(event) => handleChange(event, setForm)}
              required
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Status
            <select
              name="status"
              value={form.status}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Invited by
            <input
              type="text"
              name="invitedBy"
              value={form.invitedBy}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Expires at
            <input
              type="date"
              name="expiresAt"
              value={form.expiresAt}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canManage || submitting}
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send invite
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Role
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Invited by
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Expires
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invitations.length ? (
              invitations.map((invitation) => (
                <tr key={invitation.id} className="bg-white">
                  <td className="px-4 py-3 text-slate-700">{invitation.email}</td>
                  <td className="px-4 py-3 text-slate-700">{invitation.role}</td>
                  <td className="px-4 py-3 text-slate-700">{invitation.status?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-700">{invitation.invitedBy || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(invitation.expiresAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(invitation)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(invitation.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-sm text-slate-500">
                  No invitations sent yet. Add collaborators to share workspace access.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId ? (
        <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h5 className="text-base font-semibold text-slate-900">Edit invitation</h5>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-700">
              Email
              <input
                type="email"
                name="email"
                value={editingForm.email}
                onChange={(event) => handleChange(event, setEditingForm)}
                required
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Role
              <input
                type="text"
                name="role"
                value={editingForm.role}
                onChange={(event) => handleChange(event, setEditingForm)}
                required
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Status
              <select
                name="status"
                value={editingForm.status}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Invited by
              <input
                type="text"
                name="invitedBy"
                value={editingForm.invitedBy}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Expires at
              <input
                type="date"
                name="expiresAt"
                value={editingForm.expiresAt}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-accent/40 hover:text-accent"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save invitation
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

InvitationsTab.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    invitations: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  actions: PropTypes.shape({
    createInvitation: PropTypes.func.isRequired,
    updateInvitation: PropTypes.func.isRequired,
    deleteInvitation: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

InvitationsTab.defaultProps = {
  canManage: true,
};
