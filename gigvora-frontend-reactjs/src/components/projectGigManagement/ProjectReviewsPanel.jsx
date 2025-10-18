import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute } from '../../utils/date.js';

const REVIEW_SUBJECT_TYPES = [
  { value: 'vendor', label: 'Vendor' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'project', label: 'Project' },
];

const INITIAL_REVIEW_FORM = {
  subjectType: 'vendor',
  subjectName: '',
  ratingOverall: '5',
  ratingQuality: '5',
  ratingCommunication: '5',
  ratingProfessionalism: '5',
  wouldRecommend: true,
  comments: '',
  projectId: '',
  orderId: '',
};

function ProjectReviewsPanel({ entries, summary, projects, orders, onCreateReview, canManage }) {
  const [form, setForm] = useState(INITIAL_REVIEW_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({ value: project.id, label: project.title ?? `Project ${project.id}` })),
    [projects],
  );

  const orderOptions = useMemo(
    () =>
      orders.map((order) => ({
        value: order.id,
        label: `${order.gig?.title ?? order.serviceName ?? 'Order'} (${order.orderNumber ?? order.id})`,
      })),
    [orders],
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onCreateReview) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await onCreateReview({
        subjectType: form.subjectType,
        subjectName: form.subjectName,
        ratingOverall: Number(form.ratingOverall),
        ratingQuality: form.ratingQuality ? Number(form.ratingQuality) : undefined,
        ratingCommunication: form.ratingCommunication ? Number(form.ratingCommunication) : undefined,
        ratingProfessionalism: form.ratingProfessionalism ? Number(form.ratingProfessionalism) : undefined,
        wouldRecommend: Boolean(form.wouldRecommend),
        comments: form.comments || undefined,
        projectId: form.projectId ? Number(form.projectId) : undefined,
        orderId: form.orderId ? Number(form.orderId) : undefined,
      });
      setFeedback({ tone: 'success', message: 'Review added.' });
      setForm(INITIAL_REVIEW_FORM);
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Unable to add review.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Reviews</h3>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Total {summary.total ?? entries.length}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Avg {summary.averageOverall != null ? Number(summary.averageOverall).toFixed(1) : '—'} / 5
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Recommend {summary.recommended ?? 0}
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
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Subject type
            <select
              name="subjectType"
              value={form.subjectType}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={!canManage || submitting}
            >
              {REVIEW_SUBJECT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Name
            <input
              name="subjectName"
              value={form.subjectName}
              onChange={handleChange}
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Creative Collective"
              disabled={!canManage || submitting}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Project
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
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
              Order
              <select
                name="orderId"
                value={form.orderId}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              >
                <option value="">Unassigned</option>
                {orderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Overall
              <input
                type="number"
                min="1"
                max="5"
                name="ratingOverall"
                value={form.ratingOverall}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Quality
              <input
                type="number"
                min="1"
                max="5"
                name="ratingQuality"
                value={form.ratingQuality}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Communication
              <input
                type="number"
                min="1"
                max="5"
                name="ratingCommunication"
                value={form.ratingCommunication}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Professionalism
              <input
                type="number"
                min="1"
                max="5"
                name="ratingProfessionalism"
                value={form.ratingProfessionalism}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || submitting}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="wouldRecommend"
              checked={form.wouldRecommend}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              disabled={!canManage || submitting}
            />
            Would recommend
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Comments
            <textarea
              name="comments"
              value={form.comments}
              onChange={handleChange}
              className="min-h-[96px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Highlights"
              disabled={!canManage || submitting}
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={!canManage || submitting}
          >
            {submitting ? 'Saving…' : 'Save review'}
          </button>
        </form>

        <div className="space-y-4">
          {entries.length ? (
            entries.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{review.subjectName ?? 'Review'}</p>
                    <p className="text-xs text-slate-500">
                      {review.subjectType?.replace(/_/g, ' ') ?? 'vendor'} · Overall {review.ratingOverall ?? '—'}/5
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {review.wouldRecommend ? 'Recommended' : 'Not recommended'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Submitted {review.submittedAt ? formatAbsolute(review.submittedAt) : '—'}</span>
                  <span>Quality {review.ratingQuality ?? '—'}/5</span>
                  <span>Communication {review.ratingCommunication ?? '—'}/5</span>
                  <span>Professionalism {review.ratingProfessionalism ?? '—'}/5</span>
                </div>
                {review.comments ? (
                  <p className="mt-3 text-sm text-slate-600">{review.comments}</p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No reviews yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ProjectReviewsPanel.propTypes = {
  entries: PropTypes.array.isRequired,
  summary: PropTypes.object,
  projects: PropTypes.array.isRequired,
  orders: PropTypes.array.isRequired,
  onCreateReview: PropTypes.func,
  canManage: PropTypes.bool,
};

ProjectReviewsPanel.defaultProps = {
  summary: {},
  onCreateReview: undefined,
  canManage: false,
};

export default ProjectReviewsPanel;
