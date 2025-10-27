import baseModels from '../models/appearanceModels.js';
import logger from '../utils/logger.js';

let modelsContainer = baseModels;
let log = logger.child({ component: 'themeFabricService' });

function getModels(strict = false) {
  const container = modelsContainer ?? baseModels;
  if (strict) {
    if (!container?.AppearanceTheme || !container?.AppearanceComponentProfile) {
      throw new Error('Appearance models are not configured.');
    }
  }
  return container;
}

function refreshLogger(nextLogger) {
  if (nextLogger) {
    log = typeof nextLogger.child === 'function' ? nextLogger.child({ component: 'themeFabricService' }) : nextLogger;
  } else {
    log = logger.child({ component: 'themeFabricService' });
  }
}

export function __setDependencies({ models: overrides, logger: loggerOverride } = {}) {
  modelsContainer = overrides ?? baseModels;
  refreshLogger(loggerOverride);
}

export function __resetDependencies() {
  modelsContainer = baseModels;
  refreshLogger();
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function coerceNumber(value, fallback, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max, fallback);
}

function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') {
    return `rgba(37, 99, 235, ${alpha})`;
  }
  const trimmed = hex.replace('#', '').trim();
  if (!trimmed) {
    return `rgba(37, 99, 235, ${alpha})`;
  }
  const normalized = trimmed.length === 3
    ? trimmed
        .split('')
        .map((char) => char.repeat(2))
        .join('')
    : trimmed.slice(0, 6);
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return `rgba(37, 99, 235, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toRem(px, fallback = '1rem') {
  const value = Number.parseFloat(px);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return `${(value / 16).toFixed(3)}rem`;
}

function buildAccentPreset(themeTokens, slug) {
  const colors = themeTokens.colors ?? {};
  const accent = colors.accent ?? colors.primary ?? '#2563EB';
  const accentStrong = colors.secondary ?? colors.accent ?? colors.primary ?? '#1D4ED8';
  const primary = colors.primary ?? accent;
  return {
    accent,
    accentStrong,
    accentSoft: hexToRgba(accent, 0.16),
    primary,
    primarySoft: hexToRgba(primary, 0.12),
  };
}

function deriveSpacing(layoutTokens = {}) {
  const baseCardSpacing = coerceNumber(layoutTokens.cardSpacing, 16, { min: 8, max: 64 });
  const baseSectionGutter = coerceNumber(layoutTokens.sectionGutter, 72, { min: 32, max: 200 });
  const scale = clamp(baseCardSpacing / 16, 0.75, 1.5, 1);
  return {
    values: {
      xs: clamp(baseCardSpacing * 0.25, 4, 12, 4),
      sm: clamp(baseCardSpacing * 0.5, 6, 18, 8),
      md: clamp(baseCardSpacing, 12, 32, 16),
      lg: clamp(baseSectionGutter * 0.35, 20, 48, 24),
      xl: clamp(baseSectionGutter * 0.55, 28, 80, 40),
    },
    scale,
  };
}

function deriveRadii(layoutTokens = {}) {
  const borderRadius = coerceNumber(layoutTokens.borderRadius, 16, { min: 8, max: 48 });
  const surfaceRadius = coerceNumber(layoutTokens.surfaceRadius, 28, { min: 12, max: 64 });
  return {
    sm: toRem(borderRadius * 0.5, '0.75rem'),
    md: toRem(borderRadius, '1.5rem'),
    lg: toRem(surfaceRadius, '2.5rem'),
  };
}

function deriveShadows(componentsTokens = {}) {
  const strength = clamp(componentsTokens.shadowStrength ?? 0.18, 0.05, 0.35, 0.18);
  const base = (opacity) => `0 24px 60px -30px rgba(15, 23, 42, ${opacity})`;
  return {
    soft: base(strength + 0.07),
    subtle: `0 16px 40px -22px rgba(15, 23, 42, ${(strength + 0.03).toFixed(2)})`,
    focus: `0 0 0 4px ${hexToRgba('#38BDF8', 0.20)}`,
  };
}

function deriveOverlays(imageryTokens = {}, accentColor) {
  const heroBackground = imageryTokens.heroBackground ?? 'gradient:indigo-cyan';
  const gradientAccent = hexToRgba(accentColor, 0.14);
  if (heroBackground.startsWith('gradient')) {
    return {
      shellPrimary: `radial-gradient(circle at top, ${gradientAccent}, transparent 60%)`,
      shellDesktop: `linear-gradient(120deg, ${hexToRgba(accentColor, 0.16)} 0%, transparent 70%)`,
    };
  }
  return {
    shellPrimary: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.22)} 0%, transparent 75%)`,
    shellDesktop: `linear-gradient(120deg, ${hexToRgba(accentColor, 0.18)} 0%, transparent 80%)`,
  };
}

