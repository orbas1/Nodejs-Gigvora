import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  BellAlertIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

const CHANNELS = [
  { key: 'email', label: 'Email', description: 'Executive-ready digest with contextual links.' },
  { key: 'push', label: 'Push', description: 'Instant nudges for time-sensitive moves.' },
  { key: 'sms', label: 'SMS', description: 'Escalations for high-severity milestones.' },
  { key: 'inApp', label: 'In-app', description: 'Keeps bell + workspace aligned.' },
];

const CATEGORY_GROUPS = [
  {
    key: 'opportunities',
    label: 'Opportunities',
    icon: BoltIcon,
    description: 'Introductions, briefs, and deal-flow that unblock growth.',
  },
  {
    key: 'community',
    label: 'Community',
    icon: ChatBubbleLeftRightIcon,
    description: 'Mentions, replies, and guild momentum you champion.',
  },
  {
    key: 'product',
    label: 'Product & launches',
    icon: Cog6ToothIcon,
    description: 'Platform updates, rollouts, and release health.',
  },
  {
    key: 'finance',
    label: 'Finance & trust',
    icon: BellAlertIcon,
    description: 'Payouts, compliance, and security escalations.',
  },
];

const CATEGORY_CADENCE_OPTIONS = [
  { value: 'priority', label: 'Immediate priority' },
  { value: 'hourly', label: 'Hourly digest' },
  { value: 'daily', label: 'Daily summary' },
  { value: 'muted', label: 'Muted for now' },
];

const DEFAULT_PREFERENCES = {
  channels: {
    email: true,
    push: true,
    sms: false,
    inApp: true,
  },
  categories: {
    opportunities: { enabled: true, cadence: 'priority' },
    community: { enabled: true, cadence: 'daily' },
    product: { enabled: true, cadence: 'daily' },
    finance: { enabled: true, cadence: 'priority' },
  },
  quietHours: { start: '21:00', end: '07:00', timezone: 'UTC' },
  digest: { frequency: 'daily', sendAt: '08:00' },
  escalation: {
    smsForCritical: false,
    emailFollowUp: true,
    includeWeeklySummary: true,
  },
};

function normalisePreferences(preferences) {
  if (!preferences) {
    return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
  }
  const base = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
  if (preferences.channels && typeof preferences.channels === 'object') {
    base.channels = { ...base.channels, ...preferences.channels };
  }
  if (preferences.categories && typeof preferences.categories === 'object') {
    for (const key of Object.keys(base.categories)) {
      base.categories[key] = {
        ...base.categories[key],
        ...(preferences.categories[key] && typeof preferences.categories[key] === 'object'
          ? preferences.categories[key]
          : {}),
      };
    }
  }
  if (preferences.quietHours && typeof preferences.quietHours === 'object') {
    base.quietHours = { ...base.quietHours, ...preferences.quietHours };
  }
  if (preferences.digest && typeof preferences.digest === 'object') {
    base.digest = { ...base.digest, ...preferences.digest };
  }
  if (preferences.escalation && typeof preferences.escalation === 'object') {
    base.escalation = { ...base.escalation, ...preferences.escalation };
  }
  return base;
}

function buildPayload(state) {
  return {
    channels: { ...state.channels },
    categories: Object.fromEntries(
      Object.entries(state.categories).map(([key, value]) => [
        key,
        {
          enabled: Boolean(value.enabled),
          cadence: value.cadence || 'daily',
        },
      ]),
    ),
    quietHours: {
      start: state.quietHours.start || null,
      end: state.quietHours.end || null,
      timezone: state.quietHours.timezone || 'UTC',
    },
    digest: {
      frequency: state.digest.frequency || 'daily',
      sendAt: state.digest.sendAt || null,
    },
    escalation: {
      smsForCritical: Boolean(state.escalation.smsForCritical),
      emailFollowUp: Boolean(state.escalation.emailFollowUp),
      includeWeeklySummary: Boolean(state.escalation.includeWeeklySummary),
    },
    metadata: {
      lastReviewedAt: new Date().toISOString(),
      preferencesVersion: '2024-notification-suite',
    },
  };
}

