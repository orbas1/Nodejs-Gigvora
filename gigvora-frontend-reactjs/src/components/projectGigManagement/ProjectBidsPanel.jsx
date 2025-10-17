import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute } from '../../utils/date.js';

const BID_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
];

const INITIAL_FORM = {
  projectId: '',
  title: '',
  vendorName: '',
  vendorEmail: '',
  amount: '',
  currency: 'USD',
  status: 'submitted',
  submittedAt: '',
  validUntil: '',
  notes: '',
};

function ProjectBidsPanel({ bids, stats, projects, onCreateBid, onUpdateBid, canManage }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [updatingBidId, setUpdatingBidId] = useState(null);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: project.title ?? `Project ${project.id}`,
      })),
    [projects],
  );

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onCreateBid) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await onCreateBid({
        projectId: form.projectId ? Number(form.projectId) : undefined,
        title: form.title,
        vendorName: form.vendorName,
        vendorEmail: form.vendorEmail || undefined,
        amount: form.amount ? Number(form.amount) : undefined,
        currency: form.currency,
        status: form.status,
        submittedAt: form.submittedAt || undefined,
        validUntil: form.validUntil || undefined,
        notes: form.notes || undefined,
      });
      setFeedback({ tone: 'success', message: 'Bid saved.' });
      resetForm();
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Unable to save bid.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (bidId, status) => {
    if (!onUpdateBid) return;
    setUpdatingBidId(bidId);
    setFeedback(null);
    try {
      await onUpdateBid(bidId, { status });
      setFeedback({ tone: 'success', message: 'Bid updated.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Unable to update bid.' });
    } finally {
      setUpdatingBidId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Bids</h3>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Total {stats.total ?? bids.length}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Shortlisted {stats.shortlisted ?? 0}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Awarded {stats.awarded ?? 0}
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Project
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleFormChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              >
                <option value="">Unassigned</option>
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
                onChange={handleFormChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              >
                {BID_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Bid title
            <input
              name="title"
              value={form.title}
              onChange={handleFormChange}
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Design sprint"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Vendor name
            <input
              name="vendorName"
              value={form.vendorName}
              onChange={handleFormChange}
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Studio"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Vendor email
            <input
              type="email"
              name="vendorEmail"
              value={form.vendorEmail}
              onChange={handleFormChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="hello@studio.com"
              disabled={!canManage || submitting}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Amount
              <input
                name="amount"
                value={form.amount}
                onChange={handleFormChange}
                type="number"
                min="0"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="7500"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Currency
              <select
                name="currency"
                value={form.currency}
                onChange={handleFormChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              >
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Submitted
              <input
                type="date"
                name="submittedAt"
                value={form.submittedAt}
                onChange={handleFormChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Valid until
              <input
                type="date"
                name="validUntil"
                value={form.validUntil}
                onChange={handleFormChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              className="min-h-[96px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Key inclusions"
              disabled={!canManage || submitting}
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={!canManage || submitting}
          >
            {submitting ? 'Saving…' : 'Record bid'}
          </button>
        </form>

        <div className="space-y-4">
          {bids.length ? (
            bids.map((bid) => {
              const isUpdating = updatingBidId === bid.id;
              return (
                <div key={bid.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{bid.title ?? 'Bid'}</p>
                      <p className="text-xs text-slate-500">
                        {bid.vendorName} · {bid.amount != null ? `${bid.currency ?? 'USD'} ${Number(bid.amount).toLocaleString()}` : 'Value pending'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {BID_STATUSES.map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => handleStatusUpdate(bid.id, status.value)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            bid.status === status.value
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
                    <span>Submitted {bid.submittedAt ? formatAbsolute(bid.submittedAt) : '—'}</span>
                    <span>Valid {bid.validUntil ? formatAbsolute(bid.validUntil) : '—'}</span>
                    <span>Status {bid.status?.replace(/_/g, ' ') ?? 'draft'}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No bids yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ProjectBidsPanel.propTypes = {
  bids: PropTypes.array.isRequired,
  stats: PropTypes.object,
  projects: PropTypes.array.isRequired,
  onCreateBid: PropTypes.func,
  onUpdateBid: PropTypes.func,
  canManage: PropTypes.bool,
};

ProjectBidsPanel.defaultProps = {
  stats: {},
  onCreateBid: undefined,
  onUpdateBid: undefined,
  canManage: false,
};

export default ProjectBidsPanel;
