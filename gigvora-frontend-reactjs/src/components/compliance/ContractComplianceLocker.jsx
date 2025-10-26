import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatRelative(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'n/a';
  }
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays > 0) return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  const abs = Math.abs(diffDays);
  return `${abs} day${abs === 1 ? '' : 's'} ago`;
}

function formatStatus(status) {
  if (!status) return '—';
  return status
    .toString()
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function SummaryCard({ icon: Icon, title, value, description, tone = 'blue' }) {
  const toneClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
  };
  return (
    <div className={`flex flex-col rounded-2xl border p-5 shadow-sm ${toneClasses[tone] ?? toneClasses.blue}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-inherit shadow-inner">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      {description ? <p className="mt-3 text-sm text-slate-700/80">{description}</p> : null}
    </div>
  );
}

function ComplianceTable({ documents = [] }) {
  if (!documents.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        No compliance records yet. Upload your first contract to activate renewal tracking.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 bg-white text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Document</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Expiry</th>
            <th scope="col" className="px-4 py-3">Latest version</th>
            <th scope="col" className="px-4 py-3">Upcoming reminder</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {documents.map((document) => {
            const latestVersion = document.versions?.[0];
            const nextReminder = document.reminders?.[0] ?? document.obligations?.flatMap((obligation) => obligation.reminders ?? [])?.[0];
            return (
              <tr key={document.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{document.title}</span>
                    <span className="text-xs text-slate-500">{formatStatus(document.documentType)}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {formatStatus(document.status)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col text-sm text-slate-700">
                    <span>{formatDate(document.expiryDate)}</span>
                    <span className="text-xs text-slate-500">{formatRelative(document.expiryDate)}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  {latestVersion ? (
                    <div className="flex flex-col">
                      <span>v{latestVersion.versionNumber}</span>
                      <span className="text-xs text-slate-500">{formatRelative(latestVersion.createdAt)}</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  {nextReminder ? (
                    <div className="flex flex-col">
                      <span>{formatStatus(nextReminder.reminderType)}</span>
                      <span className="text-xs text-slate-500">{formatRelative(nextReminder.dueAt)}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">None scheduled</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ObligationList({ obligations = [] }) {
  if (!obligations.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        No open obligations. Compliance tasks will appear here with due dates and owners.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {obligations.map((obligation) => (
        <li key={obligation.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{obligation.description}</p>
              {obligation.clauseReference ? (
                <p className="text-xs uppercase tracking-wide text-slate-400">Clause {obligation.clauseReference}</p>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <ClipboardDocumentListIcon className="h-4 w-4 text-blue-500" />
              {formatStatus(obligation.status)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              Due {formatDate(obligation.dueAt)} · {formatRelative(obligation.dueAt)}
            </span>
            {obligation.priority ? (
              <span className="inline-flex items-center gap-1">
                <LockClosedIcon className="h-4 w-4" />
                Priority {formatStatus(obligation.priority)}
              </span>
            ) : null}
            {obligation.assigneeId ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircleIcon className="h-4 w-4" />
                Owner #{obligation.assigneeId}
              </span>
            ) : null}
          </div>
          {obligation.reminders?.length ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              {obligation.reminders.length} reminder{obligation.reminders.length === 1 ? '' : 's'} scheduled · next {formatRelative(obligation.reminders[0].dueAt)}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function FrameworkGrid({ frameworks = [] }) {
  if (!frameworks.length) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {frameworks.map((framework) => (
        <div
          key={`${framework.framework}-${framework.region}-${framework.id}`}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{framework.framework}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">{framework.region}</p>
            </div>
            <GlobeAltIcon className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-sm text-slate-600">{framework.requirement}</p>
          {framework.guidance ? (
            <p className="rounded-2xl bg-blue-50 px-4 py-2 text-xs text-blue-700">{framework.guidance}</p>
          ) : null}
          {framework.recommendedDocumentTypes?.length ? (
            <div className="flex flex-wrap gap-2">
              {framework.recommendedDocumentTypes.map((type) => (
                <span key={type} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {formatStatus(type)}
                </span>
              ))}
            </div>
          ) : null}
          {framework.questionnaireUrl ? (
            <a
              href={framework.questionnaireUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Open readiness checklist
              <ArrowPathIcon className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PolicyAcknowledgementList({ policies = [] }) {
  if (!policies.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        All compliance policies are acknowledged. New legal updates will surface here automatically.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {policies.map((policy) => {
        const acknowledgement = policy.acknowledgement ?? null;
        const isGranted = Boolean(acknowledgement?.status === 'granted' && acknowledgement.isCurrentVersion);
        const isWithdrawn = acknowledgement?.status === 'withdrawn';
        const statusTone = isGranted
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : isWithdrawn
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-amber-200 bg-amber-50 text-amber-700';

        return (
          <li
            key={policy.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{policy.title}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {formatStatus(policy.region)} • {policy.legalBasis}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusTone}`}
              >
                <ShieldCheckIcon className="h-4 w-4" />
                {isGranted ? 'Acknowledged' : isWithdrawn ? 'Withdrawn' : 'Pending'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                {policy.required ? 'Required policy' : 'Optional policy'}
              </span>
              {policy.isOutstanding ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                  Action required
                </span>
              ) : null}
              {acknowledgement && !acknowledgement.isCurrentVersion ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                  Re-acknowledgement needed
                </span>
              ) : null}
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              {acknowledgement?.grantedAt ? (
                <p>
                  Granted {formatDate(acknowledgement.grantedAt)} ({formatRelative(acknowledgement.grantedAt)})
                </p>
              ) : (
                <p>No acknowledgement recorded yet.</p>
              )}
              {acknowledgement?.withdrawnAt ? (
                <p>Withdrawn {formatDate(acknowledgement.withdrawnAt)}</p>
              ) : null}
              {policy.activeVersion?.summary ? (
                <p className="pt-1 text-slate-600">{policy.activeVersion.summary}</p>
              ) : null}
            </div>
            {policy.activeVersion?.documentUrl ? (
              <a
                href={policy.activeVersion.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Review policy document
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function LegalDocumentCollection({ documents = [] }) {
  if (!documents.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        No published legal documents yet. Approved policies and agreements will appear here for quick reference.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {documents.map((document) => (
        <div key={document.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{document.title}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {formatStatus(document.category)} • {formatStatus(document.region)}
              </p>
            </div>
            <ScaleIcon className="h-5 w-5 text-blue-500" />
          </div>
          {document.summary ? <p className="text-sm text-slate-600">{document.summary}</p> : null}
          {document.audienceRoles?.length ? (
            <div className="flex flex-wrap gap-2 text-xs">
              {document.audienceRoles.map((role) => (
                <span key={role} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  {formatStatus(role)}
                </span>
              ))}
            </div>
          ) : null}
          {document.activeVersion ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700">
              v{document.activeVersion.version} effective {formatDate(document.activeVersion.effectiveAt)}
              {document.activeVersion.publishedAt
                ? ` • published ${formatRelative(document.activeVersion.publishedAt)}`
                : ''}
              {document.activeVersion.changeSummary ? (
                <span className="block pt-1 text-blue-600/80">{document.activeVersion.changeSummary}</span>
              ) : null}
            </div>
          ) : null}
          {document.activeVersion?.externalUrl ? (
            <a
              href={document.activeVersion.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View publication
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AuditTimeline({ auditLog = [] }) {
  if (!auditLog.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No audit trail entries yet.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {auditLog.map((event) => (
        <li key={event.id} className="flex gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
          <div className="flex flex-col">
            <p className="text-sm font-medium text-slate-800">{event.label}</p>
            <p className="text-xs text-slate-500">{formatDate(event.occurredAt)} · {formatRelative(event.occurredAt)}</p>
            <p className="text-sm text-slate-600">{event.summary}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ContractComplianceLocker({ data, loading, error, onRefresh }) {
  const totals = data?.summary?.totals ?? {};
  const obligationsSummary = data?.summary?.obligations ?? {};
  const remindersSummary = data?.summary?.reminders ?? {};
  const documents = data?.documents?.list ?? [];
  const expiringSoon = data?.summary?.expiringSoon ?? [];
  const overdueRenewals = data?.summary?.overdueRenewals ?? [];
  const frameworks = data?.frameworks ?? [];
  const auditLog = data?.auditLog ?? [];
  const policySummary = data?.legalPolicies?.summary ?? {};
  const policies = data?.legalPolicies?.list ?? [];
  const legalSummary = data?.legalDocuments?.summary ?? {};
  const legalDocuments = data?.legalDocuments?.list ?? [];

  return (
    <section
      id="contract-compliance-locker"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-blue-600/90">Finance, compliance & reputation</p>
          <h2 className="text-2xl font-semibold text-slate-900">Contract & compliance locker</h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Centralize MSAs, NDAs, IP assignments, and attestations with immutable audit trails, renewal intelligence, and
            localization for GDPR, SOC 2, and worker classification frameworks.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh locker
        </button>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <SummaryCard
              icon={LockClosedIcon}
              title="Active agreements"
              value={totals.activeDocuments ?? 0}
              description={`${totals.totalDocuments ?? 0} total documents`}
            />
            <SummaryCard
              icon={BellAlertIcon}
              tone="amber"
              title="Renewals due"
              value={expiringSoon.length}
              description={
                expiringSoon.length
                  ? `Next renewal ${formatRelative(expiringSoon[0]?.expiryDate)}`
                  : 'No renewals due in the next 45 days'
              }
            />
            <SummaryCard
              icon={ClipboardDocumentListIcon}
              tone="rose"
              title="Obligations open"
              value={obligationsSummary.open ?? 0}
              description={`${obligationsSummary.overdue ?? 0} overdue tasks`}
            />
            <SummaryCard
              icon={GlobeAltIcon}
              tone="emerald"
              title="Framework coverage"
              value={frameworks.length}
              description={`${totals.jurisdictionsCovered ?? 0} jurisdictions tracked`}
            />
            <SummaryCard
              icon={ShieldCheckIcon}
              tone="indigo"
              title="Policy acknowledgements"
              value={policySummary.acknowledged ?? 0}
              description={`${policySummary.total ?? 0} policies tracked`}
            />
            <SummaryCard
              icon={ScaleIcon}
              tone="sky"
              title="Legal publications"
              value={legalSummary.active ?? 0}
              description={
                legalSummary.lastPublishedAt
                  ? `Updated ${formatRelative(legalSummary.lastPublishedAt)}`
                  : `${legalSummary.total ?? 0} total records`
              }
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Documents & renewals</h3>
                <p className="text-sm text-slate-600">
                  Audit-ready storage with version history, signature evidence, and renewal forecasting for every client contract.
                </p>
                <div className="mt-4">
                  <ComplianceTable documents={documents} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upcoming renewals</h3>
                {expiringSoon.length || overdueRenewals.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {[...expiringSoon, ...overdueRenewals].slice(0, 4).map((renewal) => (
                      <div
                        key={`${renewal.documentId}-${renewal.expiryDate}`}
                        className={`rounded-2xl border p-4 ${
                          renewal.daysUntil < 0
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        <p className="text-sm font-semibold">{renewal.title}</p>
                        <p className="text-xs uppercase tracking-wide opacity-80">{formatStatus(renewal.status)}</p>
                        <p className="mt-2 text-sm">Expires {formatDate(renewal.expiryDate)} ({formatRelative(renewal.expiryDate)})</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No renewals pending in the next 60 days.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Obligations tracker</h3>
                <ObligationList obligations={data?.obligations?.open ?? []} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900">Reminder workload</h3>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-slate-600">
                      <BellAlertIcon className="h-5 w-5 text-amber-500" />
                      Upcoming
                    </span>
                    <span className="font-semibold text-slate-900">{remindersSummary.upcoming ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-slate-600">
                      <ClockIcon className="h-5 w-5 text-rose-500" />
                      Overdue
                    </span>
                    <span className="font-semibold text-rose-600">{remindersSummary.overdue ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-900">Localization playbooks</h3>
            </div>
            <FrameworkGrid frameworks={frameworks} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-900">Policy acknowledgements</h3>
            </div>
            <PolicyAcknowledgementList policies={policies} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ScaleIcon className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-900">Legal policy library</h3>
            </div>
            <LegalDocumentCollection documents={legalDocuments} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-900">Audit activity</h3>
            </div>
            <AuditTimeline auditLog={auditLog} />
          </div>
        </div>
      )}
    </section>
  );
}
