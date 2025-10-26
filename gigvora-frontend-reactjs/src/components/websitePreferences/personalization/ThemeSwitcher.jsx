import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { DEFAULT_WEBSITE_PREFERENCES } from '../defaults.js';

const BASE_THEME = DEFAULT_WEBSITE_PREFERENCES.theme;

const FONT_OPTIONS = ['Inter', 'Manrope', 'Space Grotesk', 'Work Sans', 'Playfair Display'];

const BACKGROUND_STYLES = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'gradient', label: 'Gradient', icon: SparklesIcon },
];

const DEVICE_OPTIONS = [
  { id: 'desktop', label: 'Desktop', icon: ComputerDesktopIcon, frameClass: 'h-72 w-full rounded-3xl', scale: 'scale-100' },
  { id: 'tablet', label: 'Tablet', icon: GlobeAltIcon, frameClass: 'h-72 w-[420px] rounded-[32px]', scale: 'scale-90' },
  { id: 'mobile', label: 'Mobile', icon: DevicePhoneMobileIcon, frameClass: 'h-72 w-[280px] rounded-[42px]', scale: 'scale-100' },
];

const PRESET_THEMES = [
  {
    id: 'gigvora-classic',
    name: 'Gigvora classic',
    description: 'Gradient hero, confident azure brand accents.',
    preview: {
      primaryColor: '#2563EB',
      accentColor: '#0EA5E9',
      backgroundStyle: 'gradient',
      fontFamily: 'Inter',
      buttonShape: 'rounded',
    },
  },
  {
    id: 'midnight-neon',
    name: 'Midnight neon',
    description: 'High-contrast dark mode with electric highlights.',
    preview: {
      primaryColor: '#0F172A',
      accentColor: '#22D3EE',
      backgroundStyle: 'dark',
      fontFamily: 'Space Grotesk',
      buttonShape: 'pill',
    },
  },
  {
    id: 'atelier-sunrise',
    name: 'Atelier sunrise',
    description: 'Warm gradients and editorial type pairings.',
    preview: {
      primaryColor: '#F97316',
      accentColor: '#FBBF24',
      backgroundStyle: 'gradient',
      fontFamily: 'Playfair Display',
      buttonShape: 'rounded',
    },
  },
  {
    id: 'minimal-porcelain',
    name: 'Minimal porcelain',
    description: 'Crisp whites, subtle shadows, calm typography.',
    preview: {
      primaryColor: '#0F172A',
      accentColor: '#818CF8',
      backgroundStyle: 'light',
      fontFamily: 'Manrope',
      buttonShape: 'square',
    },
  },
];

const ACCESSIBILITY_PRESETS = [
  {
    id: 'standard',
    name: 'Standard contrast',
    description: 'Balanced typography and surfaces tuned for modern displays.',
  },
  {
    id: 'high-contrast',
    name: 'High contrast',
    description: 'Maximizes luminance contrast for low-vision visitors.',
  },
  {
    id: 'calm-reading',
    name: 'Calm reading',
    description: 'Soft backgrounds and generous line height for long-form stories.',
  },
];

function normalizeTheme(theme) {
  const merged = {
    ...BASE_THEME,
    ...theme,
  };
  merged.accentPalette = Array.isArray(theme?.accentPalette) && theme.accentPalette.length
    ? Array.from(new Set(theme.accentPalette.filter(Boolean)))
    : [...BASE_THEME.accentPalette];
  merged.presetId = theme?.presetId ?? BASE_THEME.presetId;
  merged.systemSync = typeof theme?.systemSync === 'boolean' ? theme.systemSync : true;
  merged.lastSyncedAt = theme?.lastSyncedAt ?? null;
  merged.primaryColor = theme?.primaryColor ?? BASE_THEME.primaryColor;
  merged.accentColor = theme?.accentColor ?? BASE_THEME.accentColor;
  merged.backgroundStyle = theme?.backgroundStyle ?? BASE_THEME.backgroundStyle;
  merged.fontFamily = theme?.fontFamily ?? BASE_THEME.fontFamily;
  merged.buttonShape = theme?.buttonShape ?? BASE_THEME.buttonShape;
  merged.accessibilityPreset = theme?.accessibilityPreset ?? BASE_THEME.accessibilityPreset ?? 'standard';
  merged.reduceMotion = typeof theme?.reduceMotion === 'boolean' ? theme.reduceMotion : BASE_THEME.reduceMotion ?? false;
  return merged;
}

