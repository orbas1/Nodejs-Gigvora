import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const STATUS_STYLES = {
  pending: {
    badge: 'border-slate-300 bg-white text-slate-500',
    chip: 'bg-slate-100 text-slate-600',
    indicator: 'border-slate-300 bg-slate-100',
    dot: 'bg-slate-400',
  },
  awaiting_approval: {
    badge: 'border-amber-300 bg-amber-50 text-amber-700',
    chip: 'bg-amber-100 text-amber-700',
    indicator: 'border-amber-300 bg-amber-100',
    dot: 'bg-amber-500',
  },
  approved: {
    badge: 'border-sky-300 bg-sky-50 text-sky-700',
    chip: 'bg-sky-100 text-sky-700',
    indicator: 'border-sky-300 bg-sky-100',
    dot: 'bg-sky-500',
  },
  released: {
    badge: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    chip: 'bg-emerald-100 text-emerald-700',
    indicator: 'border-emerald-300 bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  disputed: {
    badge: 'border-rose-400 bg-rose-50 text-rose-700',
    chip: 'bg-rose-100 text-rose-700',
    indicator: 'border-rose-300 bg-rose-100',
    dot: 'bg-rose-500',
  },
  blocked: {
    badge: 'border-violet-400 bg-violet-50 text-violet-700',
    chip: 'bg-violet-100 text-violet-700',
    indicator: 'border-violet-300 bg-violet-100',
    dot: 'bg-violet-500',
  },
};

const STATUS_LABEL = {
  pending: 'Pending',
  awaiting_approval: 'Awaiting approval',
  approved: 'Approved',
  released: 'Released',
  disputed: 'Disputed',
  blocked: 'Blocked',
};

const RISK_SCALE = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-rose-600',
};

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  return `${Math.min(100, Math.max(0, Math.round(value * 100)))}%`;
}

