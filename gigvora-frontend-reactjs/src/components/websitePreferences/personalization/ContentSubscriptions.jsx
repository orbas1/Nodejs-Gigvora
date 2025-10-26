import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowPathIcon,
  BellAlertIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  GlobeAltIcon,
  PlusIcon,
  RssIcon,
  SparklesIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { DEFAULT_SUBSCRIPTION_MODULES } from '../defaults.js';

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly digest' },
  { value: 'biweekly', label: 'Every other week' },
  { value: 'monthly', label: 'Monthly recap' },
];

const CHANNEL_OPTIONS = [
  { value: 'site', label: 'Site hub', icon: GlobeAltIcon },
  { value: 'email', label: 'Email', icon: EnvelopeOpenIcon },
  { value: 'push', label: 'Push alerts', icon: BellAlertIcon },
  { value: 'rss', label: 'RSS feed', icon: RssIcon },
];

const SEGMENT_OPTIONS = ['prospects', 'clients', 'partners', 'community', 'internal'];

const DIGEST_OPTIONS = [
  { value: 'monday-08:00', label: 'Mondays • 8:00 AM' },
  { value: 'wednesday-12:00', label: 'Wednesdays • Noon' },
  { value: 'friday-16:00', label: 'Fridays • 4:00 PM' },
];

function getChannelLabel(value) {
  const match = CHANNEL_OPTIONS.find((option) => option.value === value);
  return match?.label ?? value;
}

function mergeModules(activeModules = []) {
  const defaults = DEFAULT_SUBSCRIPTION_MODULES.map((module) => ({ ...module }));
  const merged = defaults.map((module) => {
    const override = activeModules.find((item) => item.id === module.id);
    return override ? { ...module, ...override, sampleContent: module.sampleContent } : module;
  });
  activeModules
    .filter((module) => !defaults.some((defaultModule) => defaultModule.id === module.id))
    .forEach((module) => {
      merged.push({
        ...module,
        sampleContent: module.sampleContent ?? [],
        custom: true,
      });
    });
  return merged;
}

function normalizeSubscriptions(value) {
  return {
    digestTime: value?.digestTime ?? 'monday-08:00',
    autoPersonalize: typeof value?.autoPersonalize === 'boolean' ? value.autoPersonalize : true,
    modules: mergeModules(value?.modules),
  };
}

function ChannelToggle({ value, active, onToggle, disabled, label, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

ChannelToggle.propTypes = {
  value: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
};

ChannelToggle.defaultProps = {
  disabled: false,
};

function SegmentPill({ label, active, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(label)}
      disabled={disabled}
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
        active
          ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {label}
    </button>
  );
}

SegmentPill.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

SegmentPill.defaultProps = {
  disabled: false,
};

function SampleContent({ module }) {
  if (!module.sampleContent?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Add teaser stories to give visitors a preview of what to expect.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {module.sampleContent.map((item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          {item.metric ? <p className="text-xs text-slate-500">{item.metric}</p> : null}
        </div>
      ))}
    </div>
  );
}

SampleContent.propTypes = {
  module: PropTypes.shape({
    sampleContent: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        metric: PropTypes.string,
      }),
    ),
  }).isRequired,
};