function getBackgroundStyle(theme) {
  if (theme.backgroundStyle === 'gradient') {
    return `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`;
  }
  if (theme.backgroundStyle === 'dark') {
    return '#0B1222';
  }
  return '#F8FAFF';
}

function getTextColor(theme) {
  if (theme.accessibilityPreset === 'high-contrast') {
    return theme.backgroundStyle === 'light' ? '#0B1120' : '#F8FAFF';
  }
  if (theme.accessibilityPreset === 'calm-reading') {
    return theme.backgroundStyle === 'light' ? '#1F2937' : '#E2E8F0';
  }
  return theme.backgroundStyle === 'light' ? '#0F172A' : '#F8FAFF';
}

function getSurfaceTokens(theme) {
  const textColor = getTextColor(theme);
  if (theme.accessibilityPreset === 'high-contrast') {
    return {
      textColor,
      navBackground: theme.backgroundStyle === 'light' ? '#F8FAFC' : '#020617',
      cardBackground: theme.backgroundStyle === 'light' ? '#FFFFFF' : '#0F172A',
      borderColor: theme.backgroundStyle === 'light' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 255, 0.4)',
    };
  }
  if (theme.accessibilityPreset === 'calm-reading') {
    return {
      textColor,
      navBackground: 'rgba(255, 255, 255, 0.95)',
      cardBackground: 'rgba(255, 255, 255, 0.9)',
      borderColor: 'rgba(15, 23, 42, 0.08)',
    };
  }
  return {
    textColor,
    navBackground: theme.backgroundStyle === 'light' ? '#FFFFFF' : 'rgba(15, 23, 42, 0.55)',
    cardBackground: theme.backgroundStyle === 'light' ? '#FFFFFF' : 'rgba(15, 23, 42, 0.72)',
    borderColor: theme.backgroundStyle === 'light' ? 'rgba(15, 23, 42, 0.12)' : 'rgba(248, 250, 255, 0.18)',
  };
}

function computeActivePreset(theme, presets) {
  const match = presets.find((preset) => {
    return (
      theme.presetId === preset.id ||
      (theme.primaryColor?.toLowerCase() === preset.preview.primaryColor.toLowerCase() &&
        theme.accentColor?.toLowerCase() === preset.preview.accentColor.toLowerCase() &&
        theme.backgroundStyle === preset.preview.backgroundStyle &&
        theme.fontFamily === preset.preview.fontFamily &&
        theme.buttonShape === preset.preview.buttonShape)
    );
  });
  return match?.id ?? null;
}

