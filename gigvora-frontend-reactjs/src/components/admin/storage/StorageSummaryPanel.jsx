import PropTypes from 'prop-types';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

function SummaryCard({ label, value, helper, Icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon ? <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" /> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  helper: PropTypes.string,
  Icon: PropTypes.elementType,
};

export default function StorageSummaryPanel({
  summaryCards,
  loading,
  summary,
  primaryLocation,
  statusMessage,
  error,
  onRefresh,
  onAuditNavigate,
}) {
  return (
    <section id="storage-summary" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Snapshot</h2>
          <p className="mt-1 text-sm text-slate-500">Live usage and health for storage.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin text-accent' : 'text-slate-500'}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
                aria-hidden="true"
              />
            ))
          : summaryCards.map((card) => (
              <SummaryCard key={card.label} {...card} />
            ))}
      </div>

      {primaryLocation ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-400">Primary site</p>
              <p className="text-lg font-semibold text-slate-900">{primaryLocation.name}</p>
              <p className="text-sm text-slate-500">
                {primaryLocation.providerLabel || primaryLocation.provider}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                {primaryLocation.status === 'active' ? 'Healthy' : primaryLocation.status}
              </div>
              <button
                type="button"
                onClick={() => onAuditNavigate?.()}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-accent/40 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                Audit log
              </button>
            </div>
          </div>
          {summary?.hasHealthyPrimary === false ? (
            <p className="mt-3 text-sm font-medium text-rose-600">Primary site is not marked healthy.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

StorageSummaryPanel.propTypes = {
  summaryCards: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      helper: PropTypes.string,
      Icon: PropTypes.elementType,
    }),
  ),
  loading: PropTypes.bool,
  summary: PropTypes.object,
  primaryLocation: PropTypes.shape({
    name: PropTypes.string,
    status: PropTypes.string,
    provider: PropTypes.string,
    providerLabel: PropTypes.string,
  }),
  statusMessage: PropTypes.string,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
  onAuditNavigate: PropTypes.func,
};

StorageSummaryPanel.defaultProps = {
  summaryCards: [],
  loading: false,
  summary: null,
  primaryLocation: null,
  statusMessage: '',
  error: '',
  onRefresh: undefined,
  onAuditNavigate: undefined,
};
