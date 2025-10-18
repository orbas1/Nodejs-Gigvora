import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const INVITE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
];

const INITIAL_INVITE = {
  projectId: '',
  freelancerName: '',
  freelancerEmail: '',
  role: '',
  message: '',
  status: 'pending',
};

function ProjectInvitationsPanel({ entries, stats, projects, onSendInvitation, onUpdateInvitation, canManage }) {
  const [form, setForm] = useState(INITIAL_INVITE);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: project.title ?? `Project ${project.id}`,
      })),
    [projects],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(INITIAL_INVITE);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSendInvitation) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await onSendInvitation({
        projectId: form.projectId ? Number(form.projectId) : undefined,
        freelancerName: form.freelancerName,
        freelancerEmail: form.freelancerEmail || undefined,
        role: form.role || undefined,
        message: form.message || undefined,
        status: form.status,
      });
      setFeedback({ tone: 'success', message: 'Invite sent.' });
      resetForm();
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Unable to send invite.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (invitationId, status) => {
    if (!onUpdateInvitation) return;
    setUpdatingId(invitationId);
    setFeedback(null);
    try {
      await onUpdateInvitation(invitationId, { status });
      setFeedback({ tone: 'success', message: 'Invite updated.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Unable to update invite.' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Invites</h3>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Total {stats.total ?? entries.length}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Accepted {stats.accepted ?? 0}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Declined {stats.declined ?? 0}
          </span>
        </div>
      </div>

      {feedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            feedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Project
            <select
              name="projectId"
              value={form.projectId}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={!canManage || submitting}
            >
              <option value="">General</option>
              {projectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={!canManage || submitting}
            >
              {INVITE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Name
            <input
              name="freelancerName"
              value={form.freelancerName}
              onChange={handleChange}
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Jordan Rivera"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Email
            <input
              type="email"
              name="freelancerEmail"
              value={form.freelancerEmail}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="jordan@gigvora.com"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Role focus
            <input
              name="role"
              value={form.role}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Designer"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Message
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              className="min-h-[96px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Invite note"
              disabled={!canManage || submitting}
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={!canManage || submitting}
          >
            {submitting ? 'Sending…' : 'Send invite'}
          </button>
        </form>

        <div className="space-y-4">
          {entries.length ? (
            entries.map((invite) => {
              const isUpdating = updatingId === invite.id;
              return (
                <div key={invite.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{invite.freelancerName}</p>
                      <p className="text-xs text-slate-500">
                        {invite.role || 'Contributor'} · {invite.freelancerEmail || 'No email'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {INVITE_STATUSES.map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => handleStatusChange(invite.id, status.value)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            invite.status === status.value
                              ? 'bg-slate-900 text-white'
                              : 'border border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900'
                          }`}
                          disabled={!canManage || isUpdating}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Sent {invite.inviteSentAt ? formatAbsolute(invite.inviteSentAt) : '—'}</span>
                    <span>Status {invite.status?.replace(/_/g, ' ') ?? 'pending'}</span>
                    <span>
                      Response {invite.respondedAt ? formatRelativeTime(invite.respondedAt) : 'waiting'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No invites yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ProjectInvitationsPanel.propTypes = {
  entries: PropTypes.array.isRequired,
  stats: PropTypes.object,
  projects: PropTypes.array.isRequired,
  onSendInvitation: PropTypes.func,
  onUpdateInvitation: PropTypes.func,
  canManage: PropTypes.bool,
};

ProjectInvitationsPanel.defaultProps = {
  stats: {},
  onSendInvitation: undefined,
  onUpdateInvitation: undefined,
  canManage: false,
};

export default ProjectInvitationsPanel;
