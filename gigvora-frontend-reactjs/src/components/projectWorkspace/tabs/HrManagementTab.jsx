import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_FORM = {
  fullName: '',
  position: '',
  status: 'prospect',
  startDate: '',
  endDate: '',
  compensation: '',
  allocationPercent: '',
};

const STATUS_OPTIONS = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'offboarded', label: 'Offboarded' },
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

export default function HrManagementTab({ project, actions, canManage }) {
  const hrRecords = Array.isArray(project.hrRecords) ? project.hrRecords : [];
  const summary = useMemo(() => {
    const active = hrRecords.filter((record) => record.status === 'active').length;
    const prospects = hrRecords.filter((record) => record.status === 'prospect').length;
    const offboarded = hrRecords.filter((record) => record.status === 'offboarded').length;
    const totalComp = hrRecords.reduce((sum, record) => sum + Number(record.compensation ?? 0), 0);
    return {
      total: hrRecords.length,
      active,
      prospects,
      offboarded,
      totalComp,
    };
  }, [hrRecords]);

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
    fullName: payload.fullName,
    position: payload.position,
    status: payload.status,
    startDate: payload.startDate || undefined,
    endDate: payload.endDate || undefined,
    compensation: payload.compensation ? Number(payload.compensation) : undefined,
    allocationPercent: payload.allocationPercent ? Number(payload.allocationPercent) : undefined,
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
      await actions.createHrRecord(project.id, buildPayload(form));
      resetForm();
      setFeedback({ status: 'success', message: 'Team member recorded.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to record team member.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditingForm({
      fullName: record.fullName || '',
      position: record.position || '',
      status: record.status || 'prospect',
      startDate: toDateInput(record.startDate),
      endDate: toDateInput(record.endDate),
      compensation: record.compensation != null ? String(record.compensation) : '',
      allocationPercent: record.allocationPercent != null ? String(record.allocationPercent) : '',
    });
    setFeedback(null);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateHrRecord(project.id, editingId, buildPayload(editingForm));
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Team member updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update team member.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteHrRecord(project.id, recordId);
      setFeedback({ status: 'success', message: 'Team member removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove team member.' });
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Team members</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.active}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Prospects</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.prospects}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Annual compensation</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD' }).format(summary.totalComp)}
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Add team member</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm text-slate-700">
            Full name
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={(event) => handleChange(event, setForm)}
              required
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Position / role
            <input
              type="text"
              name="position"
              value={form.position}
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
            Start date
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            End date
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Compensation (USD)
            <input
              type="number"
              name="compensation"
              value={form.compensation}
              onChange={(event) => handleChange(event, setForm)}
              min={0}
              step="0.01"
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Allocation %
            <input
              type="number"
              name="allocationPercent"
              value={form.allocationPercent}
              onChange={(event) => handleChange(event, setForm)}
              min={0}
              max={100}
              step="0.1"
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
            Save team member
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Position
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Dates
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Allocation
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hrRecords.length ? (
              hrRecords.map((record) => (
                <tr key={record.id} className="bg-white">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{record.fullName}</p>
                    <p className="text-xs text-slate-500">{record.compensation ? `$${Number(record.compensation).toLocaleString()}` : '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{record.position}</td>
                  <td className="px-4 py-3 text-slate-600">{record.status?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(record.startDate)} → {formatDate(record.endDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {record.allocationPercent != null ? `${record.allocationPercent}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(record)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
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
                  No team records yet. Capture staffing details to manage onboarding and capacity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId ? (
        <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h5 className="text-base font-semibold text-slate-900">Edit team member</h5>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-700">
              Full name
              <input
                type="text"
                name="fullName"
                value={editingForm.fullName}
                onChange={(event) => handleChange(event, setEditingForm)}
                required
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Position / role
              <input
                type="text"
                name="position"
                value={editingForm.position}
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
              Start date
              <input
                type="date"
                name="startDate"
                value={editingForm.startDate}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              End date
              <input
                type="date"
                name="endDate"
                value={editingForm.endDate}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Compensation (USD)
              <input
                type="number"
                name="compensation"
                value={editingForm.compensation}
                onChange={(event) => handleChange(event, setEditingForm)}
                min={0}
                step="0.01"
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Allocation %
              <input
                type="number"
                name="allocationPercent"
                value={editingForm.allocationPercent}
                onChange={(event) => handleChange(event, setEditingForm)}
                min={0}
                max={100}
                step="0.1"
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
              Save changes
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

HrManagementTab.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    hrRecords: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  actions: PropTypes.shape({
    createHrRecord: PropTypes.func.isRequired,
    updateHrRecord: PropTypes.func.isRequired,
    deleteHrRecord: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

HrManagementTab.defaultProps = {
  canManage: true,
};
