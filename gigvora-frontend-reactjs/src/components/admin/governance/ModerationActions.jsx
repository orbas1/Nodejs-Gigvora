import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  createModerationAction,
  fetchModerationActions,
} from '../../../services/contentGovernance.js';

const ACTION_OPTIONS = [
  { value: 'approve', label: 'Approve for publish' },
  { value: 'reject', label: 'Reject and remove' },
  { value: 'request_changes', label: 'Request changes' },
  { value: 'escalate', label: 'Escalate to specialist' },
  { value: 'suspend', label: 'Suspend actor' },
  { value: 'restore', label: 'Restore content' },
  { value: 'add_note', label: 'Add reviewer note' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'needs_changes', label: 'Needs changes' },
];

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'standard', label: 'Standard' },
  { value: 'low', label: 'Low' },
];

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function TimelineEntry({ action }) {
  return (
    <li className="relative flex gap-3 rounded-2xl border border-slate-200 bg-white/60 p-3 text-sm text-slate-600 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
        <ShieldCheckIcon className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>{action.action.replace('_', ' ')}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">Severity {action.severity}</span>
          {action.riskScore != null && <span className="rounded-full bg-slate-100 px-2 py-0.5">Risk {action.riskScore}</span>}
        </div>
        {action.reason && <p className="mt-1 text-sm text-slate-700">{action.reason}</p>}
        {action.resolutionSummary && (
          <p className="mt-1 text-xs text-slate-500">Resolution: {action.resolutionSummary}</p>
        )}
        <p className="mt-2 text-xs text-slate-500">{new Date(action.createdAt).toLocaleString()}</p>
      </div>
    </li>
  );
}

TimelineEntry.propTypes = {
  action: PropTypes.shape({
    action: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    riskScore: PropTypes.number,
    reason: PropTypes.string,
    resolutionSummary: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
};

export default function ModerationActions({ submission = null, onActionComplete = () => {} }) {
  const [form, setForm] = useState({
    action: 'request_changes',
    status: submission?.status || 'in_review',
    priority: submission?.priority || 'standard',
    severity: submission?.severity || 'medium',
    riskScore: submission?.riskScore ?? '',
    slaMinutes: submission?.slaMinutes ?? '',
    reason: '',
    resolutionSummary: '',
    guidanceLink: '',
  });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      status: submission?.status || 'in_review',
      priority: submission?.priority || 'standard',
      severity: submission?.severity || 'medium',
      riskScore: submission?.riskScore ?? '',
      slaMinutes: submission?.slaMinutes ?? '',
      reason: '',
      resolutionSummary: '',
      guidanceLink: '',
    }));
  }, [submission?.id, submission?.status, submission?.priority, submission?.severity, submission?.riskScore, submission?.slaMinutes]);

  useEffect(() => {
    if (!submission?.id) {
      setHistory([]);
      return;
    }
    let isMounted = true;
    setLoadingHistory(true);
    fetchModerationActions(submission.id)
      .then((data) => {
        if (!isMounted) return;
        setHistory(data.actions || []);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingHistory(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [submission?.id]);

  const tone = useMemo(() => {
    if (form.severity === 'critical' || form.priority === 'urgent') return 'bg-rose-50 border-rose-200 text-rose-800';
    if (form.severity === 'high' || form.priority === 'high') return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-emerald-50 border-emerald-200 text-emerald-800';
  }, [form.severity, form.priority]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!submission?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      await createModerationAction(submission.id, {
        action: form.action,
        status: form.status,
        priority: form.priority,
        severity: form.severity,
        riskScore: form.riskScore === '' ? undefined : Number(form.riskScore),
        slaMinutes: form.slaMinutes === '' ? undefined : Number(form.slaMinutes),
        reason: form.reason || undefined,
        resolutionSummary: form.resolutionSummary || undefined,
        guidanceLink: form.guidanceLink || undefined,
      });
      setForm((prev) => ({
        ...prev,
        reason: '',
        resolutionSummary: '',
        guidanceLink: '',
      }));
      onActionComplete();
      const refreshed = await fetchModerationActions(submission.id);
      setHistory(refreshed.actions || []);
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex flex-1 flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-inner">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Moderation actions</p>
          <h3 className="text-lg font-semibold text-slate-900">Resolve this submission</h3>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
          <ClockIcon className="h-4 w-4" aria-hidden />
          SLA {form.slaMinutes || submission?.slaMinutes || 'n/a'} mins
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <ExclamationCircleIcon className="h-5 w-5" aria-hidden />
          <span>{error.message || 'Unable to apply moderation action.'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Action
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={form.action}
              onChange={(event) => setForm((prev) => ({ ...prev, action: event.target.value }))}
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Status
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Priority
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Severity
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={form.severity}
              onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
            >
              {SEVERITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Risk score
            <input
              type="number"
              step="0.1"
              min="0"
              max="999.99"
              value={form.riskScore}
              onChange={(event) => setForm((prev) => ({ ...prev, riskScore: event.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              placeholder="0 – 999"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            SLA minutes
            <input
              type="number"
              min="0"
              value={form.slaMinutes}
              onChange={(event) => setForm((prev) => ({ ...prev, slaMinutes: event.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              placeholder="Enter SLA"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Reason / findings
          <textarea
            rows={3}
            value={form.reason}
            onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="Explain policy decision, cite evidence, and recommend follow-up actions."
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Remediation plan
          <textarea
            rows={2}
            value={form.resolutionSummary}
            onChange={(event) => setForm((prev) => ({ ...prev, resolutionSummary: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="Summarise the remediation steps shared with stakeholders."
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Policy guidance link
          <input
            type="url"
            value={form.guidanceLink}
            onChange={(event) => setForm((prev) => ({ ...prev, guidanceLink: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="https://"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {submitting ? 'Submitting…' : 'Apply action'}
        </button>
      </form>

      <section className="space-y-3">
        <header className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <ClipboardDocumentListIcon className="h-4 w-4" aria-hidden />
          Action history
        </header>
        {loadingHistory ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            No moderation actions recorded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {history.map((action) => (
              <TimelineEntry key={action.id} action={action} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

ModerationActions.propTypes = {
  submission: PropTypes.shape({
    id: PropTypes.number,
    status: PropTypes.string,
    priority: PropTypes.string,
    severity: PropTypes.string,
    riskScore: PropTypes.number,
    slaMinutes: PropTypes.number,
  }),
  onActionComplete: PropTypes.func,
};
