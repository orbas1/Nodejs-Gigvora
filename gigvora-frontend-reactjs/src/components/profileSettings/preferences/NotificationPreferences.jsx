import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  BellAlertIcon,
  BellSnoozeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const PRESETS = [
  {
    key: 'immersive',
    label: 'Immersive updates',
    description: 'Stay ahead with every opportunity, collaboration, and community signal delivered instantly.',
    badge: 'All channels',
  },
  {
    key: 'focused',
    label: 'Focused workflow',
    description: 'Highlight mission-critical operations: programme changes, contract alerts, and VIP messages.',
    badge: 'Mission critical',
  },
  {
    key: 'quiet-hours',
    label: 'Quiet hours',
    description: 'Mute non-essential noise while preserving escalations and compliance notifications during downtime.',
    badge: 'Zen mode',
  },
];

const CHANNELS = [
  {
    key: 'email',
    label: 'Email',
    description: 'Detailed digests, invoicing, and compliance confirmations.',
    icon: EnvelopeIcon,
  },
  {
    key: 'push',
    label: 'Push',
    description: 'Real-time nudges for pipeline changes and team mentions.',
    icon: DevicePhoneMobileIcon,
  },
  {
    key: 'sms',
    label: 'SMS',
    description: 'High-sensitivity alerts such as new device sign-ins.',
    icon: SignalIcon,
  },
  {
    key: 'inApp',
    label: 'In-app',
    description: 'Inbox, dashboards, and broadcast updates across workspaces.',
    icon: ChatBubbleOvalLeftEllipsisIcon,
  },
];

const CATEGORIES = [
  { key: 'opportunities', label: 'Opportunities', description: 'Saved searches, matched briefs, and shortlist changes.' },
  { key: 'platform', label: 'Platform health', description: 'Downtime, product releases, and billing updates.' },
  { key: 'compliance', label: 'Compliance & trust', description: 'Policy updates, contract reminders, and security checks.' },
  { key: 'community', label: 'Community & social', description: 'Mentions, comments, endorsements, and collaboration invites.' },
];

const DEVICES = [
  { key: 'mobilePush', label: 'Mobile push', description: 'iOS + Android concierge' },
  { key: 'webPush', label: 'Desktop push', description: 'Chrome, Edge, Safari' },
  { key: 'email', label: 'Email', description: 'Primary & delegate mailboxes' },
  { key: 'sms', label: 'SMS', description: 'Security & escalations' },
];

function TogglePill({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition',
        active
          ? 'border-emerald-300 bg-emerald-500/10 text-emerald-600'
          : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-600',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      )}
    >
      {children}
    </button>
  );
}

TogglePill.propTypes = {
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
};

TogglePill.defaultProps = {
  active: false,
  disabled: false,
  onClick: null,
};

