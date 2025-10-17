import { useEffect, useMemo, useState } from 'react';
import { updateCompanyDashboardOverview } from '../../services/company.js';
import OverviewSnapshot from './overview/OverviewSnapshot.jsx';
import OverviewStats from './overview/OverviewStats.jsx';
import OverviewSettingsDrawer from './overview/OverviewSettingsDrawer.jsx';
import OverviewStatModal from './overview/OverviewStatModal.jsx';
import {
  buildFormState,
  buildPayload,
  deriveGreeting,
  deriveLocationLabel,
  deriveTimezone,
  formatEditor,
  formatFollowers,
  formatLastUpdated,
  formatRating,
  formatTrustScore,
  getWeatherIcon,
  formatTemperature,
  formatWind,
  formatHumidity,
} from './overview/overviewUtils.js';

const statusStyles = {
  success: 'bg-emerald-50 text-emerald-700',
  error: 'bg-rose-50 text-rose-700',
  info: 'bg-slate-100 text-slate-600',
};

export default function CompanyDashboardOverviewSection({ overview, profile, workspace, onOverviewUpdated }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStat, setActiveStat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [formState, setFormState] = useState(() => buildFormState(overview));

  useEffect(() => {
    if (!drawerOpen) {
      setFormState(buildFormState(overview));
    }
  }, [overview, drawerOpen]);

  const greeting = useMemo(() => deriveGreeting(overview, profile, workspace), [overview, profile, workspace]);
  const locationLabel = useMemo(() => deriveLocationLabel(overview, profile), [overview, profile]);
  const timezone = useMemo(() => deriveTimezone(overview), [overview]);

  const metrics = useMemo(() => buildMetricCards(overview), [overview]);
  const weatherStat = useMemo(() => buildWeatherStat(overview), [overview]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!overview?.workspaceId && !workspace?.id) {
      setStatus({ type: 'error', message: 'Workspace is missing for this overview.' });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const payload = buildPayload(formState, overview, workspace);
      await updateCompanyDashboardOverview(payload);
      setStatus({ type: 'success', message: 'Overview updated.' });
      setDrawerOpen(false);
      if (typeof onOverviewUpdated === 'function') {
        await onOverviewUpdated();
      }
    } catch (error) {
      const message = error?.body?.message ?? error?.message ?? 'Unable to update overview.';
      setStatus({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  }

  const sectionStatus = status
    ? statusStyles[status.type] ?? statusStyles.info
    : null;

  return (
    <section id="company-overview" className="space-y-6">
      {sectionStatus ? (
        <div className={`rounded-3xl px-4 py-3 text-sm font-semibold ${sectionStatus}`}>
          {status.message}
        </div>
      ) : null}

      <OverviewSnapshot
        name={overview?.displayName}
        greeting={greeting}
        summary={overview?.summary}
        avatarUrl={overview?.avatarUrl}
        fallbackName={profile?.companyName ?? workspace?.name}
        dateLabel={overview?.date?.formatted}
        timezone={timezone}
        weather={overview?.weather}
        locationLabel={locationLabel}
        onEdit={() => {
          setDrawerOpen(true);
        }}
        onWeatherClick={() => {
          setActiveStat(weatherStat);
        }}
      />

      <OverviewStats
        cards={metrics}
        onSelect={(card) => {
          setActiveStat(card);
        }}
      />

      <OverviewSettingsDrawer
        open={drawerOpen}
        formState={formState}
        onChange={(key, value) => {
          setFormState((previous) => ({
            ...previous,
            [key]: value,
          }));
        }}
        onSubmit={handleSubmit}
        onClose={() => {
          setDrawerOpen(false);
        }}
        saving={saving}
      />

      <OverviewStatModal
        open={Boolean(activeStat)}
        stat={activeStat}
        onClose={() => setActiveStat(null)}
        onEdit={() => {
          setDrawerOpen(true);
        }}
      />
    </section>
  );
}

function buildMetricCards(overview) {
  const followers = formatFollowers(overview?.followerCount);
  const trust = formatTrustScore(overview?.trustScore);
  const rating = formatRating(overview?.rating);
  const updatedAt = formatLastUpdated(overview);
  const editor = formatEditor(overview);

  return [
    {
      key: 'followers',
      label: 'Followers',
      value: followers,
      subLabel: 'Brand reach',
      details: [`${followers} people follow this workspace.`, `Last edit ${updatedAt} by ${editor}.`],
    },
    {
      key: 'trust',
      label: 'Trust',
      value: trust,
      subLabel: 'Scale 0-100',
      details: [`Trust score is ${trust} out of 100.`, `Last edit ${updatedAt} by ${editor}.`],
    },
    {
      key: 'rating',
      label: 'Rating',
      value: rating,
      subLabel: 'Candidate reviews',
      details: [`Average review rating is ${rating}.`, `Last edit ${updatedAt} by ${editor}.`],
    },
    {
      key: 'updated',
      label: 'Updated',
      value: updatedAt,
      subLabel: `By ${editor}`,
      details: [`Most recent update on ${updatedAt}.`, `Editor: ${editor}.`],
    },
  ];
}

function buildWeatherStat(overview) {
  const weather = overview?.weather ?? null;
  const temperature = formatTemperature(weather);
  const wind = formatWind(weather);
  const humidity = formatHumidity(weather);
  const icon = getWeatherIcon(weather?.icon);

  const details = [];
  if (temperature !== '—') {
    details.push(`Temperature ${temperature}.`);
  }
  if (weather?.description) {
    details.push(weather.description);
  }
  if (wind) {
    details.push(`Wind ${wind}.`);
  }
  if (humidity) {
    details.push(`Humidity ${humidity}.`);
  }
  if (weather?.feelsLike != null) {
    const unit = weather.temperatureUnit ?? '°C';
    details.push(`Feels like ${Math.round(Number(weather.feelsLike))}${unit}.`);
  }

  return {
    key: 'weather',
    label: 'Weather',
    value: `${temperature} ${icon}`.trim(),
    subLabel: weather?.description ?? 'Live weather',
    details,
  };
}
