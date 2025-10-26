import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const AUTO_SAVE_DELAY = 1200;

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const SEVERITY_STYLES = {
  critical: 'border-red-200/70 bg-red-50 text-red-600',
  high: 'border-amber-200/70 bg-amber-50 text-amber-600',
  medium: 'border-sky-200/70 bg-sky-50 text-sky-600',
  low: 'border-emerald-200/70 bg-emerald-50 text-emerald-600',
};

function SummaryStat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

SummaryStat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  hint: PropTypes.node,
};

SummaryStat.defaultProps = {
  hint: null,
};

function InsightCard({ insight }) {
  const Icon = insight.severity === 'critical' ? ExclamationTriangleIcon : ShieldCheckIcon;
  return (
    <article
      className={classNames(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm transition',
        SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.medium,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5" />
      <div>
        <p className="font-semibold">{insight.title}</p>
        {insight.description ? <p className="mt-1 text-xs opacity-80">{insight.description}</p> : null}
        {insight.cta ? (
          <button
            type="button"
            onClick={() => insight.onAction?.(insight)}
            className="mt-3 inline-flex items-center gap-1 rounded-full border border-current px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition hover:translate-x-0.5"
          >
            {insight.cta}
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

InsightCard.propTypes = {
  insight: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    severity: PropTypes.oneOf(['critical', 'high', 'medium', 'low']),
    cta: PropTypes.string,
    onAction: PropTypes.func,
  }).isRequired,
};

function SessionRow({ session, onTerminate }) {
  return (
    <div
      className={classNames(
        'grid gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:shadow-md',
        session.current ? 'ring-2 ring-emerald-200' : '',
        'md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center',
      )}
    >
      <div className="flex items-center gap-3">
        <DevicePhoneMobileIcon className="h-5 w-5 text-slate-400" />
        <div>
          <p className="font-semibold text-slate-900">{session.device}</p>
          <p className="text-xs text-slate-500">{session.location ?? 'Unknown location'}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last active</p>
        <p className="text-sm text-slate-700">
          {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString() : 'Active now'}
        </p>
        {session.ipAddress ? <p className="text-xs text-slate-400">IP {session.ipAddress}</p> : null}
      </div>
      <div className="flex items-center justify-end gap-2">
        {session.current ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            <ShieldCheckIcon className="h-3.5 w-3.5" /> Current
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onTerminate?.(session.id)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-red-300 hover:text-red-600"
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}

SessionRow.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.string.isRequired,
    device: PropTypes.string.isRequired,
    location: PropTypes.string,
    lastActiveAt: PropTypes.string,
    ipAddress: PropTypes.string,
    current: PropTypes.bool,
  }).isRequired,
  onTerminate: PropTypes.func,
};

SessionRow.defaultProps = {
  onTerminate: null,
};

export default function AccountSettingsForm({
  value,
  initialValue,
  busy,
  dirty,
  autoSave,
  onAutoSave,
  onSubmit,
  onFieldChange,
  securityInsights,
  sessions,
  onTerminateSession,
  metrics,
  feedback,
  error,
}) {
  const [autoSaveState, setAutoSaveState] = useState('idle');
  const autoSaveTimer = useRef(null);

  const hasDifferences = useMemo(() => {
    if (dirty != null) {
      return dirty;
    }
    try {
      return JSON.stringify(value) !== JSON.stringify(initialValue);
    } catch (comparisonError) {
      console.warn('Failed to compare account state for autosave', comparisonError);
      return true;
    }
  }, [dirty, value, initialValue]);

  useEffect(() => {
    if (!autoSave || !onAutoSave) {
      return undefined;
    }
    if (!hasDifferences || busy) {
      setAutoSaveState('idle');
      return undefined;
    }
    setAutoSaveState('pending');
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveState('saving');
      try {
        await onAutoSave(value);
        setAutoSaveState('saved');
      } catch (autoSaveError) {
        console.error('Account autosave failed', autoSaveError);
        setAutoSaveState('error');
      }
    }, AUTO_SAVE_DELAY);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [autoSave, onAutoSave, hasDifferences, value, busy]);

  useEffect(() => {
    if (autoSaveState !== 'saved') {
      return undefined;
    }
    const resetTimer = setTimeout(() => setAutoSaveState('idle'), 1800);
    return () => clearTimeout(resetTimer);
  }, [autoSaveState]);

  const insightList = securityInsights.length ? securityInsights : [
    {
      id: 'baseline-trust',
      title: 'Complete your profile story to unlock premium trust signals.',
      description: 'Teams reviewing bids prioritise talent with verified identity, bio, and verified contact channels.',
      severity: 'medium',
    },
  ];

  const summaryCards = [
    {
      label: 'Profile completion',
      value:
        metrics?.profileCompletion != null
          ? `${Math.round(Number(metrics.profileCompletion))}%`
          : `${value.firstName && value.lastName && value.email ? '72%' : '54%'}`,
      hint: metrics?.profileUpdatedAt ? `Updated ${new Date(metrics.profileUpdatedAt).toLocaleDateString()}` : 'Keep your brand story sharp.',
    },
    {
      label: 'Security posture',
      value:
        metrics?.securityScore != null
          ? `${Math.round(Number(metrics.securityScore))}/100`
          : metrics?.recommendedActions
            ? `${100 - metrics.recommendedActions * 5}/100`
            : '84/100',
      hint: metrics?.recommendedActions ? `${metrics.recommendedActions} follow-ups` : 'Enable MFA for a perfect score.',
    },
    {
      label: 'Last login',
      value: metrics?.lastLoginAt ? new Date(metrics.lastLoginAt).toLocaleString() : 'Live now',
      hint: `${sessions.filter((item) => item.current).length || 1} active session`,
    },
  ];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-inner">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Identity & security</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Account settings</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Shape how stakeholders see and trust you. Update identity, review security recommendations, and retire stale
              sessions before launch-day crunches.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              <ShieldCheckIcon className="h-4 w-4" /> Premium verified
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
              <SparklesIcon className="h-4 w-4" /> Concierge ready
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <SummaryStat key={card.label} label={card.label} value={card.value} hint={card.hint} />
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-soft"
          noValidate
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Personal profile</h3>
              <p className="text-sm text-slate-500">
                Align your brand voice and contact channels. Updates sync with invoices, booking flows, and project workrooms.
              </p>
            </div>
            <span
              className={classNames(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
                autoSaveState === 'pending'
                  ? 'border-sky-200 bg-sky-50 text-sky-600'
                  : autoSaveState === 'saving'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : autoSaveState === 'saved'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : autoSaveState === 'error'
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-slate-200 bg-slate-50 text-slate-500',
              )}
            >
              <ArrowPathIcon className={classNames('h-4 w-4', autoSaveState === 'saving' ? 'animate-spin' : '')} />
              {autoSaveState === 'pending' && 'Autosave scheduled'}
              {autoSaveState === 'saving' && 'Saving…'}
              {autoSaveState === 'saved' && 'All changes saved'}
              {autoSaveState === 'error' && 'Autosave failed'}
              {autoSaveState === 'idle' && 'Synced'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">First name</span>
              <input
                type="text"
                name="firstName"
                value={value.firstName}
                onChange={(event) => onFieldChange('firstName', event.target.value)}
                required
                autoComplete="given-name"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Last name</span>
              <input
                type="text"
                name="lastName"
                value={value.lastName}
                onChange={(event) => onFieldChange('lastName', event.target.value)}
                required
                autoComplete="family-name"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Email address</span>
              <input
                type="email"
                name="email"
                value={value.email}
                onChange={(event) => onFieldChange('email', event.target.value)}
                required
                autoComplete="email"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Mobile</span>
              <input
                type="tel"
                name="phoneNumber"
                value={value.phoneNumber}
                onChange={(event) => onFieldChange('phoneNumber', event.target.value)}
                placeholder="+44 20 7946 0958"
                autoComplete="tel"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Role / title</span>
              <input
                type="text"
                name="jobTitle"
                value={value.jobTitle}
                onChange={(event) => onFieldChange('jobTitle', event.target.value)}
                placeholder="Programme lead"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Location</span>
              <input
                type="text"
                name="location"
                value={value.location}
                onChange={(event) => onFieldChange('location', event.target.value)}
                placeholder="London, United Kingdom"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Timezone</span>
            <input
              type="text"
              name="timezone"
              value={value.timezone ?? ''}
              onChange={(event) => onFieldChange('timezone', event.target.value)}
              placeholder="Europe/London"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {hasDifferences ? 'Unsaved changes will auto-sync in seconds.' : 'Your profile is perfectly synced.'}
            </p>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <UserCircleIcon className="h-4 w-4" /> Save profile
            </button>
          </div>

          {feedback ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{feedback}</p>
          ) : null}
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</p>
          ) : null}
        </form>

        <aside className="space-y-5">
          <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Security insights</h3>
            <div className="space-y-3">
              {insightList.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-900">Active sessions</h3>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {sessions.length} devices
              </span>
            </div>
            <div className="space-y-3">
              {sessions.length ? (
                sessions.map((session) => (
                  <SessionRow key={session.id} session={session} onTerminate={onTerminateSession} />
                ))
              ) : (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  We will surface login locations, trusted devices, and active tokens once you sign in from additional devices.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

AccountSettingsForm.propTypes = {
  value: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phoneNumber: PropTypes.string,
    jobTitle: PropTypes.string,
    location: PropTypes.string,
    timezone: PropTypes.string,
  }).isRequired,
  initialValue: PropTypes.object,
  busy: PropTypes.bool,
  dirty: PropTypes.bool,
  autoSave: PropTypes.bool,
  onAutoSave: PropTypes.func,
  onSubmit: PropTypes.func,
  onFieldChange: PropTypes.func.isRequired,
  securityInsights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      severity: PropTypes.oneOf(['critical', 'high', 'medium', 'low']),
      cta: PropTypes.string,
      onAction: PropTypes.func,
    }),
  ),
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      device: PropTypes.string.isRequired,
      location: PropTypes.string,
      lastActiveAt: PropTypes.string,
      ipAddress: PropTypes.string,
      current: PropTypes.bool,
    }),
  ),
  onTerminateSession: PropTypes.func,
  metrics: PropTypes.shape({
    profileCompletion: PropTypes.number,
    profileUpdatedAt: PropTypes.string,
    securityScore: PropTypes.number,
    recommendedActions: PropTypes.number,
    lastLoginAt: PropTypes.string,
  }),
  feedback: PropTypes.string,
  error: PropTypes.string,
};

AccountSettingsForm.defaultProps = {
  initialValue: null,
  busy: false,
  dirty: null,
  autoSave: true,
  onAutoSave: null,
  onSubmit: null,
  securityInsights: [],
  sessions: [],
  onTerminateSession: null,
  metrics: null,
  feedback: '',
  error: '',
};
