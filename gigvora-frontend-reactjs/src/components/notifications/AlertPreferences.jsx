import PropTypes from 'prop-types';
import { Switch } from '@headlessui/react';
import {
  BellAlertIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';
import { classNames } from '../../utils/classNames.js';

const PUSH_STATUS_COPY = {
  granted: {
    message: 'Push alerts enabled for this browser.',
    tone: 'text-emerald-600',
  },
  denied: {
    message: 'Browser blocked notifications. Enable them in settings to receive real-time alerts.',
    tone: 'text-rose-600',
  },
  unsupported: {
    message: 'Push notifications are not supported in this browser.',
    tone: 'text-amber-600',
  },
  dismissed: {
    message: 'Permission request dismissed. Try again when ready.',
    tone: 'text-slate-500',
  },
  error: {
    message: 'Something went wrong while enabling push alerts.',
    tone: 'text-rose-600',
  },
  forbidden: {
    message:
      'Your current workspace role cannot register for push notifications. Switch to an eligible membership to continue.',
    tone: 'text-rose-600',
  },
  requesting: {
    message: 'Requesting permission…',
    tone: 'text-slate-500',
  },
  idle: {
    message: '',
    tone: 'text-slate-500',
  },
};

const DIGEST_OPTIONS = [
  { value: 'realtime', label: 'Real-time alerts' },
  { value: 'hourly', label: 'Hourly digest' },
  { value: 'daily', label: 'Daily summary' },
  { value: 'weekly', label: 'Weekly briefing' },
];

function PreferenceToggle({ icon: Icon, title, description, value, onChange, disabled, id }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-inner shadow-slate-100/40">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <Switch
        checked={value}
        onChange={onChange}
        disabled={disabled}
        className={classNames(
          value ? 'bg-accent text-white' : 'bg-slate-200 text-slate-500',
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60',
        )}
        id={id}
      >
        <span className="sr-only">Toggle {title}</span>
        <span
          aria-hidden="true"
          className={classNames(
            value ? 'translate-x-5' : 'translate-x-1',
            'pointer-events-none inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white text-[0.65rem] font-semibold text-slate-500 shadow ring-0 transition',
          )}
        >
          {value ? 'On' : 'Off'}
        </span>
      </Switch>
    </div>
  );
}

PreferenceToggle.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
};

PreferenceToggle.defaultProps = {
  disabled: false,
};

export default function AlertPreferences({
  preferences,
  onChange,
  onSubmit,
  saving,
  feedback,
  error,
  pushStatus,
  onRequestPushPermission,
  canManagePush,
  loading,
  lastUpdatedAt,
}) {
  const resolvedPushStatus = PUSH_STATUS_COPY[pushStatus] ?? PUSH_STATUS_COPY.idle;
  const lastUpdatedCopy = lastUpdatedAt ? formatRelativeTime(lastUpdatedAt) : null;

  const handleToggle = (field) => (value) => {
    onChange(field, value);
    if (field === 'push' && value) {
      onRequestPushPermission?.();
    }
  };

  const handleFieldChange = (field) => (event) => {
    onChange(field, event.target.value);
  };

  const handleQuietHourChange = (field) => (event) => {
    const value = event.target.value;
    if (!/^[0-2]\d:[0-5]\d$/.test(value)) {
      onChange(field, value);
      return;
    }
    onChange(field, value);
  };

  return (
    <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/30" aria-label="Alert preferences">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Preferences</p>
        <h2 className="text-2xl font-semibold text-slate-900">Channel controls &amp; quiet hours</h2>
        <p className="text-sm text-slate-500">
          Tailor how Gigvora reaches you across urgent incidents, collaboration updates, and curated digests.
        </p>
        {lastUpdatedCopy ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
            <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Updated {lastUpdatedCopy}
          </p>
        ) : null}
      </header>

      {feedback ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm" role="status" aria-live="polite">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`pref-skeleton-${index}`} className="h-16 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <PreferenceToggle
            id="alert-preference-email"
            icon={EnvelopeIcon}
            title="Email digests"
            description="Get actionable digests straight to your inbox with context and next steps."
            value={preferences.email}
            onChange={handleToggle('email')}
          />
          <PreferenceToggle
            id="alert-preference-inapp"
            icon={ChatBubbleLeftRightIcon}
            title="In-app banners"
            description="Surface live updates inside dashboards, pipelines, and workspaces."
            value={preferences.inApp}
            onChange={handleToggle('inApp')}
          />
          <PreferenceToggle
            id="alert-preference-push"
            icon={DevicePhoneMobileIcon}
            title="Push notifications"
            description="Get real-time nudges on desktop and mobile when priorities shift."
            value={preferences.push}
            onChange={handleToggle('push')}
            disabled={!canManagePush || pushStatus === 'forbidden'}
          />
          <PreferenceToggle
            id="alert-preference-sms"
            icon={SpeakerWaveIcon}
            title="SMS escalations"
            description="Escalate critical incidents with immediate text messages to your phone."
            value={preferences.sms}
            onChange={handleToggle('sms')}
          />
        </div>
      )}

      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-inner shadow-slate-100/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Digest cadence</h3>
            <p className="mt-1 text-xs text-slate-500">Blend signal with focus time by choosing how often you hear from us.</p>
          </div>
          <BellAlertIcon className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <select
          id="alert-preference-digest"
          value={preferences.digestFrequency}
          onChange={handleFieldChange('digestFrequency')}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {DIGEST_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-inner shadow-slate-100/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Quiet hours</h3>
            <p className="mt-1 text-xs text-slate-500">Define the window where non-critical pings will respectfully wait.</p>
          </div>
          <ClockIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="alert-preference-quiet-start">
            Start
            <input
              id="alert-preference-quiet-start"
              type="time"
              value={preferences.quietHoursStart}
              onChange={handleQuietHourChange('quietHoursStart')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="alert-preference-quiet-end">
            End
            <input
              id="alert-preference-quiet-end"
              type="time"
              value={preferences.quietHoursEnd}
              onChange={handleQuietHourChange('quietHoursEnd')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <DevicePhoneMobileIcon className="h-4 w-4 text-accent" aria-hidden="true" />
          <p className={classNames('text-xs font-semibold', resolvedPushStatus.tone)}>
            {resolvedPushStatus.message || 'Enable browser alerts to receive instant updates even when you’re focused elsewhere.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestPushPermission}
          disabled={!canManagePush || pushStatus === 'requesting'}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/40 bg-white px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Request browser alerts
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Changes apply instantly across desktop, mobile, and workspace automations.
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </section>
  );
}

AlertPreferences.propTypes = {
  preferences: PropTypes.shape({
    email: PropTypes.bool,
    inApp: PropTypes.bool,
    push: PropTypes.bool,
    sms: PropTypes.bool,
    digestFrequency: PropTypes.string,
    quietHoursStart: PropTypes.string,
    quietHoursEnd: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  feedback: PropTypes.string,
  error: PropTypes.string,
  pushStatus: PropTypes.string,
  onRequestPushPermission: PropTypes.func,
  canManagePush: PropTypes.bool,
  loading: PropTypes.bool,
  lastUpdatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

AlertPreferences.defaultProps = {
  saving: false,
  feedback: '',
  error: '',
  pushStatus: 'idle',
  onRequestPushPermission: undefined,
  canManagePush: true,
  loading: false,
  lastUpdatedAt: null,
};
