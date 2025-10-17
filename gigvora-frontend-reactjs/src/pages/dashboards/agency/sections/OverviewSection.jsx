import { useMemo, useState } from 'react';
import {
  BoltIcon,
  CloudIcon,
  CloudRainIcon,
  CloudSnowIcon,
  SparklesIcon,
  SunIcon,
} from '@heroicons/react/24/solid';
import {
  Bars3BottomLeftIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../../../../components/UserAvatar.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
import { formatAbsolute } from '../../../../utils/date.js';
import OverviewEditorDrawer from './OverviewEditorDrawer.jsx';
import HighlightDetailDialog from './HighlightDetailDialog.jsx';
import MetricDetailDialog from './MetricDetailDialog.jsx';
import WeatherDetailDialog from './WeatherDetailDialog.jsx';

const WEATHER_ICON_MAP = {
  clear: SunIcon,
  cloudy: CloudIcon,
  fog: Bars3BottomLeftIcon,
  drizzle: CloudRainIcon,
  rain: CloudRainIcon,
  snow: CloudSnowIcon,
  storm: BoltIcon,
};

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toLocaleString();
}

function formatScore(value, { suffix = '', decimals = 1 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const numeric = Number(value);
  return `${numeric.toFixed(decimals)}${suffix}`;
}

function resolveWeatherIcon(weather) {
  const category = weather?.category ?? 'unknown';
  return WEATHER_ICON_MAP[category] ?? SparklesIcon;
}

function describeWeather(weather) {
  if (!weather) {
    return 'Add a weather location';
  }
  const chunks = [];
  if (weather.description) {
    chunks.push(weather.description);
  }
  if (Number.isFinite(Number(weather.temperatureC))) {
    chunks.push(`${Number(weather.temperatureC).toFixed(0)}°C`);
  }
  if (Number.isFinite(Number(weather.windSpeedKph))) {
    chunks.push(`${Number(weather.windSpeedKph).toFixed(0)} km/h`);
  }
  return chunks.join(' • ');
}

function resolveMetricStatus(id, value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return { label: 'No data', tone: 'text-slate-400' };
  }

  if (id === 'trust') {
    if (numeric >= 80) return { label: 'Strong', tone: 'text-emerald-500' };
    if (numeric >= 50) return { label: 'Steady', tone: 'text-amber-500' };
    return { label: 'Watch', tone: 'text-rose-500' };
  }

  if (id === 'rating') {
    if (numeric >= 4.4) return { label: 'Loved', tone: 'text-emerald-500' };
    if (numeric >= 3.5) return { label: 'Good', tone: 'text-amber-500' };
    return { label: 'Low', tone: 'text-rose-500' };
  }

  if (id === 'followers') {
    if (numeric >= 10000) return { label: 'Viral', tone: 'text-sky-500' };
    if (numeric >= 1000) return { label: 'Active', tone: 'text-indigo-500' };
    if (numeric > 0) return { label: 'Growing', tone: 'text-emerald-500' };
    return { label: 'Start', tone: 'text-slate-400' };
  }

  return { label: 'Live', tone: 'text-slate-500' };
}