function formatRelativeTime(isoString) {
  if (!isoString) {
    return 'Not yet synced';
  }
  try {
    const now = new Date();
    const target = new Date(isoString);
    const diff = Math.max(0, now.getTime() - target.getTime());
    const minutes = Math.round(diff / 60000);
    if (minutes < 1) {
      return 'Synced moments ago';
    }
    if (minutes === 1) {
      return 'Synced 1 minute ago';
    }
    if (minutes < 60) {
      return `Synced ${minutes} minutes ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours === 1) {
      return 'Synced 1 hour ago';
    }
    if (hours < 24) {
      return `Synced ${hours} hours ago`;
    }
    const days = Math.round(hours / 24);
    return `Synced ${days} day${days > 1 ? 's' : ''} ago`;
  } catch (error) {
    return 'Synced recently';
  }
}

function ThemePreview({ theme, device }) {
  const textColor = getTextColor(theme);
  const background = getBackgroundStyle(theme);
  const buttonRadius = theme.buttonShape === 'pill' ? '9999px' : theme.buttonShape === 'square' ? '16px' : '24px';
  const surfaces = getSurfaceTokens(theme);
  const navBackground = surfaces.navBackground;
  const cardBackground = surfaces.cardBackground;
  const borderColor = surfaces.borderColor;

  const deviceConfig = DEVICE_OPTIONS.find((option) => option.id === device) ?? DEVICE_OPTIONS[0];

  return (
    <div className="flex w-full justify-center">
      <div
        className={`${deviceConfig.frameClass} border border-white/20 bg-slate-900/10 p-3 shadow-inner backdrop-blur xl:p-4`}
        style={{ borderColor }}
      >
        <div
          className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/10 shadow-[0_40px_60px_-24px_rgba(15,23,42,0.35)]"
          style={{
            background,
            fontFamily: `'${theme.fontFamily}', sans-serif`,
            color: textColor,
            borderColor,
          }}
        >
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium"
            style={{ background: navBackground, color: textColor }}
          >
            <span className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full border border-white/50 bg-white/10" />
              <span>gigvora.site</span>
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-70">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.accentColor }} />
              Live
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-5">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <SparklesIcon className="h-4 w-4" />
                Signature experience
              </span>
              <h3 className="text-2xl font-semibold leading-snug">
                Showcase your studio with immersive storytelling and live proof.
              </h3>
              <p className="text-sm opacity-80">
                Real-time testimonials, case studies, and service collections adapt to each visitor persona.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  style={{
                    background: theme.accentColor,
                    color: theme.backgroundStyle === 'light' ? '#0B1222' : '#0B1222',
                    borderRadius: buttonRadius,
                  }}
                  className={`px-4 py-2 text-sm font-semibold shadow-lg shadow-slate-900/20 ${
                    theme.reduceMotion ? '' : 'transition duration-200 hover:brightness-105'
                  }`}
                >
                  Start collaboration
                </button>
                <button
                  type="button"
                  style={{
                    color: textColor,
                    borderColor: textColor,
                    borderRadius: buttonRadius,
                  }}
                  className={`border px-4 py-2 text-sm font-semibold opacity-90 ${
                    theme.reduceMotion ? '' : 'transition duration-200 hover:opacity-100'
                  }`}
                >
                  Watch walkthrough
                </button>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3">
              <div
                className="flex flex-col justify-between rounded-2xl border p-4 text-sm shadow-lg"
                style={{ background: cardBackground, borderColor }}
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide opacity-70">
                  Momentum
                  <span>Live</span>
                </div>
                <div className="space-y-2 pt-3">
                  <div className="h-2 rounded-full" style={{ background: `${theme.accentColor}40` }}>
                    <div className="h-full rounded-full" style={{ width: '72%', background: theme.accentColor }} />
                  </div>
                  <p className="text-sm opacity-80">
                    18 new briefs routed to your inbox this week.
                  </p>
                </div>
              </div>
              <div
                className="flex flex-col gap-3 rounded-2xl border p-4 text-sm"
                style={{ background: cardBackground, borderColor }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-10 w-10 rounded-full border border-white/30 bg-white/10" />
                  <div>
                    <p className="text-sm font-semibold">Featured testimonial</p>
                    <p className="text-xs opacity-70">Founder • Latitude Labs</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed opacity-80">
                  “The personalization engine feels like having a head of experience on call 24/7.”
                </p>
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span>Conversion lift</span>
                  <span className="font-semibold" style={{ color: theme.accentColor }}>
                    +32%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ThemePreview.propTypes = {
  theme: PropTypes.shape({
    primaryColor: PropTypes.string.isRequired,
    accentColor: PropTypes.string.isRequired,
    backgroundStyle: PropTypes.string.isRequired,
    fontFamily: PropTypes.string.isRequired,
    buttonShape: PropTypes.string.isRequired,
  }).isRequired,
  device: PropTypes.oneOf(DEVICE_OPTIONS.map((option) => option.id)).isRequired,
};

export default function ThemeSwitcher({
  theme,
  onChange,
  canEdit,
  storageKey = 'gigvora:theme-preferences',
  presets = PRESET_THEMES,
}) {
  const normalizedTheme = useMemo(() => normalizeTheme(theme), [theme]);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [lastSynced, setLastSynced] = useState(normalizedTheme.lastSyncedAt);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(false);
  const hydrationRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (event) => setSystemPrefersDark(event.matches);
    setSystemPrefersDark(mql.matches);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (event) => setSystemPrefersReducedMotion(event.matches);
    setSystemPrefersReducedMotion(mql.matches);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (hydrationRef.current) {
      return;
    }
    if (typeof window === 'undefined' || !storageKey) {
      hydrationRef.current = true;
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.theme) {
          const storedTheme = normalizeTheme(parsed.theme);
          const currentTheme = normalizeTheme(theme);
          if (JSON.stringify(storedTheme) !== JSON.stringify(currentTheme)) {
            onChange?.(storedTheme);
          }
          setLastSynced(parsed.syncedAt ?? storedTheme.lastSyncedAt ?? null);
        }
      }
    } catch (error) {
      // ignore hydration errors silently
    } finally {
      hydrationRef.current = true;
    }
  }, [storageKey, onChange, theme]);

  useEffect(() => {
    if (!hydrationRef.current) {
      return;
    }
    if (typeof window === 'undefined' || !storageKey) {
      return;
    }
    try {
      const syncedAt = new Date().toISOString();
      const payload = JSON.stringify({ theme: normalizedTheme, syncedAt });
      window.localStorage.setItem(storageKey, payload);
      setLastSynced(syncedAt);
    } catch (error) {
      // Swallow storage errors (e.g. private mode)
    }
  }, [normalizedTheme, storageKey]);

  const accentSwatches = useMemo(() => {
    const palette = normalizedTheme.accentPalette?.length ? normalizedTheme.accentPalette : BASE_THEME.accentPalette;
    return Array.from(new Set([normalizedTheme.accentColor, ...palette])).slice(0, 8);
  }, [normalizedTheme.accentColor, normalizedTheme.accentPalette]);

  const activePresetId = useMemo(() => computeActivePreset(normalizedTheme, presets), [normalizedTheme, presets]);

  const personalizationHighlights = useMemo(() => {
    const highlights = [];
    if (normalizedTheme.accessibilityPreset === 'high-contrast') {
      highlights.push({
        id: 'contrast',
        label: 'High contrast preset activated for low-vision audiences.',
        color: '#22C55E',
      });
    } else if (normalizedTheme.accessibilityPreset === 'calm-reading') {
      highlights.push({
        id: 'contrast',
        label: 'Calm reading preset softens surfaces for editorial journeys.',
        color: '#38BDF8',
      });
    } else {
      highlights.push({
        id: 'contrast',
        label: 'Standard contrast keeps gradients and brand story balanced.',
        color: '#6366F1',
      });
    }

    highlights.push({
      id: 'sync',
      label: normalizedTheme.systemSync
        ? 'Visitors inherit their OS light/dark preference automatically.'
        : 'Manual mode locks a consistent look regardless of device settings.',
      color: normalizedTheme.systemSync ? '#22C55E' : '#F97316',
    });

    highlights.push({
      id: 'motion',
      label: normalizedTheme.reduceMotion
        ? 'Motion trimmed for guests sensitive to animation or vestibular triggers.'
        : 'Animated feedback elevates interactions for engaged visitors.',
      color: normalizedTheme.reduceMotion ? '#22C55E' : '#0EA5E9',
    });

    return highlights;
  }, [normalizedTheme.accessibilityPreset, normalizedTheme.systemSync, normalizedTheme.reduceMotion]);

  const interactiveMotionClass = normalizedTheme.reduceMotion ? '' : 'transition duration-200';

  const handlePresetSelect = (preset) => {
    if (!canEdit) {
      return;
    }
    onChange?.({
      ...normalizedTheme,
      ...preset.preview,
      presetId: preset.id,
    });
  };

  const handleAccentChange = (color) => {
    if (!canEdit) {
      return;
    }
    onChange?.({
      ...normalizedTheme,
      accentColor: color,
      accentPalette: Array.from(new Set([color, ...accentSwatches])),
    });
  };

  const handlePrimaryChange = (event) => {
    if (!canEdit) {
      return;
    }
    onChange?.({
      ...normalizedTheme,
      primaryColor: event.target.value,
    });
  };

  const handleCustomAccent = (event) => {
    if (!canEdit) {
      return;
    }
    handleAccentChange(event.target.value);
  };

  const handleBackgroundChange = (value) => {
    if (!canEdit) {
      return;
    }
    onChange?.({
      ...normalizedTheme,
      backgroundStyle: value,
      presetId: value === 'gradient' ? normalizedTheme.presetId : normalizedTheme.presetId,
    });
  };

  const handleFontChange = (event) => {
    if (!canEdit) {
      return;
    }
    onChange?.({
      ...normalizedTheme,
      fontFamily: event.target.value,
      presetId: normalizedTheme.presetId,
    });
  };

  const handleShapeChange = (value) => {
    if (!canEdit) {
      return;
    }
    onChange?.({
      ...normalizedTheme,
      buttonShape: value,
    });
  };

  const handleAccessibilitySelect = (presetId) => {
    if (!canEdit) {
      return;
    }
    onChange?.({
      ...normalizedTheme,
      accessibilityPreset: presetId,
    });
  };

  const handleSystemSyncToggle = () => {
    if (!canEdit) {
      return;
    }
    onChange?.({
      ...normalizedTheme,
      systemSync: !normalizedTheme.systemSync,
    });
  };

  const handleReduceMotionToggle = () => {
    if (!canEdit) {
      return;
    }
    onChange?.({
      ...normalizedTheme,
      reduceMotion: !normalizedTheme.reduceMotion,
    });
  };

  const handleReset = () => {
    if (!canEdit) {
      return;
    }
    onChange?.({ ...BASE_THEME });
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Experience themes</h3>
          <p className="text-sm text-slate-500">
            Curate polished presets, fine-tune accents, and preview how your site adapts across devices.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            <ArrowPathIcon className="h-4 w-4" />
            {formatRelativeTime(lastSynced)}
          </span>
          <button
            type="button"
            onClick={handleReset}
            disabled={!canEdit}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed"
          >
            Reset to default
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Curated presets</h4>
              {systemPrefersDark ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                  <MoonIcon className="h-3.5 w-3.5" />
                  System suggests dark
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {presets.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    disabled={!canEdit}
                    className={`group flex flex-col rounded-2xl border px-4 py-4 text-left shadow-sm ${interactiveMotionClass} focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-md'
                    } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span className="flex items-center justify-between text-sm font-semibold">
                      {preset.name}
                      {isActive ? <SparklesIcon className="h-4 w-4" /> : null}
                    </span>
                    <span className={`mt-2 text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                      {preset.description}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ background: preset.preview.accentColor }} />
                      {preset.preview.backgroundStyle} mode
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fine-tuning</h4>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Primary brand color</span>
                <input
                  type="color"
                  value={normalizedTheme.primaryColor}
                  onChange={handlePrimaryChange}
                  disabled={!canEdit}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                />
              </label>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accent palette</span>
                <div className="flex flex-wrap items-center gap-2">
                  {accentSwatches.map((swatch) => {
                    const isActive = normalizedTheme.accentColor.toLowerCase() === swatch.toLowerCase();
                    return (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => handleAccentChange(swatch)}
                        disabled={!canEdit}
                        className={`h-9 w-9 rounded-full border ${interactiveMotionClass} ${
                          isActive ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-900' : 'border-slate-200'
                        } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                        style={{ background: swatch }}
                        aria-label={`Set accent color ${swatch}`}
                      />
                    );
                  })}
                  <label className="relative flex h-9 w-16 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    <span>Custom</span>
                    <input
                      type="color"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      value={normalizedTheme.accentColor}
                      onChange={handleCustomAccent}
                      disabled={!canEdit}
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Background treatments</span>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUND_STYLES.map((option) => {
                    const isActive = normalizedTheme.backgroundStyle === option.value;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleBackgroundChange(option.value)}
                        disabled={!canEdit}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${interactiveMotionClass} ${
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Font pairing</span>
                <select
                  value={normalizedTheme.fontFamily}
                  onChange={handleFontChange}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Button shape</span>
                <div className="flex gap-2">
                  {['rounded', 'pill', 'square'].map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => handleShapeChange(shape)}
                      disabled={!canEdit}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold capitalize ${interactiveMotionClass} ${
                      normalizedTheme.buttonShape === shape
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sync across devices</span>
                  <button
                    type="button"
                    onClick={handleSystemSyncToggle}
                    disabled={!canEdit}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full border ${
                      normalizedTheme.systemSync
                        ? 'border-slate-900 bg-slate-900'
                        : 'border-slate-200 bg-white'
                    } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                    aria-pressed={normalizedTheme.systemSync}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ${
                        normalizedTheme.systemSync ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Remember theme preferences for signed-in visitors and honor their OS light/dark setting when enabled.
                </p>
                <div className="rounded-2xl border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>Reduce motion</span>
                      {systemPrefersReducedMotion ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          System suggests
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={handleReduceMotionToggle}
                      disabled={!canEdit}
                      className={`relative inline-flex h-6 w-12 items-center rounded-full border ${
                        normalizedTheme.reduceMotion
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-200 bg-white'
                      } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                      aria-pressed={normalizedTheme.reduceMotion}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ${
                          normalizedTheme.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Calms parallax and hover treatments when accessibility teams flag motion sensitivity.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accessibility presets</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                  {normalizedTheme.accessibilityPreset.replace('-', ' ')}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {ACCESSIBILITY_PRESETS.map((preset) => {
                  const isActive = normalizedTheme.accessibilityPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleAccessibilitySelect(preset.id)}
                      disabled={!canEdit}
                      className={`flex flex-col rounded-xl border px-3 py-3 text-left text-sm ${interactiveMotionClass} ${
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <span className="font-semibold">{preset.name}</span>
                      <span className={`mt-1 text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{preset.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</h4>
            <div className="flex gap-2">
              {DEVICE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = previewDevice === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPreviewDevice(option.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${interactiveMotionClass} ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <ThemePreview theme={normalizedTheme} device={previewDevice} />
          <div className="space-y-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Personalization checklist</p>
            <ul className="space-y-1">
              {personalizationHighlights.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span
                    className="mt-1 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

ThemeSwitcher.propTypes = {
  theme: PropTypes.shape({
    primaryColor: PropTypes.string,
    accentColor: PropTypes.string,
    backgroundStyle: PropTypes.string,
    fontFamily: PropTypes.string,
    buttonShape: PropTypes.string,
    presetId: PropTypes.string,
    systemSync: PropTypes.bool,
    lastSyncedAt: PropTypes.string,
    accentPalette: PropTypes.arrayOf(PropTypes.string),
    accessibilityPreset: PropTypes.string,
    reduceMotion: PropTypes.bool,
  }),
  onChange: PropTypes.func,
  canEdit: PropTypes.bool,
  storageKey: PropTypes.string,
  presets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      preview: PropTypes.shape({
        primaryColor: PropTypes.string.isRequired,
        accentColor: PropTypes.string.isRequired,
        backgroundStyle: PropTypes.string.isRequired,
        fontFamily: PropTypes.string.isRequired,
        buttonShape: PropTypes.string.isRequired,
      }).isRequired,
    }),
  ),
};

ThemeSwitcher.defaultProps = {
  theme: BASE_THEME,
  onChange: undefined,
  canEdit: true,
  storageKey: 'gigvora:theme-preferences',
  presets: PRESET_THEMES,
};
