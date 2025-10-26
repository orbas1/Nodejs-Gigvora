import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  fetchApprovalQueue,
  assignSubmission,
} from '../../../services/contentGovernance.js';
import ModerationActions from './ModerationActions.jsx';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'needs_changes', label: 'Needs Changes' },
];

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const PRIORITY_BADGES = {
  urgent: 'bg-rose-100 text-rose-800 border border-rose-200',
  high: 'bg-amber-100 text-amber-800 border border-amber-200',
  standard: 'bg-sky-100 text-sky-800 border border-sky-200',
  low: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

function MetricCard({ icon: Icon, title, value, tone }) {
  const toneClasses = {
    primary: 'from-sky-500/10 to-sky-500/0 text-sky-900 border-sky-200',
    warning: 'from-amber-500/10 to-amber-500/0 text-amber-900 border-amber-200',
    danger: 'from-rose-500/10 to-rose-500/0 text-rose-900 border-rose-200',
    success: 'from-emerald-500/10 to-emerald-500/0 text-emerald-900 border-emerald-200',
  }[tone];

  return (
    <div className={`flex items-center gap-4 rounded-3xl border bg-gradient-to-br px-5 py-4 shadow-sm ${toneClasses}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-inner shadow-sky-100">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

MetricCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  tone: PropTypes.oneOf(['primary', 'warning', 'danger', 'success']).isRequired,
};

function QueueRow({ submission, isSelected = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(submission)}
      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
        isSelected ? 'border-sky-400 shadow-lg shadow-sky-100 bg-white' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{submission.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{submission.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-slate-200/80 px-3 py-1 text-slate-700">
              {submission.referenceType.replace(/_/g, ' ')} · {submission.referenceId}
            </span>
            {submission.assignedTeam && (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                Team: {submission.assignedTeam}
              </span>
            )}
            {submission.assignedReviewerId && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                Reviewer #{submission.assignedReviewerId}
              </span>
            )}
            <span className={`rounded-full px-3 py-1 capitalize ${PRIORITY_BADGES[submission.priority]}`}>
              {submission.priority}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
              Severity: {submission.severity}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end text-xs text-slate-500">
          <p>Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
          {submission.lastActivityAt && <p>Updated {new Date(submission.lastActivityAt).toLocaleString()}</p>}
        </div>
      </div>
    </button>
  );
}

QueueRow.propTypes = {
  submission: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string,
    referenceType: PropTypes.string.isRequired,
    referenceId: PropTypes.string.isRequired,
    assignedTeam: PropTypes.string,
    assignedReviewerId: PropTypes.number,
    priority: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    submittedAt: PropTypes.string.isRequired,
    lastActivityAt: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

function FilterPill({ label, value = undefined, options, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
      <span>{label}</span>
      <select
        className="rounded-full border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
        value={value || ''}
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

FilterPill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default function ContentApprovalQueue({ currentUserId = null, defaultFilters = {} }) {
  const [filters, setFilters] = useState(() => ({ page: 1, pageSize: 12, ...defaultFilters }));
  const [queue, setQueue] = useState({ items: [], summary: { total: 0, awaitingReview: 0, highSeverity: 0, urgent: 0 } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApprovalQueue(filters);
      setQueue(data);
      if (data.items.length > 0) {
        setSelectedSubmission((current) => current && data.items.some((item) => item.id === current.id)
          ? data.items.find((item) => item.id === current.id)
          : data.items[0]);
      } else {
        setSelectedSubmission(null);
      }
    } catch (fetchError) {
      setError(fetchError);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue, refreshKey]);

  const summaryCards = useMemo(
    () => [
      { icon: UserGroupIcon, title: 'In Queue', value: queue.summary.total ?? 0, tone: 'primary' },
      { icon: ArrowPathIcon, title: 'Awaiting Review', value: queue.summary.awaitingReview ?? 0, tone: 'warning' },
      { icon: BoltIcon, title: 'Urgent Cases', value: queue.summary.urgent ?? 0, tone: 'danger' },
      { icon: CheckCircleIcon, title: 'High Severity', value: queue.summary.highSeverity ?? 0, tone: 'success' },
    ],
    [queue.summary],
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  const handleAssignToMe = async () => {
    if (!selectedSubmission) return;
    if (!currentUserId) {
      setError(new Error('You need to be signed in as an admin reviewer to claim submissions.'));
      return;
    }
    try {
      setLoading(true);
      await assignSubmission(selectedSubmission.id, { reviewerId: currentUserId });
      handleRefresh();
    } catch (assignError) {
      setError(assignError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_minmax(420px,1fr)]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill
              label="Status"
              value={filters.status}
              options={STATUS_OPTIONS}
              onChange={(value) => handleFilterChange('status', value)}
            />
            <FilterPill
              label="Severity"
              value={filters.severity}
              options={SEVERITY_OPTIONS}
              onChange={(value) => handleFilterChange('severity', value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-500" aria-hidden />
              <input
                type="search"
                placeholder="Search submissions"
                className="w-48 border-none bg-transparent text-sm focus:outline-none"
                value={filters.search ?? ''}
                onChange={(event) => handleFilterChange('search', event.target.value || undefined)}
              />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <ExclamationTriangleIcon className="h-5 w-5" aria-hidden />
            <div>
              <p className="font-semibold">We could not load the approval queue.</p>
              <p className="mt-1 text-rose-600/80">{error.message || 'Please try again.'}</p>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {loading && queue.items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading queue…
            </div>
          ) : queue.items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No submissions match the current filters.
            </div>
          ) : (
            queue.items.map((submission) => (
              <QueueRow
                key={submission.id}
                submission={submission}
                isSelected={selectedSubmission?.id === submission.id}
                onSelect={setSelectedSubmission}
              />
            ))
          )}
        </div>
      </div>

      <aside className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200">
        {selectedSubmission ? (
          <>
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Review Brief</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{selectedSubmission.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{selectedSubmission.summary}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                PRIORITY_BADGES[selectedSubmission.priority]
              }`}
              >
                {selectedSubmission.priority}
              </span>
            </header>

            <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
              <div>
                <dt className="font-semibold text-slate-500">Status</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 capitalize">{selectedSubmission.status.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Severity</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 capitalize">{selectedSubmission.severity}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Region</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 uppercase">{selectedSubmission.region || 'Global'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Risk Score</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{selectedSubmission.riskScore ?? '—'}</dd>
              </div>
            </dl>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Reviewer Guidance</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Validate source ownership for any external assets or claims.</li>
                <li>Confirm the request aligns with published policy templates and disclosure requirements.</li>
                <li>Document remediation steps so teams can resolve on the first follow-up.</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAssignToMe}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Claim review
              </button>
              {selectedSubmission.assignedReviewerId && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Assigned to reviewer #{selectedSubmission.assignedReviewerId}
                </span>
              )}
            </div>

            <ModerationActions
              submission={selectedSubmission}
              currentUserId={currentUserId}
              onActionComplete={handleRefresh}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-500">
            <UserGroupIcon className="h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-3 text-sm font-medium">Select a submission to view details and take action.</p>
          </div>
        )}
      </aside>
    </section>
  );
}

ContentApprovalQueue.propTypes = {
  currentUserId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  defaultFilters: PropTypes.shape({
    status: PropTypes.string,
    severity: PropTypes.string,
    search: PropTypes.string,
  }),
};