export default function OverviewSection({
  overview,
  workspace,
  loading,
  error,
  onRefresh,
  fromCache,
  lastUpdated,
  onSave,
  saving,
  canManage,
  workspaceOptions = [],
  selectedWorkspaceId,
  onWorkspaceChange,
  currentDate,
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);
  const [weatherDetailOpen, setWeatherDetailOpen] = useState(false);

  const displayOverview = useMemo(() => overview ?? {}, [overview]);
  const displayName = displayOverview.greetingName || workspace?.name || 'Team';
  const headline = displayOverview.greetingHeadline || "Let's win today.";
  const summary = displayOverview.overviewSummary || '';
  const avatarUrl = displayOverview.avatarUrl || null;
  const weather = displayOverview.weather ?? null;

  const stats = [
    {
      id: 'followers',
      label: 'Followers',
      value: formatNumber(displayOverview.followerCount),
      rawValue: Number(displayOverview.followerCount ?? 0),
      icon: UsersIcon,
      tone: 'bg-sky-50 text-sky-700',
      detailSuffix: '',
    },
    {
      id: 'trust',
      label: 'Trust',
      value:
        displayOverview.trustScore == null
          ? '—'
          : formatScore(displayOverview.trustScore, { suffix: '/100', decimals: 0 }),
      rawValue: displayOverview.trustScore == null ? null : Number(displayOverview.trustScore),
      icon: ShieldCheckIcon,
      tone: 'bg-emerald-50 text-emerald-700',
      detailSuffix: '/100',
    },
    {
      id: 'rating',
      label: 'Rating',
      value:
        displayOverview.rating == null
          ? '—'
          : formatScore(displayOverview.rating, { suffix: '/5', decimals: 1 }),
      rawValue: displayOverview.rating == null ? null : Number(displayOverview.rating),
      icon: StarIcon,
      tone: 'bg-amber-50 text-amber-700',
      detailSuffix: '/5',
    },
  ].map((stat) => ({
    ...stat,
    status: resolveMetricStatus(stat.id, stat.rawValue),
  }));

  const highlights = Array.isArray(displayOverview.highlights) ? displayOverview.highlights : [];

  const formattedDate = formatAbsolute(
    currentDate ? new Date(currentDate) : new Date(),
    {
      dateStyle: 'full',
      timeStyle: 'short',
    },
  );

  const WeatherIcon = resolveWeatherIcon(weather);

  const handleOpenEditor = () => {
    if (!canManage) return;
    setEditorOpen(true);
  };

  const handleSave = async (payload) => {
    const targetWorkspaceId = workspace?.id ?? displayOverview.workspaceId ?? null;
    if (!targetWorkspaceId) {
      return onSave?.(payload);
    }
    await onSave?.({ ...payload, workspaceId: targetWorkspaceId });
  };

  const showWorkspaceSelect = workspaceOptions.length > 1 && typeof onWorkspaceChange === 'function';

  return (
    <section id="agency-overview" className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Home</p>
          <h2 className="text-3xl font-semibold text-slate-900">Home</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {showWorkspaceSelect ? (
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <span>Workspace</span>
              <select
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                value={selectedWorkspaceId ?? ''}
                onChange={onWorkspaceChange}
                disabled={loading}
              >
                {workspaceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <DataStatus
            loading={loading}
            error={error}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={onRefresh}
            statusLabel="Home data"
          />
          {canManage ? (
            <button
              type="button"
              onClick={handleOpenEditor}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-60"
              disabled={loading}
            >
              Edit
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <div className="rounded-4xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-soft">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <UserAvatar name={displayName} imageUrl={avatarUrl} size="xl" />
                <div>
                  <p className="text-sm text-white/70">Hi, {displayName}</p>
                  <p className="mt-1 text-4xl font-semibold text-white">{headline}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.35em] text-white/60">{formattedDate}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/80 shadow-inner">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-3xl bg-white/10">
                    <WeatherIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">Weather</p>
                    <p className="text-sm font-semibold text-white">{displayOverview.weatherLocation || 'Set location'}</p>
                    <p className="text-xs text-white/70">{describeWeather(weather)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWeatherDetailOpen(true)}
                  className="mt-4 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/50 hover:bg-white/20"
                >
                  Expand
                </button>
              </div>
            </div>
            {summary ? <p className="mt-6 text-sm text-white/80">{summary}</p> : null}
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-900">Metrics</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <button
                  type="button"
                  key={stat.id}
                  onClick={() => setActiveMetric(stat)}
                  className="group flex h-full flex-col items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${stat.tone}`}>
                    <stat.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                    <p className={`text-xs font-semibold ${stat.status.tone}`}>{stat.status.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Wins</h3>
              {canManage ? (
                <button
                  type="button"
                  onClick={handleOpenEditor}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Manage
                </button>
              ) : null}
            </div>

            {highlights.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {highlights.map((highlight) => (
                  <button
                    type="button"
                    key={highlight.id}
                    onClick={() => setActiveHighlight(highlight)}
                    className="flex h-full flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white"
                  >
                    {highlight.imageUrl ? (
                      <img
                        src={highlight.imageUrl}
                        alt={highlight.title}
                        className="h-32 w-full object-cover"
                      />
                    ) : null}
                    <div className="space-y-2 px-4 pb-4 pt-2">
                      <p className="text-sm font-semibold text-slate-900">{highlight.title}</p>
                      {highlight.summary ? (
                        <p className="text-xs text-slate-500 line-clamp-2">{highlight.summary}</p>
                      ) : null}
                      <span className="text-xs font-semibold text-accent">Open</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <p className="text-sm font-semibold text-slate-500">Add highlight cards to show your key wins.</p>
                {canManage ? (
                  <button
                    type="button"
                    onClick={handleOpenEditor}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Create card
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Weather</h3>
                <p className="text-xs text-slate-500">{displayOverview.weatherLocation || 'Set location'}</p>
              </div>
              <button
                type="button"
                onClick={() => setWeatherDetailOpen(true)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                View
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900/5 text-slate-900">
                  <WeatherIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-slate-900">
                    {Number.isFinite(Number(weather?.temperatureC))
                      ? `${Number(weather.temperatureC).toFixed(0)}°C`
                      : '—'}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Now</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">{describeWeather(weather)}</p>
              {weather?.observedAt ? (
                <p className="text-xs text-slate-400">Updated {formatAbsolute(weather.observedAt, { timeStyle: 'short' })}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <OverviewEditorDrawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialOverview={displayOverview}
        onSubmit={handleSave}
        saving={saving}
        workspaceName={workspace?.name}
      />

      <HighlightDetailDialog open={Boolean(activeHighlight)} onClose={() => setActiveHighlight(null)} highlight={activeHighlight} />
      <MetricDetailDialog
        open={Boolean(activeMetric)}
        onClose={() => setActiveMetric(null)}
        metric={activeMetric}
        lastUpdated={lastUpdated}
        onEdit={canManage ? handleOpenEditor : undefined}
      />
      <WeatherDetailDialog
        open={weatherDetailOpen}
        onClose={() => setWeatherDetailOpen(false)}
        weather={weather}
        location={displayOverview.weatherLocation}
        coordinates={{
          latitude: displayOverview.weatherLatitude,
          longitude: displayOverview.weatherLongitude,
        }}
        lastUpdated={lastUpdated}
        onEdit={canManage ? handleOpenEditor : undefined}
      />
    </section>
  );
}
