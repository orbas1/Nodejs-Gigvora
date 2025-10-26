import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { DEFAULT_WEBSITE_PREFERENCES, ensureArray } from '../defaults.js';

const DIGEST_OPTIONS = [
  { value: 'daily', label: 'Daily pulse', description: 'Stay ahead of opportunities and requests every morning.' },
  { value: 'weekly', label: 'Weekly briefing', description: 'Friday summary with wins, introductions, and next steps.' },
  { value: 'monthly', label: 'Monthly review', description: 'High-level highlights for strategic planning sessions.' },
];

const CATEGORY_FREQUENCY = ['real-time', 'daily', 'weekly', 'monthly'];

const CHANNEL_OPTIONS = [
  { key: 'email', label: 'Email', description: 'Executive-ready digest delivered to your inbox.', icon: '✉️' },
  { key: 'push', label: 'Push', description: 'Lightweight nudges on mobile during prime moments.', icon: '🔔' },
  { key: 'inApp', label: 'In-app', description: 'Workspace notifications aligned with your active projects.', icon: '✨' },
  { key: 'sms', label: 'SMS', description: 'Time-sensitive alerts for urgent intros or meetings.', icon: '📱' },
];

const RECOMMENDED_TOPICS = [
  {
    id: 'capital',
    label: 'Capital market watch',
    description: 'Track venture rounds, investors, and growth-stage momentum tailored to your industry.',
  },
  {
    id: 'talent-labs',
    label: 'Talent labs',
    description: 'Handpicked operators and creators trending across the Gigvora network this week.',
  },
  {
    id: 'community-highlights',
    label: 'Community highlights',
    description: 'Member milestones, shout-outs, and collaborations worth celebrating.',
  },
];

function cloneCategories(categories) {
  return ensureArray(categories).map((category) => ({ ...category }));
}

