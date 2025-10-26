import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpOnSquareIcon,
  BellAlertIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';
import DataStatus from '../../components/DataStatus.jsx';
import { formatDateLabel, formatRelativeTime } from '../../utils/date.js';

const STATUS_TONES = {
  complete: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  pending: 'bg-amber-50 border-amber-200 text-amber-700',
  overdue: 'bg-rose-50 border-rose-200 text-rose-600',
  missing: 'bg-rose-50 border-rose-200 text-rose-600',
  received: 'bg-blue-50 border-blue-200 text-blue-700',
  review: 'bg-violet-50 border-violet-200 text-violet-600',
};

const CATEGORY_LABELS = {
  income: 'Income',
  expense: 'Expense',
  compliance: 'Compliance',
  payroll: 'Payroll',
};

const FALLBACK_PAYLOAD = {
  summary: {
    totalDocuments: 18,
    pendingCount: 5,
    overdueCount: 1,
    submittedCount: 12,
    nextDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  },
  documents: [
    {
      id: 'w9-2024',
      name: 'Form W-9 (2024)',
      jurisdiction: 'United States',
      status: 'pending',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      category: 'compliance',
      type: 'IRS',
      requiresAction: true,
    },
    {
      id: 'gst-2023',
      name: 'GST Return Q4 2023',
      jurisdiction: 'Canada',
      status: 'complete',
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      category: 'income',
      type: 'CRA',
      requiresAction: false,
    },
    {
      id: 'vat-uk',
      name: 'VAT Submission FY23',
      jurisdiction: 'United Kingdom',
      status: 'overdue',
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      category: 'compliance',
      type: 'HMRC',
      requiresAction: true,
      alerts: ['Penalty risk in 3 days'],
    },
    {
      id: 'contractor-1099',
      name: '1099-NEC Summary',
      jurisdiction: 'United States',
      status: 'review',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      category: 'payroll',
      type: 'IRS',
      requiresAction: false,
    },
  ],
  alerts: [
    {
      id: 'deadline-reminder',
      title: '1099-NEC filing cut-off',
      description: 'Submit all independent contractor forms before 31 Jan to avoid $50 per-form penalties.',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      priority: 'high',
    },
    {
      id: 'bank-sync',
      title: 'Bank reconciliation pending',
      description: 'We spotted 5 uncategorised payouts that may require tax withholding adjustments.',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      priority: 'medium',
    },
  ],
  filters: {
    statuses: ['pending', 'complete', 'overdue', 'missing', 'review'],
    years: [2024, 2023, 2022],
    categories: ['income', 'expense', 'compliance', 'payroll'],
  },
};

function SummaryCard({ summary, onScheduleReview }) {
  const { totalDocuments, pendingCount, overdueCount, submittedCount, nextDeadline } = summary;
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Compliance health</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{submittedCount} submitted · {pendingCount} pending · {overdueCount} at risk</h3>
          <p className="mt-2 text-sm text-slate-500">Stay ahead of quarterly filings with proactive reminders, secure document storage, and cross-border compliance insights.</p>
        </div>
        <button
          type="button"
          onClick={onScheduleReview}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" /> Schedule review
        </button>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-subtle">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Documents in scope</dt>
          <dd className="mt-2 text-2xl font-semibold text-slate-900">{totalDocuments}</dd>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-subtle">
          <dt className="text-xs font-semibold uppercase tracking-wide text-amber-600">Pending action</dt>
          <dd className="mt-2 text-2xl font-semibold text-amber-700">{pendingCount}</dd>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-subtle">
          <dt className="text-xs font-semibold uppercase tracking-wide text-rose-600">Overdue</dt>
          <dd className="mt-2 text-2xl font-semibold text-rose-600">{overdueCount}</dd>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-subtle">
          <dt className="text-xs font-semibold uppercase tracking-wide text-blue-600">Next deadline</dt>
          <dd className="mt-2 text-lg font-semibold text-blue-700">{formatDateLabel(nextDeadline, { includeTime: false })}</dd>
        </div>
      </dl>
    </div>
  );
}

SummaryCard.propTypes = {
  summary: PropTypes.shape({
    totalDocuments: PropTypes.number,
    pendingCount: PropTypes.number,
    overdueCount: PropTypes.number,
    submittedCount: PropTypes.number,
    nextDeadline: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }).isRequired,
  onScheduleReview: PropTypes.func,
};

function FilterPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
        active ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600'
      )}
    >
      <FunnelIcon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

FilterPill.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