export default function AlertPreferences({
  initialPreferences,
  onSave,
  saving,
  error,
  onResetError,
  onTestNotification,
}) {
  const [form, setForm] = useState(() => normalisePreferences(initialPreferences));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setForm(normalisePreferences(initialPreferences));
    setTouched(false);
  }, [initialPreferences]);

  const activeChannelCount = useMemo(
    () => Object.values(form.channels).filter(Boolean).length,
    [form.channels],
  );

  const activeCategoryCount = useMemo(
    () => Object.values(form.categories).filter((category) => category.enabled).length,
    [form.categories],
  );

  const priorityStreams = useMemo(
    () =>
      Object.entries(form.categories)
        .filter(([, category]) => category.enabled && category.cadence === 'priority')
        .map(([key]) => key),
    [form.categories],
  );

  const quietHoursCopy = useMemo(() => {
    if (!form.quietHours.start || !form.quietHours.end) {
      return 'Quiet hours are currently disabled.';
    }
    return `Snoozing between ${form.quietHours.start} and ${form.quietHours.end} (${form.quietHours.timezone || 'UTC'}).`;
  }, [form.quietHours]);

  const handleChannelToggle = (key) => (event) => {
    setTouched(true);
    setForm((previous) => ({
      ...previous,
      channels: { ...previous.channels, [key]: event.target.checked },
    }));
    if (error && onResetError) {
      onResetError();
    }
  };

  const handleCategoryToggle = (key) => (event) => {
    setTouched(true);
    setForm((previous) => ({
      ...previous,
      categories: {
        ...previous.categories,
        [key]: { ...previous.categories[key], enabled: event.target.checked },
      },
    }));
    if (error && onResetError) {
      onResetError();
    }
  };

  const handleCategoryCadence = (key) => (event) => {
    setTouched(true);
    setForm((previous) => ({
      ...previous,
      categories: {
        ...previous.categories,
        [key]: { ...previous.categories[key], cadence: event.target.value },
      },
    }));
    if (error && onResetError) {
      onResetError();
    }
  };

  const handleQuietHoursChange = (field) => (event) => {
    setTouched(true);
    setForm((previous) => ({
      ...previous,
      quietHours: { ...previous.quietHours, [field]: event.target.value },
    }));
    if (error && onResetError) {
      onResetError();
    }
  };

  const handleDigestChange = (field) => (event) => {
    setTouched(true);
    setForm((previous) => ({
      ...previous,
      digest: { ...previous.digest, [field]: event.target.value },
    }));
    if (error && onResetError) {
      onResetError();
    }
  };

  const handleEscalationToggle = (field) => (event) => {
    setTouched(true);
    setForm((previous) => ({
      ...previous,
      escalation: { ...previous.escalation, [field]: event.target.checked },
    }));
    if (error && onResetError) {
      onResetError();
    }
  };

  const handleReset = () => {
    setForm(normalisePreferences(initialPreferences));
    setTouched(false);
    if (onResetError) {
      onResetError();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = buildPayload(form);
    const result = await onSave(payload);
    if (result !== false) {
      setTouched(false);
    }
  };

  const handleTestNotification = async () => {
    if (onTestNotification) {
      await onTestNotification(buildPayload(form));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Channels</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{activeChannelCount} active</h3>
          <p className="mt-1 text-xs text-slate-500">Tailor delivery for desktop, mobile, and concierge flows.</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Streams</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{activeCategoryCount} curated</h3>
          <p className="mt-1 text-xs text-slate-500">Activate the threads that propel your week.</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Priority</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{priorityStreams.length} realtime</h3>
          <p className="mt-1 text-xs text-slate-500">We will override quiet hours for these mission-critical alerts.</p>
        </article>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Delivery channels</h2>
            <p className="text-xs text-slate-500">Choose the blend that mirrors your daily rhythm.</p>
          </div>
          <ClockIcon className="h-6 w-6 text-slate-300" />
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHANNELS.map((channel) => (
            <label
              key={channel.key}
              className={classNames(
                'flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm transition',
                form.channels[channel.key]
                  ? 'border-accent/50 bg-accent/10 text-slate-900 shadow-sm shadow-accent/10'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:text-slate-900',
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold">{channel.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(form.channels[channel.key])}
                  onChange={handleChannelToggle(channel.key)}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                />
              </span>
              <span className="text-xs text-slate-500">{channel.description}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Alert categories</h2>
            <p className="text-xs text-slate-500">Dial the intensity for each stream.</p>
          </div>
          <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          {CATEGORY_GROUPS.map((category) => {
            const Icon = category.icon;
            const config = form.categories[category.key];
            return (
              <div
                key={category.key}
                className={classNames(
                  'flex flex-col gap-3 rounded-2xl border px-4 py-4 transition',
                  config?.enabled
                    ? 'border-accent/40 bg-white shadow-sm shadow-accent/10'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{category.label}</p>
                      <p className="text-xs text-slate-500">{category.description}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(config?.enabled)}
                    onChange={handleCategoryToggle(category.key)}
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                </div>
                <label className="flex flex-col gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Cadence</span>
                  <select
                    value={config?.cadence ?? 'daily'}
                    onChange={handleCategoryCadence(category.key)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {CATEGORY_CADENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Quiet hours & digest</h2>
            <p className="text-xs text-slate-500">Respect deep work while keeping executive visibility.</p>
          </div>
          <EnvelopeIcon className="h-6 w-6 text-blue-400" />
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Quiet hours start</span>
            <input
              type="time"
              value={form.quietHours.start ?? ''}
              onChange={handleQuietHoursChange('start')}
              className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Quiet hours end</span>
            <input
              type="time"
              value={form.quietHours.end ?? ''}
              onChange={handleQuietHoursChange('end')}
              className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Timezone</span>
            <input
              type="text"
              value={form.quietHours.timezone ?? 'UTC'}
              onChange={handleQuietHoursChange('timezone')}
              placeholder="UTC"
              className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
            {quietHoursCopy}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Digest frequency</span>
            <select
              value={form.digest.frequency ?? 'daily'}
              onChange={handleDigestChange('frequency')}
              className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Digest send time</span>
            <input
              type="time"
              value={form.digest.sendAt ?? ''}
              onChange={handleDigestChange('sendAt')}
              className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Escalation safety net</h2>
            <p className="text-xs text-slate-500">Ensure critical alerts get through—even during deep focus.</p>
          </div>
          <BellAlertIcon className="h-6 w-6 text-rose-500" />
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(form.escalation.smsForCritical)}
              onChange={handleEscalationToggle('smsForCritical')}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">SMS when severity is critical</span>
              <span className="text-xs text-slate-500">Ideal for finance, compliance, or security incidents.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(form.escalation.emailFollowUp)}
              onChange={handleEscalationToggle('emailFollowUp')}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Email follow-up with resolution links</span>
              <span className="text-xs text-slate-500">Bundles context so you can delegate or close the loop quickly.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 sm:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(form.escalation.includeWeeklySummary)}
              onChange={handleEscalationToggle('includeWeeklySummary')}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Include weekly accountability summary</span>
              <span className="text-xs text-slate-500">We will package resolved incidents, owners, and outstanding actions.</span>
            </span>
          </label>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error.message || 'Unable to update preferences right now.'}
        </div>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestNotification}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            disabled={saving}
          >
            <BoltIcon className="h-4 w-4" /> Send test alert
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
            disabled={saving}
          >
            Reset
          </button>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={saving || !touched}
        >
          <CheckCircleIcon className={classNames('h-4 w-4', saving ? 'animate-spin' : '')} />
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </footer>
    </form>
  );
}

AlertPreferences.propTypes = {
  initialPreferences: PropTypes.shape({
    channels: PropTypes.object,
    categories: PropTypes.object,
    quietHours: PropTypes.object,
    digest: PropTypes.object,
    escalation: PropTypes.object,
  }),
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onResetError: PropTypes.func,
  onTestNotification: PropTypes.func,
};

AlertPreferences.defaultProps = {
  initialPreferences: null,
  saving: false,
  error: null,
  onResetError: undefined,
  onTestNotification: undefined,
};