function StatCard({ label, value, tone }) {
  return (
    <div
      className={classNames(
        'rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-wide shadow-sm transition',
        tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : tone === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-600'
            : 'border-slate-200 bg-white/70 text-slate-600',
      )}
    >
      <p>{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none tracking-tight">{value}</p>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['success', 'warning', 'muted']),
};

StatCard.defaultProps = {
  tone: 'muted',
};

export default function NotificationPreferences({
  value,
  stats,
  busy,
  feedback,
  error,
  onSubmit,
  onChannelToggle,
  onCategoryToggle,
  onDeviceToggle,
  onChange,
  onApplyPreset,
  presetApplying,
}) {
  const activePreset = value.preset ?? 'custom';
  const digestLabel = useMemo(() => {
    if (!value.digestFrequency) return 'Unscheduled';
    switch (value.digestFrequency) {
      case 'daily':
        return 'Daily digest';
      case 'weekly':
        return 'Weekly roundup';
      case 'monthly':
        return 'Monthly insights';
      default:
        return 'Instant updates';
    }
  }, [value.digestFrequency]);

  const previewChannel = value.previewChannel ?? 'email';

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-soft">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Signal mix</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Notification preferences</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Coordinate how Gigvora keeps you informed. Blend high-urgency escalations with curated digests and channel-aware delivery.
            Every toggle syncs instantly across web, mobile, and connected integrations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stats?.unread != null ? <StatCard label="Unread" value={stats.unread} tone="warning" /> : null}
          {stats?.delivered != null ? <StatCard label="Delivered" value={stats.delivered} tone="success" /> : null}
          {stats?.dismissed != null ? <StatCard label="Dismissed" value={stats.dismissed} /> : null}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {PRESETS.map((preset) => {
          const active = activePreset === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onApplyPreset?.(preset.key)}
              disabled={presetApplying && !active}
              className={classNames(
                'flex h-full flex-col justify-between rounded-3xl border p-4 text-left shadow-sm transition',
                active
                  ? 'border-emerald-300 bg-emerald-50/80 text-emerald-800'
                  : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-emerald-200 hover:bg-white',
                presetApplying && !active ? 'cursor-wait opacity-60' : 'cursor-pointer',
              )}
            >
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-current px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                  {active ? <BellAlertIcon className="h-4 w-4" /> : <BellSnoozeIcon className="h-4 w-4" />} {preset.badge}
                </span>
                <p className="mt-3 text-base font-semibold">{preset.label}</p>
                <p className="mt-2 text-sm opacity-80">{preset.description}</p>
              </div>
              {active ? (
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Active preset
                </p>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form className="space-y-6" onSubmit={onSubmit}>
          <section className="space-y-4">
            <header className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delivery channels</h3>
                <p className="text-sm text-slate-500">Fine-tune the mix of alerts that reach each channel.</p>
              </div>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {digestLabel}
              </span>
            </header>
            <div className="grid gap-3 md:grid-cols-2">
              {CHANNELS.map((channel) => {
                const active = value.channels?.[channel.key] !== false;
                const Icon = channel.icon;
                return (
                  <button
                    type="button"
                    key={channel.key}
                    onClick={() => onChannelToggle?.(channel.key, !active)}
                    className={classNames(
                      'flex h-full flex-col gap-3 rounded-2xl border p-4 text-left shadow-sm transition',
                      active
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-600',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{channel.label}</p>
                        <p className="text-xs opacity-80">{channel.description}</p>
                      </div>
                    </div>
                    <TogglePill active={active} onClick={() => onChannelToggle?.(channel.key, !active)}>
                      {active ? 'Enabled' : 'Disabled'}
                    </TogglePill>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Content categories</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {CATEGORIES.map((category) => {
                const active = value.categories?.[category.key] !== false;
                return (
                  <button
                    type="button"
                    key={category.key}
                    onClick={() => onCategoryToggle?.(category.key, !active)}
                    className={classNames(
                      'flex h-full flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition',
                      active
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600',
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{category.label}</p>
                      <p className="mt-2 text-xs opacity-80">{category.description}</p>
                    </div>
                    <TogglePill active={active} onClick={() => onCategoryToggle?.(category.key, !active)}>
                      {active ? 'Included' : 'Muted'}
                    </TogglePill>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Device routing</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {DEVICES.map((device) => {
                const active = value.devices?.[device.key] !== false;
                return (
                  <button
                    type="button"
                    key={device.key}
                    onClick={() => onDeviceToggle?.(device.key, !active)}
                    className={classNames(
                      'flex h-full flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition',
                      active
                        ? 'border-violet-300 bg-violet-50 text-violet-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-600',
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{device.label}</p>
                      <p className="mt-2 text-xs opacity-80">{device.description}</p>
                    </div>
                    <TogglePill active={active} onClick={() => onDeviceToggle?.(device.key, !active)}>
                      {active ? 'Active' : 'Off'}
                    </TogglePill>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Digest & quiet hours</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Digest cadence</span>
                <select
                  value={value.digestFrequency}
                  onChange={(event) => onChange?.('digestFrequency', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="immediate">Instant</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-slate-700">Quiet hours start</span>
                  <input
                    type="time"
                    value={value.quietHoursStart}
                    onChange={(event) => onChange?.('quietHoursStart', event.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-slate-700">Quiet hours end</span>
                  <input
                    type="time"
                    value={value.quietHoursEnd}
                    onChange={(event) => onChange?.('quietHoursEnd', event.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Preferences sync in under two seconds across Slack, email, and push.</p>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              Save preferences
            </button>
          </div>

          {feedback ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{feedback}</p>
          ) : null}
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</p>
          ) : null}
        </form>

        <aside className="space-y-4 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Preview</h3>
            <div className="flex gap-2">
              {CHANNELS.map((channel) => (
                <TogglePill
                  key={channel.key}
                  active={previewChannel === channel.key}
                  onClick={() => onChange?.('previewChannel', channel.key)}
                >
                  {channel.label}
                </TogglePill>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <MegaphoneIcon className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{previewChannel === 'email' ? 'Weekly Growth Digest' : 'High priority escalation'}</p>
                <p className="text-xs text-slate-500">{previewChannel === 'email' ? 'Sent Mondays at 8am local time' : 'Delivered instantly to active device'}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              {previewChannel === 'sms'
                ? 'Critical security alert: A new device signed in from Singapore. Approve or block via the security centre.'
                : previewChannel === 'push'
                  ? 'Escalation • Orbit Labs needs approval on Milestone 3. Reply or reschedule directly from the notification.'
                  : previewChannel === 'inApp'
                    ? 'You have 3 new endorsements and 2 invitations awaiting review. Jump back into the collaboration hub to respond.'
                    : 'Here’s what you missed last week: 4 shortlisted briefs, 2 messages from Orbit Labs, and an invitation to the Fintech Collective.'}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Switch channels to preview copy tone, metadata, and delivery cadence. These samples reflect the current preset and digest cadence.
          </p>
        </aside>
      </div>
    </section>
  );
}

NotificationPreferences.propTypes = {
  value: PropTypes.shape({
    channels: PropTypes.object,
    categories: PropTypes.object,
    devices: PropTypes.object,
    digestFrequency: PropTypes.string,
    quietHoursStart: PropTypes.string,
    quietHoursEnd: PropTypes.string,
    previewChannel: PropTypes.string,
    preset: PropTypes.string,
  }).isRequired,
  stats: PropTypes.object,
  busy: PropTypes.bool,
  feedback: PropTypes.string,
  error: PropTypes.string,
  onSubmit: PropTypes.func,
  onChannelToggle: PropTypes.func,
  onCategoryToggle: PropTypes.func,
  onDeviceToggle: PropTypes.func,
  onChange: PropTypes.func,
  onApplyPreset: PropTypes.func,
  presetApplying: PropTypes.bool,
};

NotificationPreferences.defaultProps = {
  stats: null,
  busy: false,
  feedback: '',
  error: '',
  onSubmit: null,
  onChannelToggle: null,
  onCategoryToggle: null,
  onDeviceToggle: null,
  onChange: null,
  onApplyPreset: null,
  presetApplying: false,
};
