import PropTypes from 'prop-types';
import { ArrowPathIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function OverviewWeatherCard({ data, onRefresh, onEdit, canEdit, refreshing }) {
  if (!data) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-slate-900/5 p-3 text-slate-900">
            <MapPinIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Weather</h3>
            <p className="text-sm font-medium text-slate-500">{data.locationLabel}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Edit
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={!canEdit || refreshing}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Temp</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.temperature}</p>
          {data.apparent ? <p className="text-xs font-medium text-slate-400">Feels {data.apparent}</p> : null}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sky</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{data.condition}</p>
          <p className="text-xs font-medium text-slate-400">Wind {data.wind}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sync</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{data.updatedLabel}</p>
          <p className="text-xs font-medium text-slate-400">Units {data.units}</p>
        </div>
      </div>
    </section>
  );
}

OverviewWeatherCard.propTypes = {
  data: PropTypes.shape({
    locationLabel: PropTypes.string,
    temperature: PropTypes.string,
    apparent: PropTypes.string,
    condition: PropTypes.string,
    wind: PropTypes.string,
    updatedLabel: PropTypes.string,
    units: PropTypes.string,
  }),
  onRefresh: PropTypes.func,
  onEdit: PropTypes.func,
  canEdit: PropTypes.bool,
  refreshing: PropTypes.bool,
};
