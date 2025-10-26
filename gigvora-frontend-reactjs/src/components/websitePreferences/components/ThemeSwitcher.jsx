import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeProvider.tsx';

const MODE_OPTIONS = [
  {
    value: 'system',
    label: 'Match device',
    description: 'Respect your visitor’s system preference for automatic trust.',
  },
  {
    value: 'light',
    label: 'Daylight',
    description: 'High vibrancy hero gradients and polished neutral surfaces.',
  },
  {
    value: 'dark',
    label: 'Midnight',
    description: 'Nocturnal palette tuned for premium contrast and focus.',
  },
  {
    value: 'high-contrast',
    label: 'High contrast',
    description: 'Accessibility-first palette with executive clarity.',
  },
];

const DENSITY_OPTIONS = [
  {
    value: 'spacious',
    label: 'Showcase',
    description: 'Editorial spacing for expressive storytelling.',
  },
  {
    value: 'comfortable',
    label: 'Balanced',
    description: 'Default density optimised for hybrid screens.',
  },
  {
    value: 'cozy',
    label: 'Productive',
    description: 'Tighter stack for operators reviewing data-rich sections.',
  },
  {
    value: 'compact',
    label: 'Data heavy',
    description: 'High-information layouts with minimal padding.',
  },
];

const ACCENT_PRESETS = [
  { value: 'azure', label: 'Azure beam', gradient: 'from-sky-400 via-blue-500 to-indigo-500' },
  { value: 'violet', label: 'Violet pulse', gradient: 'from-violet-400 via-purple-500 to-fuchsia-500' },
  { value: 'emerald', label: 'Emerald glow', gradient: 'from-emerald-400 via-teal-500 to-cyan-500' },
  { value: 'amber', label: 'Amber warmth', gradient: 'from-amber-400 via-orange-500 to-rose-500' },
  { value: 'rose', label: 'Rose flare', gradient: 'from-rose-400 via-pink-500 to-rose-600' },
  { value: 'custom', label: 'Custom accent', gradient: 'from-slate-500 via-slate-600 to-slate-700' },
];

const THEME_PRESETS = [
  {
    id: 'aurora',
    label: 'Aurora',
    description: 'Gradient hero with spotlight cards, ideal for consultants and agencies.',
    badge: 'Most loved',
    accent: 'azure',
    mode: 'light',
    density: 'comfortable',
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    description: 'Dark glassmorphism layering for executive portfolios and venture firms.',
    badge: 'New',
    accent: 'violet',
    mode: 'dark',
    density: 'cozy',
  },
  {
    id: 'daybreak',
    label: 'Daybreak',
    description: 'Warm amber gradients with optimistic typography for community builders.',
    badge: 'High conversion',
    accent: 'amber',
    mode: 'light',
    density: 'spacious',
  },
  {
    id: 'focus',
    label: 'Focus',
    description: 'High-contrast executive palette optimised for accessibility audits.',
    badge: 'AA+ ready',
    accent: 'emerald',
    mode: 'high-contrast',
    density: 'comfortable',
  },
];

