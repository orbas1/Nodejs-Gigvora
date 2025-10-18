import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const SUBMISSION_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString();
  } catch (error) {
    return '—';
  }
}

const INITIAL_FORM = {
  title: '',
  description: '',
  assetUrl: '',
  status: 'submitted',
};

export default function GigSubmissionsSection({ orderDetail, onCreateSubmission, onUpdateSubmission, pending }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState(null);
  const submissions = useMemo(() => orderDetail?.submissions ?? [], [orderDetail]);

  if (!orderDetail) {
    return (
      <section id="agency-gig-submissions" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Proofs</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Proofs</h2>
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
          Pick a gig to review submissions.
        </p>
      </section>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setFeedback({ status: 'error', message: 'Add a title.' });
      return;
    }
    try {
      await onCreateSubmission?.({
        title: form.title,
        description: form.description || undefined,
        assetUrl: form.assetUrl || undefined,
        status: form.status,
      });
      setForm(INITIAL_FORM);
      setFeedback({ status: 'success', message: 'Logged.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message ?? 'Unable to record submission.' });
    }
  };

  const handleStatusChange = async (submissionId, status) => {
    try {
      await onUpdateSubmission?.(submissionId, { status });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message ?? 'Unable to update submission.' });
    }
  };

  return (
    <section id="agency-gig-submissions" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Proofs</p>
          <h2 className="text-3xl font-semibold text-slate-900">{orderDetail.serviceName}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {submissions.length}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
              No submissions yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {submissions.map((submission) => (
                <div key={submission.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{submission.title}</p>
                      {submission.description ? (
                        <p className="mt-1 text-xs text-slate-500">{submission.description}</p>
                      ) : null}
                      {submission.assetUrl ? (
                        <a
                          href={submission.assetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-accent hover:text-accentDark"
                        >
                          View asset
                        </a>
                      ) : null}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{formatDate(submission.submittedAt)}</p>
                      {submission.approvedAt ? <p>Approved {formatDate(submission.approvedAt)}</p> : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                      {submission.status?.replace(/_/g, ' ')}
                    </span>
                    <select
                      value={submission.status}
                      onChange={(event) => handleStatusChange(submission.id, event.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm focus:border-accent focus:outline-none"
                    >
                      {SUBMISSION_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-sm font-semibold text-slate-900">Record submission</p>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Title
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Sprint demo deck"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Highlights or review notes"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Asset link
            <input
              name="assetUrl"
              value={form.assetUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {SUBMISSION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {feedback ? (
            <div
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                feedback.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

GigSubmissionsSection.propTypes = {
  orderDetail: PropTypes.shape({
    serviceName: PropTypes.string,
    submissions: PropTypes.arrayOf(PropTypes.object),
  }),
  onCreateSubmission: PropTypes.func,
  onUpdateSubmission: PropTypes.func,
  pending: PropTypes.bool,
};

GigSubmissionsSection.defaultProps = {
  orderDetail: null,
  onCreateSubmission: undefined,
  onUpdateSubmission: undefined,
  pending: false,
};