function buildTypography(typographyTokens = {}) {
  const headingFamily = typographyTokens.headingFamily ?? 'Inter';
  const bodyFamily = typographyTokens.bodyFamily ?? typographyTokens.headingFamily ?? 'Inter';
  const monospaceFamily = typographyTokens.monospaceFamily ?? 'JetBrains Mono';
  const baseSize = coerceNumber(typographyTokens.baseFontSize, 16, { min: 14, max: 20 });
  const lineHeight = coerceNumber(typographyTokens.lineHeight, 1.6, { min: 1.4, max: 1.9 });
  const headingWeight = coerceNumber(typographyTokens.headingWeight, 600, { min: 400, max: 800 });
  const bodyWeight = coerceNumber(typographyTokens.bodyWeight, 400, { min: 300, max: 600 });

  const headingScale = [0.85, 1, 1.25, 1.55, 1.95];
  const bodyScale = [0.875, 1, 1.125];
  const labelScale = [0.75, 0.875];

  const fontSans = `'${headingFamily}', 'Helvetica Neue', Arial, sans-serif`;
  const fontMono = `'${monospaceFamily}', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`;

  const heading = {
    xs: `${headingWeight} ${(headingScale[0] * baseSize) / 16}rem/${lineHeight} ${fontSans}`,
    sm: `${headingWeight} ${(headingScale[1] * baseSize) / 16}rem/${lineHeight} ${fontSans}`,
    md: `${headingWeight} ${(headingScale[2] * baseSize) / 16}rem/${lineHeight} ${fontSans}`,
    lg: `${headingWeight} ${(headingScale[3] * baseSize) / 16}rem/${(lineHeight * 0.95).toFixed(2)} ${fontSans}`,
    xl: `${headingWeight} ${(headingScale[4] * baseSize) / 16}rem/${(lineHeight * 0.92).toFixed(2)} ${fontSans}`,
  };

  const body = {
    sm: `${bodyWeight} ${(bodyScale[0] * baseSize) / 16}rem/${(lineHeight * 1.02).toFixed(2)} ${fontSans}`,
    md: `${bodyWeight} ${(bodyScale[1] * baseSize) / 16}rem/${(lineHeight * 1.08).toFixed(2)} ${fontSans}`,
    lg: `${bodyWeight} ${(bodyScale[2] * baseSize) / 16}rem/${(lineHeight * 1.12).toFixed(2)} ${fontSans}`,
  };

  const label = {
    sm: `${headingWeight} ${(labelScale[0] * baseSize) / 16}rem/${(lineHeight * 0.95).toFixed(2)} ${fontSans}`,
    md: `${headingWeight} ${(labelScale[1] * baseSize) / 16}rem/${(lineHeight * 0.95).toFixed(2)} ${fontSans}`,
  };

  return {
    fontSans,
    fontMono,
    heading,
    body,
    label,
  };
}

function buildModeTokens(themeTokens = {}, accentPreset) {
  const colors = themeTokens.colors ?? {};
  const accent = accentPreset?.accent ?? '#2563EB';
  const focus = hexToRgba(accent, 0.32);
  const lightColors = {
    background: colors.background ?? '#F8FAFC',
    surface: colors.surface ?? '#FFFFFF',
    surfaceMuted: hexToRgba(colors.surface ?? '#FFFFFF', 0.85),
    surfaceElevated: hexToRgba(colors.surface ?? '#FFFFFF', 0.92),
    border: colors.border ?? 'rgba(148, 163, 184, 0.45)',
    borderStrong: colors.borderStrong ?? colors.border ?? 'rgba(71, 85, 105, 0.6)',
    text: colors.textPrimary ?? '#0F172A',
    textMuted: colors.textSecondary ?? '#475569',
    textOnAccent: '#FFFFFF',
    focus,
  };

  const darkColors = {
    background: '#0B1120',
    surface: '#111827',
    surfaceMuted: 'rgba(30, 41, 59, 0.78)',
    surfaceElevated: 'rgba(30, 41, 59, 0.92)',
    border: 'rgba(148, 163, 184, 0.35)',
    borderStrong: 'rgba(226, 232, 240, 0.45)',
    text: '#E2E8F0',
    textMuted: '#CBD5F5',
    textOnAccent: '#0F172A',
    focus: hexToRgba(accent, 0.45),
  };

  const highContrastColors = {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceMuted: '#F8FAFC',
    surfaceElevated: '#FFFFFF',
    border: '#000000',
    borderStrong: '#000000',
    text: '#000000',
    textMuted: '#0F172A',
    textOnAccent: '#000000',
    focus: '#000000',
  };

  const shadows = deriveShadows(themeTokens.components ?? {});
  const overlays = deriveOverlays(themeTokens.imagery ?? {}, accent);

  return {
    light: { colors: lightColors, shadows, overlays },
    dark: { colors: darkColors, shadows: { ...shadows, focus: hexToRgba(accent, 0.28) }, overlays },
    'high-contrast': { colors: highContrastColors, shadows: { soft: '0 0 0 0 rgba(0,0,0,0)', subtle: '0 0 0 0 rgba(0,0,0,0)', focus: '0 0 0 3px #000000' }, overlays },
  };
}