export default function ContentSubscriptions({ subscriptions, onChange, canEdit }) {
  const normalized = useMemo(() => normalizeSubscriptions(subscriptions), [subscriptions]);
  const [activeModuleId, setActiveModuleId] = useState(() => {
    const firstEnabled = normalized.modules.find((module) => module.enabled);
    return firstEnabled?.id ?? normalized.modules[0]?.id ?? null;
  });
  const [customDraft, setCustomDraft] = useState({ title: '', description: '', frequency: 'monthly' });

  const activeModule = normalized.modules.find((module) => module.id === activeModuleId) ?? normalized.modules[0];

  const metrics = useMemo(() => {
    const enabledModules = normalized.modules.filter((module) => module.enabled !== false);
    const channelCoverage = CHANNEL_OPTIONS.reduce((coverage, option) => {
      coverage[option.value] = enabledModules.filter((module) => module.channels?.includes(option.value)).length;
      return coverage;
    }, {});
    const segmentCounts = SEGMENT_OPTIONS.reduce((counts, segment) => {
      counts[segment] = enabledModules.filter((module) => module.segments?.includes(segment)).length;
      return counts;
    }, {});
    const coveredSegments = SEGMENT_OPTIONS.filter((segment) => segmentCounts[segment] > 0);
    const uncoveredSegments = SEGMENT_OPTIONS.filter((segment) => segmentCounts[segment] === 0);
    const coveragePercent = SEGMENT_OPTIONS.length
      ? Math.round((coveredSegments.length / SEGMENT_OPTIONS.length) * 100)
      : 0;
    const activeChannels = CHANNEL_OPTIONS.filter((option) => channelCoverage[option.value] > 0).map(
      (option) => option.label,
    );
    return {
      totalCount: normalized.modules.length,
      enabledCount: enabledModules.length,
      channelCoverage,
      activeChannels,
      coveredSegments,
      uncoveredSegments,
      coveragePercent,
    };
  }, [normalized.modules]);

  const digestLabel = useMemo(() => {
    const match = DIGEST_OPTIONS.find((option) => option.value === normalized.digestTime);
    return match?.label ?? 'Custom cadence';
  }, [normalized.digestTime]);

  const applyModules = (modules) => {
    onChange?.({
      digestTime: normalized.digestTime,
      autoPersonalize: normalized.autoPersonalize,
      modules,
    });
  };

  const updateSubscriptions = (next) => {
    applyModules(
      normalized.modules.map((module) => {
        if (module.id === next.id) {
          return next;
        }
        return module;
      }),
    );
  };

  const handleToggleModule = (module, enabled) => {
    updateSubscriptions({ ...module, enabled });
  };

  const handleFrequencyChange = (module, frequency) => {
    updateSubscriptions({ ...module, frequency });
  };

  const handleReorderModule = (module, direction) => {
    const currentIndex = normalized.modules.findIndex((item) => item.id === module.id);
    const targetIndex = currentIndex + direction;
    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= normalized.modules.length) {
      return;
    }
    const nextModules = [...normalized.modules];
    const [moved] = nextModules.splice(currentIndex, 1);
    nextModules.splice(targetIndex, 0, moved);
    applyModules(nextModules);
    setActiveModuleId(moved.id);
  };

  const handleRemoveModule = (module) => {
    const nextModules = normalized.modules.filter((item) => item.id !== module.id);
    applyModules(nextModules);
    if (module.id === activeModuleId) {
      setActiveModuleId(nextModules[0]?.id ?? null);
    }
  };

  const handleChannelToggle = (module, channel) => {
    const current = Array.isArray(module.channels) ? module.channels : [];
    const nextChannels = current.includes(channel)
      ? current.filter((value) => value !== channel)
      : [...current, channel];
    updateSubscriptions({ ...module, channels: nextChannels });
  };

  const handleSegmentToggle = (module, segment) => {
    const current = Array.isArray(module.segments) ? module.segments : [];
    const nextSegments = current.includes(segment)
      ? current.filter((value) => value !== segment)
      : [...current, segment];
    updateSubscriptions({ ...module, segments: nextSegments });
  };

  const handleDigestChange = (event) => {
    onChange?.({
      ...normalized,
      digestTime: event.target.value,
    });
  };

  const handleAutoPersonalizeToggle = () => {
    onChange?.({
      ...normalized,
      autoPersonalize: !normalized.autoPersonalize,
    });
  };

  const handleAddCustomModule = () => {
    if (!customDraft.title.trim()) {
      return;
    }
    const newModule = {
      id: `custom-${Date.now()}`,
      title: customDraft.title.trim(),
      description: customDraft.description.trim(),
      frequency: customDraft.frequency,
      channels: ['site'],
      segments: ['community'],
      enabled: true,
      sampleContent: [],
      custom: true,
    };
    applyModules([...normalized.modules, newModule]);
    setActiveModuleId(newModule.id);
    setCustomDraft({ title: '', description: '', frequency: 'monthly' });
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Content subscriptions</h3>
          <p className="text-sm text-slate-500">
            Curate always-on story playlists, schedule digests, and target the right audience segments for each feed.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <SparklesIcon className="h-4 w-4" />
          Personalization AI
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Digest schedule</p>
                <p className="text-sm text-slate-600">Choose when your automated roundups publish.</p>
              </div>
              <select
                value={normalized.digestTime}
                onChange={handleDigestChange}
                disabled={!canEdit}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 focus:border-slate-900 focus:outline-none"
              >
                {DIGEST_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Auto personalize</p>
                <p className="text-xs text-slate-500">
                  Dynamically reprioritize modules based on visitor history and intent.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoPersonalizeToggle}
                disabled={!canEdit}
                className={`relative inline-flex h-7 w-14 items-center rounded-full border transition ${
                  normalized.autoPersonalize ? 'border-slate-900 bg-slate-900' : 'border-slate-200 bg-white'
                } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                aria-pressed={normalized.autoPersonalize}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                    normalized.autoPersonalize ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {normalized.modules.map((module, index) => {
              const isActive = module.id === activeModule?.id;
              const canMoveUp = index > 0;
              const canMoveDown = index < normalized.modules.length - 1;
              return (
                <div
                  key={module.id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModuleId(module.id)}
                        className={`text-left text-base font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}
                      >
                        {module.title}
                      </button>
                      {module.custom ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isActive ? 'border border-white/30 text-white/70' : 'border border-slate-200 text-slate-500'}`}>
                          Custom
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReorderModule(module, -1)}
                        disabled={!canEdit || !canMoveUp}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                          isActive ? 'border-white/30 bg-white/10 text-white/80' : 'border-slate-200 bg-white text-slate-500'
                        } hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40`}
                        aria-label="Move module up"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderModule(module, 1)}
                        disabled={!canEdit || !canMoveDown}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                          isActive ? 'border-white/30 bg-white/10 text-white/80' : 'border-slate-200 bg-white text-slate-500'
                        } hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40`}
                        aria-label="Move module down"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      {module.custom ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveModule(module)}
                          disabled={!canEdit}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                            isActive ? 'border-white/30 bg-white/10 text-white/80' : 'border-slate-200 bg-white text-red-500'
                          } hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40`}
                          aria-label="Remove module"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          isActive ? 'border-white/20 text-white/80' : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        <ClockIcon className="h-3.5 w-3.5" />
                        {module.frequency}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleModule(module, !module.enabled)}
                        disabled={!canEdit}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                          module.enabled
                            ? isActive
                              ? 'border-white/30 bg-white/10 text-white'
                              : 'border-emerald-300 bg-emerald-500/20 text-emerald-700'
                            : isActive
                            ? 'border-white/40 bg-white/10 text-white/70'
                            : 'border-slate-200 bg-slate-100 text-slate-500'
                        } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        {module.enabled ? 'Enabled' : 'Paused'}
                      </button>
                    </div>
                  </div>
                  <p className={`mt-2 text-sm ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{module.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(module.channels ?? []).map((channel) => (
                      <span
                        key={`${module.id}-channel-${channel}`}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isActive ? 'border-white/30 bg-white/10 text-white/80' : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                      >
                        {getChannelLabel(channel)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(module.segments ?? []).map((segment) => (
                      <span
                        key={`${module.id}-segment-${segment}`}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isActive ? 'border-white/30 bg-white/5 text-white/80' : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        {segment}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {activeModule ? (
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activeModule.title}</p>
                  <p className="text-xs text-slate-500">
                    Fine-tune cadence, channels, and audience for this stream.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <UserGroupIcon className="h-4 w-4" />
                  {activeModule.segments?.length ?? 0} segments
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frequency</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {FREQUENCY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleFrequencyChange(activeModule, option.value)}
                        disabled={!canEdit}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                          activeModule.frequency === option.value
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channels</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CHANNEL_OPTIONS.map((option) => (
                      <ChannelToggle
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        icon={option.icon}
                        active={Boolean(activeModule.channels?.includes(option.value))}
                        onToggle={(value) => handleChannelToggle(activeModule, value)}
                        disabled={!canEdit}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audience segments</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SEGMENT_OPTIONS.map((segment) => (
                      <SegmentPill
                        key={segment}
                        label={segment}
                        active={Boolean(activeModule.segments?.includes(segment))}
                        onToggle={(value) => handleSegmentToggle(activeModule, value)}
                        disabled={!canEdit}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Digest health</p>
            <ul className="mt-3 space-y-1">
              <li className="flex items-center justify-between">
                <span>Active feeds</span>
                <span className="font-semibold text-slate-900">
                  {metrics.enabledCount}/{metrics.totalCount}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Channels live</span>
                <span className="font-semibold text-slate-900">
                  {metrics.activeChannels.length ? metrics.activeChannels.join(', ') : '—'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Segment coverage</span>
                <span className="font-semibold text-slate-900">{metrics.coveragePercent}%</span>
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">
              {metrics.uncoveredSegments.length
                ? `Needs love: ${metrics.uncoveredSegments.join(', ')}`
                : 'All target segments have an active feed.'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Cadence: {digestLabel}</p>
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview spotlight</h4>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Auto-refreshing
            </span>
          </div>
          {activeModule ? <SampleContent module={activeModule} /> : null}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add custom feed</p>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={customDraft.title}
                onChange={(event) => setCustomDraft((current) => ({ ...current, title: event.target.value }))}
                disabled={!canEdit}
                placeholder="Series name (e.g. Studio radio)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <textarea
                rows={2}
                value={customDraft.description}
                onChange={(event) => setCustomDraft((current) => ({ ...current, description: event.target.value }))}
                disabled={!canEdit}
                placeholder="Describe what subscribers receive"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <select
                value={customDraft.frequency}
                onChange={(event) => setCustomDraft((current) => ({ ...current, frequency: event.target.value }))}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCustomModule}
                disabled={!canEdit || !customDraft.title.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <PlusIcon className="h-4 w-4" />
                Add feed
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

ContentSubscriptions.propTypes = {
  subscriptions: PropTypes.shape({
    digestTime: PropTypes.string,
    autoPersonalize: PropTypes.bool,
    modules: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        enabled: PropTypes.bool,
        frequency: PropTypes.string,
        channels: PropTypes.arrayOf(PropTypes.string),
        segments: PropTypes.arrayOf(PropTypes.string),
        sampleContent: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string,
            title: PropTypes.string,
            metric: PropTypes.string,
          }),
        ),
      }),
    ),
  }),
  onChange: PropTypes.func,
  canEdit: PropTypes.bool,
};

ContentSubscriptions.defaultProps = {
  subscriptions: {
    digestTime: 'monday-08:00',
    autoPersonalize: true,
    modules: DEFAULT_SUBSCRIPTION_MODULES,
  },
  onChange: undefined,
  canEdit: true,
};