function CategoryRow({ category, onToggle, onFrequencyChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 text-sm shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{category.label}</p>
          <p className="text-xs text-slate-500">{category.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(category.id, !category.enabled)}
          disabled={disabled}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
            category.enabled
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'
          } ${disabled ? 'cursor-not-allowed opacity-60 hover:border-slate-300 hover:text-slate-500' : ''}`}
        >
          {category.enabled ? 'Following' : 'Off'}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_FREQUENCY.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onFrequencyChange(category.id, option)}
            disabled={disabled}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              category.frequency === option
                ? 'border-accent bg-accent/10 text-slate-900'
                : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'
            } ${disabled ? 'cursor-not-allowed opacity-60 hover:border-slate-300 hover:text-slate-500' : ''}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

CategoryRow.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    enabled: PropTypes.bool,
    frequency: PropTypes.string,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onFrequencyChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default function ContentSubscriptions({ value = null, onChange, canEdit = true }) {
  const personalization = useMemo(() => {
    if (value && ensureArray(value.categories).length) {
      return { ...value, categories: cloneCategories(value.categories) };
    }
    const defaults = DEFAULT_WEBSITE_PREFERENCES.personalization.subscriptions;
    return { ...defaults, categories: cloneCategories(defaults.categories) };
  }, [value]);

  const emitChange = (next) => {
    onChange?.({ ...personalization, ...next });
  };

  const handleDigestChange = (option) => {
    if (!canEdit) return;
    emitChange({ digestFrequency: option });
  };

  const handleChannelToggle = (channelKey, checked) => {
    if (!canEdit) return;
    emitChange({
      channels: {
        ...personalization.channels,
        [channelKey]: checked,
      },
    });
  };

  const handleCategoryToggle = (categoryId, enabled) => {
    if (!canEdit) return;
    emitChange({
      categories: cloneCategories(personalization.categories).map((category) =>
        category.id === categoryId ? { ...category, enabled } : category,
      ),
    });
  };

  const handleCategoryFrequency = (categoryId, frequency) => {
    if (!canEdit) return;
    emitChange({
      categories: cloneCategories(personalization.categories).map((category) =>
        category.id === categoryId ? { ...category, frequency } : category,
      ),
    });
  };

  const handleAiToggle = (event) => {
    emitChange({ aiSummaries: event.target.checked });
  };

  const handlePreviewToggle = (event) => {
    emitChange({ previewEnabled: event.target.checked });
  };

  const activeCategories = personalization.categories.filter((category) => category.enabled);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Digest cadence</h3>
        <p className="mt-1 text-sm text-slate-500">Choose how often your audience receives curated stories and insights.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {DIGEST_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleDigestChange(option.value)}
              disabled={!canEdit}
              className={`flex flex-col rounded-3xl border px-4 py-4 text-left transition ${
                personalization.digestFrequency === option.value
                  ? 'border-accent bg-accent/10 text-slate-900 shadow-lg shadow-accent/20'
                  : 'border-slate-200 bg-white/90 text-slate-600 hover:border-accent/40 hover:text-slate-900'
              } ${!canEdit ? 'cursor-not-allowed opacity-60 hover:border-slate-200 hover:text-slate-600' : ''}`}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{option.label}</span>
              <span className="mt-3 text-sm">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-base font-semibold text-slate-900">Channels</h4>
        <p className="mt-1 text-xs text-slate-500">Deliver the right format at the right moment.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {CHANNEL_OPTIONS.map((channel) => (
            <label
              key={channel.key}
              className={`flex cursor-pointer flex-col gap-2 rounded-3xl border px-4 py-4 text-sm transition ${
                personalization.channels?.[channel.key]
                  ? 'border-accent bg-accent/10 text-slate-900 shadow-sm'
                  : 'border-slate-200 bg-white/90 text-slate-600 hover:border-accent/40 hover:text-slate-900'
              } ${!canEdit ? 'cursor-not-allowed opacity-60 hover:border-slate-200 hover:text-slate-600' : ''}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span>{channel.icon}</span>
                {channel.label}
              </span>
              <span className="text-xs text-slate-500">{channel.description}</span>
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <span>{personalization.channels?.[channel.key] ? 'Enabled' : 'Disabled'}</span>
                <input
                  type="checkbox"
                  checked={Boolean(personalization.channels?.[channel.key])}
                  onChange={(event) => handleChannelToggle(channel.key, event.target.checked)}
                  disabled={!canEdit}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-base font-semibold text-slate-900">Collections</h4>
        <p className="mt-1 text-xs text-slate-500">Curate the stories your members see in their personalised feed.</p>
        <div className="mt-3 space-y-3">
          {personalization.categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onToggle={handleCategoryToggle}
              onFrequencyChange={handleCategoryFrequency}
              disabled={!canEdit}
            />
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Personalisation intelligence</h4>
        <p className="mt-1 text-xs text-slate-500">
          Gigvora analyses open rates, profile interests, and content depth to keep recommendations relevant.
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Generate AI summaries</span>
            <input
              type="checkbox"
              checked={Boolean(personalization.aiSummaries)}
              onChange={handleAiToggle}
              disabled={!canEdit}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Show preview banner before publishing</span>
            <input
              type="checkbox"
              checked={Boolean(personalization.previewEnabled)}
              onChange={handlePreviewToggle}
              disabled={!canEdit}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Recommended next</p>
          <div className="mt-3 space-y-3">
            {RECOMMENDED_TOPICS.map((topic) => {
              const alreadyAdded = personalization.categories.some((category) => category.id === topic.id);
              return (
                <div key={topic.id} className="flex flex-col gap-2 rounded-xl bg-white/80 p-4 text-sm text-slate-600 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{topic.label}</span>
                    <button
                      type="button"
                      disabled={!canEdit || alreadyAdded}
                      onClick={() =>
                        emitChange({
                          categories: [
                            ...cloneCategories(personalization.categories),
                            { ...topic, enabled: true, frequency: 'weekly', channel: 'email' },
                          ],
                        })
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                        alreadyAdded
                          ? 'border-slate-200 text-slate-400'
                          : 'border-slate-900 bg-slate-900 text-white hover:border-slate-700 hover:bg-slate-700'
                      } ${!canEdit ? 'cursor-not-allowed opacity-60 hover:border-slate-200 hover:bg-slate-900' : ''}`}
                    >
                      {alreadyAdded ? 'Added' : 'Add'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">{topic.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          <p>
            {activeCategories.length} collection{activeCategories.length === 1 ? '' : 's'} live • {personalization.digestFrequency}{' '}
            digest • Channels:{' '}
            {CHANNEL_OPTIONS.filter((channel) => personalization.channels?.[channel.key])
              .map((channel) => channel.label)
              .join(', ') || 'None'}
          </p>
        </div>
      </div>
    </div>
  );
}

ContentSubscriptions.propTypes = {
  value: PropTypes.shape({
    digestFrequency: PropTypes.string,
    channels: PropTypes.object,
    categories: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        description: PropTypes.string,
        enabled: PropTypes.bool,
        frequency: PropTypes.string,
      }),
    ),
    aiSummaries: PropTypes.bool,
    previewEnabled: PropTypes.bool,
  }),
  onChange: PropTypes.func,
  canEdit: PropTypes.bool,
};
