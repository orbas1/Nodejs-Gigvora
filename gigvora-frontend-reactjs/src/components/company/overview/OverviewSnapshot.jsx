import UserAvatar from '../../UserAvatar.jsx';
import {
  formatHumidity,
  formatTemperature,
  formatWind,
  getWeatherIcon,
} from './overviewUtils.js';

export default function OverviewSnapshot({
  name,
  greeting,
  summary,
  avatarUrl,
  fallbackName,
  dateLabel,
  timezone,
  weather,
  locationLabel,
  onEdit,
  onWeatherClick,
}) {
  const resolvedName = name || fallbackName || 'Workspace';
  const temperature = formatTemperature(weather);
  const wind = formatWind(weather);
  const humidity = formatHumidity(weather);
  const icon = getWeatherIcon(weather?.icon);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)]">
      <article className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <UserAvatar name={resolvedName} imageUrl={avatarUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-500">{greeting}</p>
            <h1 className="mt-1 truncate text-3xl font-semibold text-slate-900">{resolvedName}</h1>
            {summary ? (
              <p className="mt-3 text-sm text-slate-600 line-clamp-3">{summary}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {locationLabel ? (
              <span className="font-medium text-slate-700">{locationLabel}</span>
            ) : (
              <span className="text-slate-400">Add a location in settings</span>
            )}
            {timezone ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{timezone}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            Customize
          </button>
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{dateLabel ?? '—'}</p>
          {timezone ? <p className="text-xs text-slate-500">{timezone}</p> : null}
        </div>

        <button
          type="button"
          onClick={onWeatherClick}
          className="flex h-full flex-col justify-between rounded-3xl border border-blue-100 bg-blue-50/70 p-5 text-left shadow-lg transition hover:border-blue-200 hover:bg-blue-50"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Weather</p>
              <p className="mt-2 text-2xl font-semibold text-blue-900">{temperature}</p>
              <p className="mt-1 text-sm text-blue-700">{weather?.description ?? 'Unavailable'}</p>
            </div>
            <span className="text-4xl" aria-hidden="true">
              {icon}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-blue-700">
            {wind ? <span>Wind {wind}</span> : null}
            {humidity ? <span>Humidity {humidity}</span> : null}
            {weather?.feelsLike != null ? (
              <span>Feels {Math.round(Number(weather.feelsLike))}{weather.temperatureUnit ?? '°C'}</span>
            ) : null}
          </div>
        </button>
      </div>
    </div>
  );
}
