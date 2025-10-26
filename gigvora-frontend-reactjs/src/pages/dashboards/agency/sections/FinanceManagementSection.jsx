import PropTypes from 'prop-types';
import DataStatus from '../../../../components/DataStatus.jsx';
import FinanceControlTowerFeature from '../../../../components/dashboard/FinanceControlTowerFeature.jsx';

export default function FinanceManagementSection({
  anchorId = 'agency-finance',
  title = 'Finance management',
  loading,
  error,
  fromCache,
  lastUpdated,
  onRefresh,
  statusLabel = 'Finance data',
  highlights = [],
  currency = 'USD',
  ownerId,
}) {
  return (
    <section id={anchorId} className="space-y-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Finance</p>
          <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
        </div>
        <DataStatus
          loading={loading}
          error={error}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          statusLabel={statusLabel}
        />
      </header>

      {highlights.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{item.formatted}</p>
              {item.helper ? <p className="mt-2 text-xs text-slate-500">{item.helper}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      <FinanceControlTowerFeature userId={ownerId} currency={currency} />
    </section>
  );
}

FinanceManagementSection.propTypes = {
  anchorId: PropTypes.string,
  title: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  onRefresh: PropTypes.func,
  statusLabel: PropTypes.string,
  highlights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      formatted: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      helper: PropTypes.string,
    }),
  ),
  currency: PropTypes.string,
  ownerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

FinanceManagementSection.defaultProps = {
  anchorId: 'agency-finance',
  title: 'Finance management',
  loading: false,
  error: null,
  fromCache: false,
  lastUpdated: null,
  onRefresh: undefined,
  statusLabel: 'Finance data',
  highlights: [],
  currency: 'USD',
  ownerId: undefined,
};
