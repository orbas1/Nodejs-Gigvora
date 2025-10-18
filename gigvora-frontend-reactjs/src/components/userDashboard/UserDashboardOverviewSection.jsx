import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChartBarIcon, CloudIcon, PhotoIcon, SparklesIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import {
  updateUserDashboardOverview,
  refreshUserDashboardOverviewWeather,
} from '../../services/userDashboardOverview.js';
import { formatRelativeTime } from '../../utils/date.js';
import OverviewHeroCard from './overview/OverviewHeroCard.jsx';
import OverviewStatsCard from './overview/OverviewStatsCard.jsx';
import OverviewWeatherCard from './overview/OverviewWeatherCard.jsx';
import OverviewVisualCard from './overview/OverviewVisualCard.jsx';
import HeroDrawer from './overview/HeroDrawer.jsx';
import NumbersDrawer from './overview/NumbersDrawer.jsx';
import VisualsDrawer from './overview/VisualsDrawer.jsx';
import WeatherDrawer from './overview/WeatherDrawer.jsx';
import OverviewPreviewModal from './overview/OverviewPreviewModal.jsx';
import OverviewWizardModal from './overview/OverviewWizardModal.jsx';

function buildInitialForm(overview) {
  if (!overview) {
    return {
      greetingName: '',
      headline: '',
      overview: '',
      followersCount: 0,
      followersGoal: '',
      trustScore: '',
      trustScoreLabel: '',
      rating: '',
      ratingCount: 0,
      avatarUrl: '',
      bannerImageUrl: '',
      weatherLocation: '',
      weatherUnits: 'metric',
    };
  }

  return {
    greetingName: overview.greetingName ?? '',
    headline: overview.headline ?? '',
    overview: overview.overview ?? '',
    followersCount: overview.followers?.count ?? 0,
    followersGoal: overview.followers?.goal ?? '',
    trustScore: overview.trust?.score ?? '',
    trustScoreLabel: overview.trust?.label ?? '',
    rating: overview.rating?.score ?? '',
    ratingCount: overview.rating?.count ?? 0,
    avatarUrl: overview.avatarUrl ?? '',
    bannerImageUrl: overview.bannerImageUrl ?? '',
    weatherLocation: overview.weather?.location ?? overview.weatherLocation ?? '',
    weatherUnits: overview.weather?.units ?? 'metric',
  };
}

function toNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  return numeric;
}

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return numeric;
}

function buildPayload(form) {
  return {
    greetingName: form.greetingName?.trim?.() ?? '',
    headline: form.headline?.trim?.() ?? '',
    overview: form.overview?.trim?.() ?? '',
    trustScoreLabel: form.trustScoreLabel?.trim?.() ?? '',
    avatarUrl: form.avatarUrl?.trim?.() ?? '',
    bannerImageUrl: form.bannerImageUrl?.trim?.() ?? '',
    weatherLocation: form.weatherLocation?.trim?.() ?? '',
    weatherUnits: form.weatherUnits ?? 'metric',
    followersCount: toNumber(form.followersCount, 0),
    followersGoal: toNullableNumber(form.followersGoal),
    trustScore: toNullableNumber(form.trustScore),
    rating: toNullableNumber(form.rating),
    ratingCount: toNumber(form.ratingCount, 0),
  };
}

function formatTemperature(temperature) {
  if (!temperature || temperature.value == null) {
    return '—';
  }
  const numeric = Number(temperature.value);
  if (Number.isNaN(numeric)) {
    return '—';
  }
  const suffix = temperature.unit ?? '';
  return `${numeric.toFixed(1)}${suffix}`;
}

function formatWind(windSpeed) {
  if (!windSpeed || windSpeed.value == null) {
    return '—';
  }
  const numeric = Number(windSpeed.value);
  if (Number.isNaN(numeric)) {
    return '—';
  }
  return `${numeric.toFixed(0)} ${windSpeed.unit ?? ''}`.trim();
}