function ThemePresetCard({ preset, active = false, onSelect, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(preset)}
      disabled={disabled}
      className={`group flex flex-col rounded-3xl border px-5 py-4 text-left transition ${
        active
          ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20'
          : 'border-slate-200 bg-white/80 hover:border-accent/60 hover:shadow-md'
      } ${disabled ? 'cursor-not-allowed opacity-60 hover:shadow-none' : ''}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
        <span>{preset.label}</span>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] font-bold text-white">
          {preset.badge}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600 group-hover:text-slate-900">{preset.description}</p>
      <div
        className="mt-4 h-14 w-full rounded-2xl bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 group-hover:via-slate-200"
      >
        <div className="flex h-full items-center justify-center gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-full bg-white/80 px-2 py-0.5">{preset.mode}</span>
          <span className="rounded-full bg-white/80 px-2 py-0.5">{preset.accent}</span>
          <span className="rounded-full bg-white/80 px-2 py-0.5">{preset.density}</span>
        </div>
      </div>
    </button>
  );
}

ThemePresetCard.propTypes = {
  preset: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    badge: PropTypes.string,
    accent: PropTypes.string.isRequired,
    mode: PropTypes.string.isRequired,
    density: PropTypes.string.isRequired,
  }).isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default function ThemeSwitcher({ value = null, onChange, canEdit = true }) {
  const { setMode, setAccent, setDensity } = useTheme();
  const theme = useMemo(
    () => ({
      preset: value?.preset ?? 'aurora',
      mode: value?.mode ?? 'system',
      accent: value?.accent ?? 'azure',
      density: value?.density ?? 'comfortable',
      customAccent: value?.customAccent ?? '#2563EB',
      customNeutral: value?.customNeutral ?? '#0F172A',
      livePreview: value?.livePreview ?? true,
      analyticsOptIn: value?.analyticsOptIn ?? true,
    }),
    [value],
  );

  const handleCommit = (next) => {
    const payload = { ...theme, ...next };
    onChange?.(payload);
    if (next.mode) {
      setMode(next.mode);
    }
    if (next.accent && next.accent !== 'custom') {
      setAccent(next.accent);
    }
    if (next.density) {
      setDensity(next.density);
    }
  };

  const activeAccent = theme.accent === 'custom' ? 'custom' : theme.accent;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Premium presets</h3>
        <p className="mt-1 text-sm text-slate-500">
          Launch with battle-tested combinations benchmarked against LinkedIn and Instagram landing pages.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {THEME_PRESETS.map((preset) => (
            <ThemePresetCard
              key={preset.id}
              preset={preset}
              disabled={!canEdit}
              active={theme.preset === preset.id}
              onSelect={() =>
                handleCommit({
                  preset: preset.id,
                  mode: preset.mode,
                  accent: preset.accent,
                  density: preset.density,
                })
              }
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">Mode & density</h4>
          <p className="mt-1 text-xs text-slate-500">
            Give visitors the perfect read—from immersive hero storytelling to data dense dashboards.
          </p>
          <div className="mt-4 space-y-3">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={!canEdit}
                onClick={() => handleCommit({ mode: option.value, preset: theme.preset })}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  theme.mode === option.value
                    ? 'border-accent bg-accent/10 text-slate-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-accent/40 hover:text-slate-900'
                } ${!canEdit ? 'cursor-not-allowed opacity-60 hover:border-slate-200' : ''}`}
              >
                <span className="block font-semibold capitalize">{option.label}</span>
                <span className="text-xs text-slate-500">{option.description}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-2">
            {DENSITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={!canEdit}
                onClick={() => handleCommit({ density: option.value, preset: theme.preset })}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  theme.density === option.value
                    ? 'border-accent bg-accent/10 text-slate-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-accent/40 hover:text-slate-900'
                } ${!canEdit ? 'cursor-not-allowed opacity-60 hover:border-slate-200' : ''}`}
              >
                <span className="block font-semibold">{option.label}</span>
                <span className="text-xs text-slate-500">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">Accent polish</h4>
          <p className="mt-1 text-xs text-slate-500">
            Switch between elevated palettes or craft your own for instant brand alignment.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {ACCENT_PRESETS.map((accent) => (
              <button
                key={accent.value}
                type="button"
                disabled={!canEdit}
                onClick={() =>
                  handleCommit({
                    accent: accent.value,
                    preset: accent.value === 'custom' ? theme.preset : theme.preset,
                  })
                }
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                  activeAccent === accent.value
                    ? 'border-accent bg-accent/10 text-slate-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-accent/40 hover:text-slate-900'
                } ${!canEdit ? 'cursor-not-allowed opacity-60 hover:border-slate-200' : ''}`}
              >
                <span className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent.gradient}`} />
                <span>{accent.label}</span>
              </button>
            ))}
          </div>

          {activeAccent === 'custom' ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Accent colour
                <input
                  type="color"
                  disabled={!canEdit}
                  value={theme.customAccent}
                  onChange={(event) => handleCommit({ accent: 'custom', customAccent: event.target.value })}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Neutral surface
                <input
                  type="color"
                  disabled={!canEdit}
                  value={theme.customNeutral}
                  onChange={(event) => handleCommit({ customNeutral: event.target.value, accent: 'custom' })}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Live preview in dashboard</span>
              <input
                type="checkbox"
                checked={theme.livePreview}
                disabled={!canEdit}
                onChange={(event) => handleCommit({ livePreview: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Share anonymous analytics</span>
              <input
                type="checkbox"
                checked={theme.analyticsOptIn}
                disabled={!canEdit}
                onChange={(event) => handleCommit({ analyticsOptIn: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

ThemeSwitcher.propTypes = {
  value: PropTypes.shape({
    preset: PropTypes.string,
    mode: PropTypes.string,
    accent: PropTypes.string,
    density: PropTypes.string,
    customAccent: PropTypes.string,
    customNeutral: PropTypes.string,
    livePreview: PropTypes.bool,
    analyticsOptIn: PropTypes.bool,
  }),
  onChange: PropTypes.func,
  canEdit: PropTypes.bool,
};
