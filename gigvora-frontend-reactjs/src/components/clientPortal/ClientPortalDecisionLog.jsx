import {
  DocumentTextIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import { classNames } from '../../utils/classNames.js';

const VISIBILITY_BADGES = {
  client: 'bg-blue-50 text-blue-700 border-blue-200',
  internal: 'bg-slate-100 text-slate-600 border-slate-200',
  public: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function ClientPortalDecisionLog({ decisions = {}, className = '' }) {
  const entries = Array.isArray(decisions.entries) ? decisions.entries : [];
  const summary = decisions.summary ?? {};

  return (
    <section className={classNames('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Decision &amp; approval ledger</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Every approval, scope change, and budget adjustment in one audit-friendly trail. Share with clients, auditors, or future project retros.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            <DocumentTextIcon className="h-4 w-4" /> {summary.totalCount ?? entries.length} decisions
          </div>
          {summary.lastDecisionAt ? (
            <p className="text-xs text-slate-500">
              Last update {formatRelativeTime(summary.lastDecisionAt)} ({formatAbsolute(summary.lastDecisionAt, { dateStyle: 'medium' })})
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {entries.length ? (
          entries.map((decision) => {
            const visibilityStyle = VISIBILITY_BADGES[decision.visibility] ?? VISIBILITY_BADGES.client;
            return (
              <article key={decision.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-slate-900">{decision.summary}</h3>
                      <span
                        className={classNames(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
                          visibilityStyle,
                        )}
                      >
                        <ShieldCheckIcon className="h-4 w-4" /> {decision.visibility}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{decision.decision}</p>
                    {decision.impactSummary ? (
                      <p className="mt-2 text-xs text-slate-500">Impact: {decision.impactSummary}</p>
                    ) : null}
                    {decision.attachments?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-blue-600">
                        {decision.attachments.map((attachment) => (
                          <a
                            key={attachment.url ?? attachment.label}
                            href={attachment.url ?? '#'}
                            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 transition hover:border-blue-300 hover:bg-blue-100"
                          >
                            <EnvelopeIcon className="h-4 w-4" />
                            {attachment.label ?? 'Attachment'}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{formatAbsolute(decision.decidedAt, { dateStyle: 'medium' })}</p>
                    <p>{formatRelativeTime(decision.decidedAt)}</p>
                    {decision.decidedBy?.name ? (
                      <p className="mt-1 font-medium text-slate-600">{decision.decidedBy.name}</p>
                    ) : null}
                    {decision.category ? (
                      <p className="mt-1 uppercase tracking-wide text-slate-400">{decision.category}</p>
                    ) : null}
                    {decision.followUpDate ? (
                      <p className="mt-2 text-[11px] uppercase tracking-wide text-amber-600">
                        Follow-up {formatAbsolute(decision.followUpDate, { dateStyle: 'medium' })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Share your first decision to build a transparent audit trail with the client.
          </div>
        )}
      </div>
    </section>
  );
}