export default function EscrowMilestoneTracker({
  contractTitle,
  currency,
  milestones,
  summary,
  onApprove,
  onRelease,
  onEscalate,
  onReschedule,
  onAddNote,
}) {
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [milestones]);

  const [selectedMilestoneId, setSelectedMilestoneId] = useState(
    () => sortedMilestones[0]?.id ?? null,
  );
  const [draftNote, setDraftNote] = useState('');

  const selectedMilestone = useMemo(() => {
    if (!selectedMilestoneId) {
      return null;
    }

    return sortedMilestones.find((milestone) => milestone.id === selectedMilestoneId) ?? null;
  }, [selectedMilestoneId, sortedMilestones]);

  const completedMilestones = useMemo(() => {
    return sortedMilestones.filter((milestone) => ['released', 'approved'].includes(milestone.status));
  }, [sortedMilestones]);

  const progressRatio = sortedMilestones.length
    ? completedMilestones.length / sortedMilestones.length
    : 0;

  const totalValue = sortedMilestones.reduce(
    (acc, milestone) => acc + (Number(milestone.amount) || 0),
    0,
  );
  const releasedValue = completedMilestones.reduce(
    (acc, milestone) => acc + (Number(milestone.amount) || 0),
    0,
  );

  const riskLevel = summary?.riskLevel ?? 'low';
  const riskScore = summary?.riskScore ?? null;

  function handleAddNote(event) {
    event.preventDefault();
    const trimmed = draftNote.trim();
    if (!trimmed || !selectedMilestone) {
      return;
    }

    onAddNote?.(selectedMilestone.id, trimmed);
    setDraftNote('');
  }

  function renderStatusBadge(status) {
    const styles = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles.badge}`}
      >
        {STATUS_LABEL[status] ?? status}
      </span>
    );
  }

  function renderApprovalSummary(milestone) {
    if (!milestone?.approvalsRequired) {
      return <span className="text-sm text-slate-600">No approvals required</span>;
    }
    const { approvalsRequired, approvalsCompleted } = milestone;
    const ratio = Math.min(approvalsCompleted / approvalsRequired, 1);
    return (
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Approvals</span>
          <span>
            {approvalsCompleted}/{approvalsRequired}
          </span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-sky-500 transition-all"
            style={{ width: `${Math.max(10, ratio * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  function renderNotes(milestone) {
    if (!milestone?.notes?.length) {
      return <p className="text-sm text-slate-500">No notes yet. Capture approvals, blockers, or context here.</p>;
    }

    return (
      <ul className="space-y-3">
        {milestone.notes.map((note) => (
          <li key={note.id ?? note.createdAt} className="rounded-2xl bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-600">{note.author ?? 'Team'}</span>
              <span>{formatRelativeTime(note.createdAt ?? new Date())}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{note.body}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Escrow roadmap</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">{contractTitle ?? 'Milestone tracker'}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Monitor the lifecycle of every funded milestone, coordinate releases with stakeholders, and surface risk signals
            before they impact delivery. Designed for executive confidence and compliance reviews.
          </p>
        </div>
        <div className="w-full max-w-xs rounded-2xl border border-slate-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall progress</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPercent(progressRatio)}</p>
          <p className="mt-1 text-sm text-slate-600">
            {completedMilestones.length} of {sortedMilestones.length} milestones released
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" style={{ width: `${progressRatio * 100}%` }} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
            <div>
              <dt>Total value</dt>
              <dd className="mt-1 text-base text-slate-900">{formatCurrency(totalValue, currency)}</dd>
            </div>
            <div>
              <dt>Released</dt>
              <dd className="mt-1 text-base text-emerald-600">{formatCurrency(releasedValue, currency)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.8fr_1.2fr]">
        <div className="space-y-6">
          {sortedMilestones.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <p className="text-base font-semibold text-slate-700">No milestones configured</p>
              <p className="mt-2 text-sm text-slate-500">
                Create milestones to orchestrate escrow releases, track approvals, and benchmark delivery.
              </p>
            </div>
          ) : (
            <ol className="relative space-y-6 pl-4">
              <span className="absolute left-2 top-1 h-full w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent" />
              {sortedMilestones.map((milestone, index) => {
                const styles = STATUS_STYLES[milestone.status] ?? STATUS_STYLES.pending;
                const isSelected = milestone.id === selectedMilestone?.id;
                const upcomingCopy = milestone.dueDate
                  ? `${formatRelativeTime(milestone.dueDate)} · ${formatAbsolute(milestone.dueDate, {
                      dateStyle: 'medium',
                    })}`
                  : 'No due date';

                return (
                  <li key={milestone.id ?? index} className="relative">
                    <div
                      className={`absolute -left-[13px] top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white text-xs font-semibold shadow-sm ${
                        styles.indicator ?? 'border-slate-200 bg-slate-100'
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${styles.dot ?? 'bg-slate-400'}`} />
                    </div>
                    {index < sortedMilestones.length - 1 ? (
                      <span className="absolute -left-0.5 top-9 h-full w-px bg-slate-200" />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelectedMilestoneId(milestone.id)}
                      className={`w-full rounded-2xl border p-5 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500 ${
                        isSelected
                          ? 'border-sky-200 bg-sky-50/60 shadow-lg shadow-sky-100'
                          : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-slate-900">{milestone.title}</h3>
                        {renderStatusBadge(milestone.status)}
                        {milestone.riskLevel ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              STATUS_STYLES[milestone.status]?.chip ?? 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Risk: {milestone.riskLevel}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Value</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatCurrency(milestone.amount, milestone.currency ?? currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Due</p>
                          <p className="mt-1 text-sm font-medium text-slate-700">{upcomingCopy}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Owner</p>
                          <p className="mt-1 text-sm font-medium text-slate-700">{milestone.owner ?? 'Unassigned'}</p>
                        </div>
                      </div>
                      {milestone.highlights?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {milestone.highlights.map((highlight) => (
                            <span
                              key={highlight}
                              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Risk status</p>
                <p className={`mt-1 text-xl font-semibold ${RISK_SCALE[riskLevel] ?? 'text-slate-700'}`}>
                  {riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : 'Low'}
                </p>
              </div>
              {riskScore != null ? (
                <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  Score {riskScore}
                </span>
              ) : null}
            </div>
            {summary?.riskNarrative ? (
              <p className="mt-3 text-sm text-slate-600">{summary.riskNarrative}</p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Keep release cadences healthy by monitoring blockers, approvals, and disputes in real time.
              </p>
            )}
            {summary?.flags?.length ? (
              <ul className="mt-4 space-y-2">
                {summary.flags.map((flag) => (
                  <li key={flag.label} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                    <span>{flag.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {selectedMilestone ? (
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60">
              <header className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Milestone details</p>
                <h3 className="text-lg font-semibold text-slate-900">{selectedMilestone.title}</h3>
                <p className="text-sm text-slate-500">
                  Updated {formatRelativeTime(selectedMilestone.updatedAt ?? selectedMilestone.dueDate)}
                </p>
              </header>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Release window</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-700">
                    {selectedMilestone.releaseWindow?.start
                      ? `${formatAbsolute(selectedMilestone.releaseWindow.start)} → ${formatAbsolute(
                          selectedMilestone.releaseWindow.end,
                        )}`
                      : 'Not scheduled'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Escrow amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    {formatCurrency(selectedMilestone.amount, selectedMilestone.currency ?? currency)}
                  </dd>
                </div>
                <div className="sm:col-span-2">{renderApprovalSummary(selectedMilestone)}</div>
              </dl>

              {selectedMilestone.attachments?.length ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Files & evidence</p>
                  <ul className="mt-2 space-y-2">
                    {selectedMilestone.attachments.map((attachment) => (
                      <li
                        key={attachment.id ?? attachment.href ?? attachment.name}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm text-slate-600"
                      >
                        <span className="truncate font-medium text-slate-700">{attachment.name}</span>
                        {attachment.href ? (
                          <a
                            href={attachment.href}
                            className="text-sm font-semibold text-sky-600 hover:text-sky-700"
                          >
                            View
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onApprove?.(selectedMilestone.id)}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  Approve milestone
                </button>
                <button
                  type="button"
                  onClick={() => onRelease?.(selectedMilestone.id)}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  Release funds
                </button>
                <button
                  type="button"
                  onClick={() => onReschedule?.(selectedMilestone.id)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => onEscalate?.(selectedMilestone.id)}
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                >
                  Escalate
                </button>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Notes & audit log</p>
                <div className="mt-3 space-y-3">
                  {renderNotes(selectedMilestone)}
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="milestone-note">
                      Add note
                    </label>
                    <textarea
                      id="milestone-note"
                      className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      rows={3}
                      placeholder="Capture review outcomes, blockers, or partner feedback"
                      value={draftNote}
                      onChange={(event) => setDraftNote(event.target.value)}
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                      >
                        Save note
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
              <p className="text-sm font-medium text-slate-600">Select a milestone to review approvals, releases, and notes.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

EscrowMilestoneTracker.propTypes = {
  contractTitle: PropTypes.string,
  currency: PropTypes.string,
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string.isRequired,
      amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      currency: PropTypes.string,
      dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      status: PropTypes.oneOf(['pending', 'awaiting_approval', 'approved', 'released', 'disputed', 'blocked']).isRequired,
      owner: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      approvalsRequired: PropTypes.number,
      approvalsCompleted: PropTypes.number,
      releaseWindow: PropTypes.shape({
        start: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        end: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      }),
      riskLevel: PropTypes.oneOf(['low', 'medium', 'high']),
      attachments: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          name: PropTypes.string.isRequired,
          href: PropTypes.string,
        }),
      ),
      notes: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          author: PropTypes.string,
          body: PropTypes.string.isRequired,
          createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        }),
      ),
    }),
  ),
  summary: PropTypes.shape({
    riskLevel: PropTypes.oneOf(['low', 'medium', 'high']),
    riskScore: PropTypes.number,
    riskNarrative: PropTypes.string,
    flags: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
      }),
    ),
  }),
  onApprove: PropTypes.func,
  onRelease: PropTypes.func,
  onEscalate: PropTypes.func,
  onReschedule: PropTypes.func,
  onAddNote: PropTypes.func,
};

EscrowMilestoneTracker.defaultProps = {
  contractTitle: null,
  currency: 'USD',
  milestones: [],
  summary: null,
  onApprove: undefined,
  onRelease: undefined,
  onEscalate: undefined,
  onReschedule: undefined,
  onAddNote: undefined,
};

