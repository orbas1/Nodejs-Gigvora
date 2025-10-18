import { useEffect, useState } from 'react';
import TimelineDrawer from './TimelineDrawer.jsx';

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Australia/Sydney',
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'connections', label: 'Connections' },
  { value: 'private', label: 'Private' },
];

function normaliseSettings(workspace) {
  return {
    timezone: workspace?.timezone ?? 'UTC',
    defaultVisibility: workspace?.defaultVisibility ?? 'public',
    autoShareToFeed: Boolean(workspace?.autoShareToFeed ?? true),
    reviewBeforePublish: Boolean(workspace?.reviewBeforePublish ?? true),
    cadenceGoal: Number.isFinite(Number(workspace?.cadenceGoal)) ? Number(workspace.cadenceGoal) : 4,
    distributionChannels: Array.isArray(workspace?.distributionChannels)
      ? workspace.distributionChannels.join(', ')
      : 'Feed, Newsletter',
    contentThemes: Array.isArray(workspace?.contentThemes)
      ? workspace.contentThemes.join(', ')
      : 'Updates, Wins',
    pinnedCampaigns: Array.isArray(workspace?.pinnedCampaigns)
      ? workspace.pinnedCampaigns.join(', ')
      : '',
  };
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function TimelineSettingsDrawer({ open, workspace, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(() => normaliseSettings(workspace));

  useEffect(() => {
    if (open) {
      setForm(normaliseSettings(workspace));
    }
  }, [open, workspace]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      timezone: form.timezone,
      defaultVisibility: form.defaultVisibility,
      autoShareToFeed: Boolean(form.autoShareToFeed),
      reviewBeforePublish: Boolean(form.reviewBeforePublish),
      cadenceGoal: Number(form.cadenceGoal ?? 0) || 0,
      distributionChannels: parseList(form.distributionChannels),
      contentThemes: parseList(form.contentThemes),
      pinnedCampaigns: parseList(form.pinnedCampaigns),
    };
    onSubmit(payload);
  };

  return (
    <TimelineDrawer
      open={open}
      title="Workspace settings"
      subtitle="Control defaults for your updates"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <button
          type="submit"
          form="timeline-settings-form"
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      }
    >
      <form id="timeline-settings-form" className="space-y-4" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Timezone</span>
          <select
            name="timezone"
            value={form.timezone}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {TIMEZONE_OPTIONS.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Default visibility</span>
          <select
            name="defaultVisibility"
            value={form.defaultVisibility}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Cadence goal (per month)</span>
            <input
              type="number"
              name="cadenceGoal"
              value={form.cadenceGoal}
              onChange={handleChange}
              min={0}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="autoShareToFeed"
                checked={Boolean(form.autoShareToFeed)}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Auto share to feed
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="reviewBeforePublish"
                checked={Boolean(form.reviewBeforePublish)}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Require review before publish
            </label>
          </div>
        </div>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Channels</span>
          <input
            type="text"
            name="distributionChannels"
            value={form.distributionChannels}
            onChange={handleChange}
            placeholder="Feed, Newsletter"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Themes</span>
          <input
            type="text"
            name="contentThemes"
            value={form.contentThemes}
            onChange={handleChange}
            placeholder="Updates, Wins"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Pinned campaigns</span>
          <input
            type="text"
            name="pinnedCampaigns"
            value={form.pinnedCampaigns}
            onChange={handleChange}
            placeholder="Launch Week"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </form>
    </TimelineDrawer>
  );
}
