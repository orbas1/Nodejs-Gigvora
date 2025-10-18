import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CloudIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import UserAvatar from '../UserAvatar.jsx';
import AdminOverviewProfileWizard from './AdminOverviewProfileWizard.jsx';

const numberFormatter = new Intl.NumberFormat('en-US');
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(Math.round(numeric));
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  const ratio = numeric > 1 ? numeric / 100 : numeric;
  return percentFormatter.format(Math.max(ratio, 0));
}

function formatScore(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return numeric.toFixed(1);
}

function formatDateLabel(dateString) {
  if (!dateString) {
    return { dateLabel: '—', timeLabel: '' };
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: '—', timeLabel: '' };
  }
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { dateLabel, timeLabel };
}

function MetricDetailDialog({ metric, onClose }) {
  if (!metric) {
    return null;
  }

  return (
    <Transition show as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-10">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${metric.accent}`}> 
                      <metric.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">{metric.label}</Dialog.Title>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Live snapshot</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-5 px-6 py-6">
                  <div className="rounded-3xl bg-slate-50 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current value</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.valueLabel}</p>
                  </div>

                  <dl className="grid gap-4 sm:grid-cols-2">
                    {metric.details.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
                        <dd className="mt-2 text-lg font-semibold text-slate-900">{item.value}</dd>
                        {item.caption ? <p className="mt-1 text-xs text-slate-500">{item.caption}</p> : null}
                      </div>
                    ))}
                  </dl>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function AdminOverviewPanel({ overview, saving = false, status = '', error = '', onSave, onRefresh }) {
  const profile = overview?.editableProfile ?? {};
  const weather = overview?.weather ?? null;
  const { dateLabel, timeLabel } = useMemo(() => formatDateLabel(overview?.currentDate), [overview?.currentDate]);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState(null);
  const [identityDraft, setIdentityDraft] = useState({ firstName: profile.firstName ?? '', lastName: profile.lastName ?? '' });
  const [summaryDraft, setSummaryDraft] = useState({
    headline: profile.headline ?? '',
    missionStatement: profile.missionStatement ?? '',
    bio: profile.bio ?? '',
  });
  const [locationDraft, setLocationDraft] = useState({
    avatarSeed: profile.avatarSeed ?? '',
    location: profile.location ?? '',
    timezone: profile.timezone ?? '',
  });

  useEffect(() => {
    setIdentityDraft({ firstName: profile.firstName ?? '', lastName: profile.lastName ?? '' });
  }, [profile.firstName, profile.lastName]);

  useEffect(() => {
    setSummaryDraft({
      headline: profile.headline ?? '',
      missionStatement: profile.missionStatement ?? '',
      bio: profile.bio ?? '',
    });
  }, [profile.headline, profile.missionStatement, profile.bio]);

  useEffect(() => {
    setLocationDraft({
      avatarSeed: profile.avatarSeed ?? '',
      location: profile.location ?? '',
      timezone: profile.timezone ?? '',
    });
  }, [profile.avatarSeed, profile.location, profile.timezone]);

  const greetingName = overview?.displayName || `${identityDraft.firstName} ${identityDraft.lastName}`.trim() || 'Admin';
  const followersCount = overview?.followersCount ?? overview?.metrics?.followersCount ?? 0;
  const trustScore = overview?.trustScore ?? overview?.metrics?.trustScore;
  const ratingValue = overview?.rating;
  const ratingCount = overview?.ratingCount ?? 0;
  const profileCompletion = overview?.profileCompletion ?? overview?.metrics?.profileCompletion;

  const metrics = useMemo(() => {
    return [
      {
        key: 'followers',
        label: 'Followers',
        icon: UsersIcon,
        accent: 'bg-blue-100 text-blue-600',
        valueLabel: formatNumber(followersCount),
        details: [
          { label: 'Followers', value: formatNumber(followersCount) },
          { label: 'Likes', value: formatNumber(overview?.metrics?.likesCount ?? 0) },
          { label: 'Connections', value: formatNumber(overview?.metrics?.connectionsCount ?? 0) },
        ],
      },
      {
        key: 'trust',
        label: 'Trust',
        icon: ShieldCheckIcon,
        accent: 'bg-emerald-100 text-emerald-600',
        valueLabel: formatScore(trustScore),
        details: [
          { label: 'Trust score', value: formatScore(trustScore) },
          { label: 'Level', value: overview?.metrics?.trustLevel ?? overview?.trustLevel ?? '—' },
          {
            label: 'Profile completion',
            value: formatPercent(profileCompletion),
            caption: 'Completeness influences trust',
          },
        ],
      },
      {
        key: 'rating',
        label: 'Rating',
        icon: StarIcon,
        accent: 'bg-amber-100 text-amber-600',
        valueLabel: ratingValue == null ? '—' : Number(ratingValue).toFixed(2),
        details: [
          { label: 'Average rating', value: ratingValue == null ? '—' : Number(ratingValue).toFixed(2) },
          { label: 'Reviews', value: formatNumber(ratingCount) },
          { label: 'Last updated', value: dateLabel },
        ],
      },
      {
        key: 'profile',
        label: 'Profile',
        icon: SparklesIcon,
        accent: 'bg-violet-100 text-violet-600',
        valueLabel: formatPercent(profileCompletion),
        details: [
          { label: 'Completion', value: formatPercent(profileCompletion) },
          { label: 'Timezone', value: overview?.editableProfile?.timezone || '—' },
          { label: 'Location', value: overview?.editableProfile?.location || overview?.location || '—' },
        ],
      },
    ];
  }, [followersCount, overview, profileCompletion, ratingCount, ratingValue, trustScore, dateLabel]);

  const handleWizardSubmit = async (payload = {}) => {
    if (typeof onSave !== 'function') {
      return;
    }
    await onSave(payload);
    setWizardOpen(false);
  };

  const profileSummaryRows = [
    { label: 'Email', value: overview?.email || '—' },
    { label: 'Title', value: overview?.title || profile?.title || '—' },
    { label: 'Timezone', value: overview?.timezone || profile?.timezone || '—' },
    { label: 'Location', value: overview?.location || profile?.location || '—' },
  ];

  return (
    <div className="space-y-12">
      <section
        id="overview-home"
        className="grid gap-6 rounded-[2.5rem] border border-slate-200 bg-white/95 p-8 shadow-lg shadow-blue-100/50 lg:grid-cols-[1.6fr,1fr]"
      >
        <div className="flex flex-col justify-between gap-8">
          <div className="flex items-start gap-4">
            <UserAvatar name={greetingName} seed={overview?.avatarSeed ?? profile.avatarSeed} size="xl" />
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">Hi, {greetingName}</h1>
                <p className="text-sm text-slate-500">Your dashboard updates every few seconds.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-500" /> {dateLabel}
                </span>
                {timeLabel ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
                    <SparklesIcon className="h-4 w-4 text-amber-500" /> {timeLabel}
                  </span>
                ) : null}
                {weather ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
                    <CloudIcon className="h-4 w-4 text-sky-500" />
                    {weather.temperatureC != null ? `${weather.temperatureC.toFixed(1)}°C` : '—'} · {weather.conditionLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <SparklesIcon className="h-5 w-5" /> Edit profile
            </button>
            {typeof onRefresh === 'function' ? (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <ArrowPathIcon className="h-5 w-5" /> Refresh
              </button>
            ) : null}
          </div>
        </div>

        <div id="overview-profile" className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">{summaryDraft.headline || overview?.headline || 'Add a quick headline to personalise this space.'}</p>
          <dl className="mt-6 grid gap-4 text-sm text-slate-600">
            {profileSummaryRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <dt className="text-slate-500">{row.label}</dt>
                <dd className="font-semibold text-slate-800">{row.value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="overview-metrics" className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            type="button"
            onClick={() => setActiveMetric(metric)}
            className="group flex flex-col justify-between rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${metric.accent}`}>
              <metric.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">{metric.label}</span>
            <span className="mt-3 text-3xl font-semibold text-slate-900">{metric.valueLabel}</span>
            <span className="mt-2 text-xs text-slate-500">Tap to view details</span>
          </button>
        ))}
      </section>

      {status ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">{status}</div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">{error}</div>
      ) : null}

      <AdminOverviewProfileWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        saving={saving}
        identity={identityDraft}
        summary={summaryDraft}
        location={locationDraft}
        onSubmit={handleWizardSubmit}
        onIdentityChange={setIdentityDraft}
        onSummaryChange={setSummaryDraft}
        onLocationChange={setLocationDraft}
      />

      <MetricDetailDialog metric={activeMetric} onClose={() => setActiveMetric(null)} />
    </div>
  );
}