export default function UserDashboardOverviewSection({ userId, overview, onOverviewUpdated }) {
  const [form, setForm] = useState(() => buildInitialForm(overview));
  const [drawer, setDrawer] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [savingTarget, setSavingTarget] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setForm(buildInitialForm(overview));
  }, [overview]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }
    const timeout = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  const canEdit = overview?.permissions?.canEdit !== false;

  const dateLabel = useMemo(() => {
    return (
      overview?.date?.formatted ??
      new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    );
  }, [overview?.date?.formatted]);

  const timeLabel = useMemo(() => {
    return (
      overview?.date?.time ??
      new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }, [overview?.date?.time]);

  const followersCount = useMemo(() => toNumber(form.followersCount, overview?.followers?.count ?? 0), [form.followersCount, overview?.followers?.count]);
  const followersGoal = useMemo(() => {
    const fromForm = toNullableNumber(form.followersGoal);
    if (fromForm != null) {
      return fromForm;
    }
    return overview?.followers?.goal ?? null;
  }, [form.followersGoal, overview?.followers?.goal]);
  const trustScore = useMemo(() => {
    const value = toNullableNumber(form.trustScore);
    if (value != null) {
      return Math.max(0, Math.min(100, value));
    }
    if (overview?.trust?.score != null) {
      return Math.max(0, Math.min(100, overview.trust.score));
    }
    return 0;
  }, [form.trustScore, overview?.trust?.score]);
  const ratingScore = useMemo(() => {
    const value = toNullableNumber(form.rating);
    if (value != null) {
      return value;
    }
    if (overview?.rating?.score != null) {
      return Number(overview.rating.score);
    }
    return null;
  }, [form.rating, overview?.rating?.score]);
  const ratingCount = useMemo(() => toNumber(form.ratingCount, overview?.rating?.count ?? 0), [form.ratingCount, overview?.rating?.count]);
  const trustLabel = form.trustScoreLabel?.trim?.().length ? form.trustScoreLabel : overview?.trust?.label;

  const heroData = useMemo(() => {
    if (!overview && !form) {
      return null;
    }

    const followersLabel = followersGoal != null
      ? `${followersCount.toLocaleString()} / ${followersGoal.toLocaleString()}`
      : followersCount.toLocaleString();

    const weather = overview?.weather;
    const temperatureLabel = weather ? formatTemperature(weather.temperature) : null;
    const weatherSummary = weather
      ? [temperatureLabel, weather.condition].filter(Boolean).join(' ')
      : null;

    const greetingName = form.greetingName?.trim?.().length
      ? form.greetingName.trim()
      : overview?.greetingName ?? 'there';

    const headline = form.headline?.trim?.().length ? form.headline.trim() : overview?.headline ?? '';
    const overviewText = form.overview?.trim?.().length ? form.overview.trim() : overview?.overview ?? '';

    return {
      greetingName,
      headline,
      overview: overviewText,
      avatarUrl: form.avatarUrl?.trim?.() || overview?.avatarUrl || null,
      bannerImageUrl: form.bannerImageUrl?.trim?.() || overview?.bannerImageUrl || null,
      dateLabel,
      timeLabel,
      weatherSummary,
      trustLabel: trustLabel ?? '',
      trustScore: Number.isFinite(trustScore) ? Number(trustScore.toFixed(1)) : 0,
      followersLabel,
      followersCount,
      followersGoal,
      ratingScore: ratingScore != null ? Number(ratingScore).toFixed(1) : '—',
      ratingCount,
    };
  }, [
    overview,
    form,
    followersGoal,
    followersCount,
    dateLabel,
    timeLabel,
    trustLabel,
    trustScore,
    ratingScore,
    ratingCount,
  ]);

  const statsData = useMemo(() => {
    if (!overview && !form) {
      return null;
    }
    return {
      followersCount: followersCount,
      followersGoal,
      trustScore: Number.isFinite(trustScore) ? Number(trustScore.toFixed(1)) : 0,
      trustLabel: trustLabel ?? '',
      ratingScore: ratingScore != null ? Number(ratingScore).toFixed(1) : '—',
      ratingCount,
    };
  }, [followersCount, followersGoal, trustScore, trustLabel, ratingScore, ratingCount, overview, form]);

  const weatherData = useMemo(() => {
    const weather = overview?.weather ?? null;
    if (!weather) {
      return {
        locationLabel: form.weatherLocation?.trim?.() || '—',
        temperature: '—',
        apparent: null,
        condition: '—',
        wind: '—',
        updatedLabel: '—',
        units: (form.weatherUnits ?? 'metric').toUpperCase(),
      };
    }

    return {
      locationLabel: form.weatherLocation?.trim?.() || weather.location || '—',
      temperature: formatTemperature(weather.temperature),
      apparent: weather.apparentTemperature ? formatTemperature(weather.apparentTemperature) : null,
      condition: weather.condition ?? '—',
      wind: formatWind(weather.windSpeed),
      updatedLabel: weather.updatedAt ? formatRelativeTime(weather.updatedAt) : 'Just now',
      units: (form.weatherUnits ?? weather.units ?? 'metric').toUpperCase(),
    };
  }, [overview?.weather, form.weatherLocation, form.weatherUnits]);

  const visualsData = useMemo(() => {
    return {
      greetingName: heroData?.greetingName ?? 'Member',
      headline: heroData?.headline ?? '—',
      avatarUrl: heroData?.avatarUrl ?? overview?.avatarUrl ?? '',
      bannerImageUrl: heroData?.bannerImageUrl ?? overview?.bannerImageUrl ?? '',
    };
  }, [heroData, overview?.avatarUrl, overview?.bannerImageUrl]);

  const persistForm = useCallback(
    async (nextForm, target, { closeDrawer = true } = {}) => {
      if (!canEdit || !userId) {
        return false;
      }

      setSavingTarget(target);
      setStatusMessage(null);
      setErrorMessage(null);

      try {
        await updateUserDashboardOverview(userId, buildPayload(nextForm));
        setForm(nextForm);
        setStatusMessage('Saved');
        if (closeDrawer) {
          setDrawer(null);
        }
        onOverviewUpdated?.();
        return true;
      } catch (error) {
        setErrorMessage(error?.body?.message ?? error?.message ?? 'Unable to save changes.');
        return false;
      } finally {
        setSavingTarget(null);
      }
    },
    [canEdit, userId, onOverviewUpdated],
  );

  const applyDraft = useCallback(
    async (partial, target) => {
      const nextForm = { ...form, ...partial };
      return persistForm(nextForm, target);
    },
    [form, persistForm],
  );

  const handleWizardSubmit = useCallback(
    async (draft) => {
      const success = await persistForm(draft, 'wizard', { closeDrawer: false });
      if (success) {
        setWizardOpen(false);
      }
    },
    [persistForm],
  );

  const handleRefreshWeather = useCallback(async () => {
    if (!canEdit || !userId) {
      return;
    }
    setRefreshing(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await refreshUserDashboardOverviewWeather(userId);
      setStatusMessage('Weather sync');
      onOverviewUpdated?.();
    } catch (error) {
      setErrorMessage(error?.body?.message ?? error?.message ?? 'Unable to refresh weather.');
    } finally {
      setRefreshing(false);
    }
  }, [canEdit, onOverviewUpdated, userId]);

  if (!overview || !userId) {
    return null;
  }

  const drawerProps = {
    hero: {
      open: drawer === 'hero',
      initialValues: {
        greetingName: form.greetingName ?? '',
        headline: form.headline ?? '',
        overview: form.overview ?? '',
      },
      onSubmit: (draft) => applyDraft(draft, 'hero'),
    },
    numbers: {
      open: drawer === 'numbers',
      initialValues: {
        followersCount: form.followersCount ?? '',
        followersGoal: form.followersGoal ?? '',
        trustScore: form.trustScore ?? '',
        trustScoreLabel: form.trustScoreLabel ?? '',
        rating: form.rating ?? '',
        ratingCount: form.ratingCount ?? '',
      },
      onSubmit: (draft) => applyDraft(draft, 'numbers'),
    },
    visuals: {
      open: drawer === 'visuals',
      initialValues: {
        avatarUrl: form.avatarUrl ?? '',
        bannerImageUrl: form.bannerImageUrl ?? '',
      },
      onSubmit: (draft) => applyDraft(draft, 'visuals'),
    },
    weather: {
      open: drawer === 'weather',
      initialValues: {
        weatherLocation: form.weatherLocation ?? '',
        weatherUnits: form.weatherUnits ?? 'metric',
      },
      onSubmit: (draft) => applyDraft(draft, 'weather'),
    },
  };

  const quickActions = useMemo(() => {
    return [
      {
        key: 'hero',
        label: 'Hero',
        icon: UserCircleIcon,
        action: canEdit ? () => setDrawer('hero') : undefined,
      },
      {
        key: 'numbers',
        label: 'Stats',
        icon: ChartBarIcon,
        action: canEdit ? () => setDrawer('numbers') : undefined,
      },
      {
        key: 'visuals',
        label: 'Images',
        icon: PhotoIcon,
        action: canEdit ? () => setDrawer('visuals') : undefined,
      },
      {
        key: 'weather',
        label: 'Sky',
        icon: CloudIcon,
        action: canEdit ? () => setDrawer('weather') : undefined,
      },
    ];
  }, [canEdit]);

  return (
    <section aria-labelledby="user-dashboard-overview-title" className="space-y-8 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
          <h2 id="user-dashboard-overview-title" className="text-2xl font-semibold text-slate-900">
            Overview
          </h2>
        </div>
        {canEdit ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDrawer(null);
                setWizardOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              <SparklesIcon className="h-4 w-4" />
              Wizard
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              Preview
            </button>
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {statusMessage ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-800">
            {statusMessage}
          </span>
        ) : null}
        {errorMessage ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-sm font-medium text-rose-800">
            {errorMessage}
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" id="user-dashboard-overview">
        <div className="space-y-6" id="user-dashboard-overview-hero">
          <OverviewHeroCard
            data={heroData}
            onEdit={canEdit ? () => setDrawer('hero') : undefined}
            canEdit={canEdit}
          />

          {canEdit ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.action}
                    disabled={!item.action}
                    className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5">
                      <Icon className="h-5 w-5" />
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div id="user-dashboard-overview-stats">
            <OverviewStatsCard
              data={statsData}
              onEdit={canEdit ? () => setDrawer('numbers') : undefined}
              canEdit={canEdit}
            />
          </div>
        </div>

        <div className="space-y-6" id="user-dashboard-overview-settings">
          <div id="user-dashboard-overview-weather">
            <OverviewWeatherCard
              data={weatherData}
              onRefresh={handleRefreshWeather}
              onEdit={canEdit ? () => setDrawer('weather') : undefined}
              canEdit={canEdit}
              refreshing={refreshing}
            />
          </div>
          <div id="user-dashboard-overview-visuals">
            <OverviewVisualCard
              data={visualsData}
              onEdit={canEdit ? () => setDrawer('visuals') : undefined}
              canEdit={canEdit}
            />
          </div>
        </div>
      </div>

      <HeroDrawer
        {...drawerProps.hero}
        onClose={() => setDrawer(null)}
        saving={savingTarget === 'hero'}
      />
      <NumbersDrawer
        {...drawerProps.numbers}
        onClose={() => setDrawer(null)}
        saving={savingTarget === 'numbers'}
      />
      <VisualsDrawer
        {...drawerProps.visuals}
        onClose={() => setDrawer(null)}
        saving={savingTarget === 'visuals'}
      />
      <WeatherDrawer
        {...drawerProps.weather}
        onClose={() => setDrawer(null)}
        saving={savingTarget === 'weather'}
      />

      <OverviewPreviewModal open={previewOpen} data={heroData} onClose={() => setPreviewOpen(false)} />
      <OverviewWizardModal
        open={wizardOpen}
        initialValues={form}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleWizardSubmit}
        saving={savingTarget === 'wizard'}
      />
    </section>
  );
}