function normaliseComponentProfiles(profiles = []) {
  const tokens = {};
  const versions = [];
  profiles.forEach((profile) => {
    const payload = profile.toPublicObject();
    const key = payload?.componentKey ? `${payload.componentKey}`.trim() : '';
    if (!key) {
      return;
    }
    tokens[key] = payload.definition ?? {};
    if (payload.metadata?.version) {
      versions.push(`${payload.metadata.version}`.trim());
    }
  });
  const sortedVersions = versions
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  return {
    tokens,
    version: sortedVersions.at(-1) ?? '1.0.0',
  };
}

function buildFabric(theme) {
  const accentKey = theme.slug ? theme.slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase() : 'gigvora-daybreak';
  const accentPreset = buildAccentPreset(theme.tokens ?? {}, accentKey);
  const spacing = deriveSpacing(theme.tokens?.layout ?? {});
  const radii = deriveRadii(theme.tokens?.layout ?? {});
  const typography = buildTypography(theme.tokens?.typography ?? {});
  const modes = buildModeTokens(theme.tokens ?? {}, accentPreset);
  const densityScale = {
    spacious: 1.08,
    comfortable: 1,
    cozy: 0.94,
    compact: 0.88,
  };

  return {
    version: [theme.updatedAt?.toISOString(), theme.id].filter(Boolean).join('@') || 'unversioned',
    theme: {
      slug: theme.slug,
      name: theme.name,
      status: theme.status,
      accentPresets: { [accentKey]: accentPreset },
      densityScale,
      spacing,
      radii,
      typography,
      modes,
      metadata: {
        themeId: theme.id,
        accessibility: theme.accessibility ?? {},
        updatedAt: theme.updatedAt ?? theme.createdAt ?? null,
      },
    },
    components: { tokens: {}, version: '1.0.0' },
    metadata: {
      source: 'appearance-theme',
      fetchedAt: new Date().toISOString(),
    },
  };
}

export async function getThemeFabric({ includeComponentProfiles = true } = {}) {
  const { AppearanceTheme, AppearanceComponentProfile } = getModels(true);
  const theme = await AppearanceTheme.findOne({
    order: [
      ['isDefault', 'DESC'],
      ['updatedAt', 'DESC'],
    ],
  });

  if (!theme) {
    log.warn('No appearance theme configured. Falling back to baseline fabric.');
    return {
      version: 'fallback',
      theme: {
        slug: 'gigvora-baseline',
        name: 'Gigvora Baseline',
        status: 'draft',
        accentPresets: {
          azure: buildAccentPreset({}, 'azure'),
        },
        densityScale: {
          spacious: 1.05,
          comfortable: 1,
          cozy: 0.92,
          compact: 0.85,
        },
        spacing: {
          values: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 },
          scale: 1,
        },
        radii: {
          sm: '0.75rem',
          md: '1.5rem',
          lg: '2.5rem',
        },
        typography: buildTypography({}),
        modes: buildModeTokens({}, buildAccentPreset({}, 'azure')),
        metadata: {
          themeId: null,
          accessibility: {},
          updatedAt: null,
        },
      },
      components: { tokens: {}, version: '1.0.0' },
      metadata: {
        source: 'fallback',
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  const payload = theme.toPublicObject({ includeRelations: false });
  const fabric = buildFabric(payload);

  if (includeComponentProfiles) {
    const profiles = await AppearanceComponentProfile.findAll({
      where: { themeId: theme.id, status: 'active' },
      order: [
        ['componentKey', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
    });
    const components = normaliseComponentProfiles(profiles);
    fabric.components = components;
  }

  fabric.metadata.themeId = payload.id;
  fabric.metadata.themeSlug = payload.slug;
  fabric.metadata.themeUpdatedAt = payload.updatedAt ?? payload.createdAt ?? null;

  return fabric;
}

export default {
  getThemeFabric,
  __setDependencies,
  __resetDependencies,
};