function DocumentRow({ document, onDownload, onUpload, onAcknowledge }) {
  const tone = STATUS_TONES[document.status] ?? STATUS_TONES.pending;
  const categoryLabel = CATEGORY_LABELS[document.category] ?? document.category;

  return (
    <div className="grid items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-subtle sm:grid-cols-[1.6fr_1fr_1fr_auto]">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-2 text-blue-600">
            <BuildingLibraryIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{document.name}</p>
            <p className="text-xs text-slate-500">{document.jurisdiction} · {document.type}</p>
          </div>
        </div>
        {document.alerts?.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {document.alerts.map((alert) => (
              <span key={alert} className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {alert}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="space-y-1">
        <span className={classNames('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', tone)}>
          <span className="inline-block h-2 w-2 rounded-full bg-current" aria-hidden="true" />
          {document.status}
        </span>
        <p className="text-xs text-slate-500">Due {formatRelativeTime(document.dueDate)}</p>
      </div>
      <div className="space-y-1 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Category: {categoryLabel}</p>
        {document.issuedAt ? <p>Issued {formatDateLabel(document.issuedAt)}</p> : null}
        {document.submittedAt ? <p>Submitted {formatDateLabel(document.submittedAt)}</p> : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onDownload(document)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
        >
          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Download
        </button>
        <button
          type="button"
          onClick={() => onUpload(document)}
          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        >
          <ArrowUpOnSquareIcon className="h-4 w-4" aria-hidden="true" /> Upload
        </button>
        {document.requiresAction ? (
          <button
            type="button"
            onClick={() => onAcknowledge(document)}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-600 transition hover:border-emerald-300"
          >
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Mark done
          </button>
        ) : null}
      </div>
    </div>
  );
}

DocumentRow.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    jurisdiction: PropTypes.string,
    status: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    issuedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    category: PropTypes.string,
    type: PropTypes.string,
    requiresAction: PropTypes.bool,
    alerts: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onDownload: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  onAcknowledge: PropTypes.func.isRequired,
};

function UpcomingAlert({ alert, onRemind }) {
  const tone = alert.priority === 'high' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-amber-200 bg-amber-50 text-amber-700';
  return (
    <div className={classNames('flex items-start gap-3 rounded-3xl border p-4 shadow-subtle', tone)}>
      <BellAlertIcon className="mt-0.5 h-6 w-6 flex-shrink-0" aria-hidden="true" />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold">{alert.title}</p>
          <span className="text-xs font-semibold uppercase tracking-wide">Due {formatDateLabel(alert.dueDate)}</span>
        </div>
        <p className="text-xs text-current/80">{alert.description}</p>
        <button
          type="button"
          onClick={() => onRemind(alert)}
          className="inline-flex items-center gap-1 rounded-full border border-current/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition hover:bg-white/30"
        >
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Snooze reminder
        </button>
      </div>
    </div>
  );
}

UpcomingAlert.propTypes = {
  alert: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    priority: PropTypes.string,
  }).isRequired,
  onRemind: PropTypes.func.isRequired,
};

export default function TaxDocumentCenter({
  data = FALLBACK_PAYLOAD,
  loading,
  error,
  onRefresh,
  onDownloadDocument,
  onUploadDocument,
  onAcknowledgeDocument,
  onScheduleReview,
  onSnoozeAlert,
}) {
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [search, setSearch] = useState('');

  const filters = data.filters ?? FALLBACK_PAYLOAD.filters;
  const documents = data.documents ?? FALLBACK_PAYLOAD.documents;
  const summary = data.summary ?? FALLBACK_PAYLOAD.summary;
  const alerts = data.alerts ?? FALLBACK_PAYLOAD.alerts;

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchStatus = activeStatus === 'all' || doc.status === activeStatus;
      const matchCategory = activeCategory === 'all' || doc.category === activeCategory;
      const matchYear =
        selectedYear === 'all' || (doc.dueDate ? new Date(doc.dueDate).getFullYear() === Number(selectedYear) : false);
      const matchSearch = search
        ? [doc.name, doc.jurisdiction, doc.type].some((field) => field?.toLowerCase().includes(search.toLowerCase()))
        : true;
      return matchStatus && matchCategory && matchYear && matchSearch;
    });
  }, [documents, activeStatus, activeCategory, selectedYear, search]);

  const nextDeadline = filteredDocuments
    .filter((doc) => doc.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.dueDate;

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-soft">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Tax center</p>
          <h2 className="text-2xl font-semibold text-slate-900">Manage cross-border tax obligations with confidence</h2>
          <p className="mt-2 text-sm text-slate-500">Centralise forms, deadlines, and audit-ready receipts across jurisdictions with automated reminders.</p>
        </div>
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs font-semibold text-blue-700 shadow-subtle">
          <p>Next deadline: {formatDateLabel(nextDeadline ?? summary.nextDeadline)}</p>
          <p className="text-[11px] uppercase tracking-wide">We&apos;ll send you proactive reminders 7, 3, and 1 day before.</p>
        </div>
      </header>

      <DataStatus
        loading={loading}
        error={error}
        lastUpdated={summary.updatedAt}
        fromCache={data.fromCache}
        onRefresh={onRefresh}
        statusLabel="Compliance snapshot"
      >
        <SummaryCard summary={summary} onScheduleReview={onScheduleReview} />

        <div className="flex flex-wrap items-center gap-3">
          <FilterPill active={activeStatus === 'all'} label="All statuses" onClick={() => setActiveStatus('all')} />
          {filters.statuses?.map((status) => (
            <FilterPill key={status} active={activeStatus === status} label={status} onClick={() => setActiveStatus(status)} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter by year</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterPill active={selectedYear === 'all'} label="All years" onClick={() => setSelectedYear('all')} />
              {filters.years?.map((year) => (
                <FilterPill key={year} active={selectedYear === String(year)} label={String(year)} onClick={() => setSelectedYear(String(year))} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterPill active={activeCategory === 'all'} label="All" onClick={() => setActiveCategory('all')} />
              {filters.categories?.map((category) => (
                <FilterPill key={category} active={activeCategory === category} label={CATEGORY_LABELS[category] ?? category} onClick={() => setActiveCategory(category)} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</p>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 shadow-subtle">
              <InformationCircleIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="search"
                placeholder="Search forms, jurisdictions, or IDs"
                className="w-full border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Showing {filteredDocuments.length} of {documents.length} documents</span>
            <div className="inline-flex items-center gap-2 text-slate-500">
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
              Sorted by upcoming due date
            </div>
          </div>
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onDownload={(item) => onDownloadDocument?.(item)}
                onUpload={(item) => onUploadDocument?.(item)}
                onAcknowledge={(item) => onAcknowledgeDocument?.(item)}
              />
            ))}
            {filteredDocuments.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-center">
                <p className="text-sm font-semibold text-slate-600">No documents match your filters.</p>
                <p className="mt-2 text-xs text-slate-500">Try resetting filters or expanding the time range to see archived filings.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-subtle">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Upcoming compliance alerts</p>
              <span className="text-xs text-slate-400">{alerts.length} reminders scheduled</span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <UpcomingAlert key={alert.id} alert={alert} onRemind={(item) => onSnoozeAlert?.(item)} />
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-subtle">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Audit readiness</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <ShieldCheckIcon className="mt-0.5 h-5 w-5 text-emerald-500" aria-hidden="true" />
                <span>All uploads are versioned with checksum validation and immutable timestamps.</span>
              </li>
              <li className="flex items-start gap-2">
                <InformationCircleIcon className="mt-0.5 h-5 w-5 text-blue-500" aria-hidden="true" />
                <span>Invite your finance partner to collaborate securely with role-based access controls.</span>
              </li>
              <li className="flex items-start gap-2">
                <CalendarDaysIcon className="mt-0.5 h-5 w-5 text-amber-500" aria-hidden="true" />
                <span>Export quarterly compliance packets in one click for your auditor.</span>
              </li>
            </ul>
          </div>
        </div>
      </DataStatus>
    </section>
  );
}

TaxDocumentCenter.propTypes = {
  data: PropTypes.shape({
    documents: PropTypes.arrayOf(DocumentRow.propTypes.document),
    alerts: PropTypes.arrayOf(UpcomingAlert.propTypes.alert),
    filters: PropTypes.shape({
      statuses: PropTypes.arrayOf(PropTypes.string),
      years: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
      categories: PropTypes.arrayOf(PropTypes.string),
    }),
    summary: PropTypes.shape({
      totalDocuments: PropTypes.number,
      pendingCount: PropTypes.number,
      overdueCount: PropTypes.number,
      submittedCount: PropTypes.number,
      nextDeadline: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
    fromCache: PropTypes.bool,
  }),
  loading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  onRefresh: PropTypes.func,
  onDownloadDocument: PropTypes.func,
  onUploadDocument: PropTypes.func,
  onAcknowledgeDocument: PropTypes.func,
  onScheduleReview: PropTypes.func,
  onSnoozeAlert: PropTypes.func,
};

TaxDocumentCenter.defaultProps = {
  onDownloadDocument: () => {},
  onUploadDocument: () => {},
  onAcknowledgeDocument: () => {},
  onScheduleReview: () => {},
  onSnoozeAlert: () => {},
};
