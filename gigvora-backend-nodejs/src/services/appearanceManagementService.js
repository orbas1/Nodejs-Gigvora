import assert from 'node:assert/strict';
import { Op } from 'sequelize';
import sequelize from '../models/sequelizeClient.js';
import {
  AppearanceTheme,
  AppearanceAsset,
  AppearanceLayout,
  AppearanceComponentProfile,
  APPEARANCE_THEME_STATUSES,
  APPEARANCE_ASSET_TYPES,
  APPEARANCE_ASSET_STATUSES,
  APPEARANCE_LAYOUT_STATUSES,
  APPEARANCE_LAYOUT_PAGES,
  APPEARANCE_COMPONENT_PROFILE_STATUSES,
} from '../models/appearanceModels.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import {
  DEFAULT_COMPONENT_TOKENS,
  mergeComponentTokens,
} from '../../../shared-contracts/domain/platform/component-tokens.js';

const log = logger.child({ module: 'AppearanceManagementService' });

const COMPONENT_KEYS = Object.freeze([
  'buttonSuite',
  'inputFieldSet',
  'cardScaffold',
  'brandBadge',
  'personaChip',
  'statBlock',
]);
const COMPONENT_KEY_LOOKUP = new Map(
  [
    ['buttonsuite', 'buttonSuite'],
    ['buttonsuitejsx', 'buttonSuite'],
    ['button_suite', 'buttonSuite'],
    ['inputfieldset', 'inputFieldSet'],
    ['inputfieldsetjsx', 'inputFieldSet'],
    ['input_field_set', 'inputFieldSet'],
    ['cardscaffold', 'cardScaffold'],
    ['cardscaffoldjsx', 'cardScaffold'],
    ['card_scaffold', 'cardScaffold'],
    ['brandbadge', 'brandBadge'],
    ['brandbadgejsx', 'brandBadge'],
    ['brand_badge', 'brandBadge'],
    ['personachip', 'personaChip'],
    ['persona_chip', 'personaChip'],
    ['personachipjsx', 'personaChip'],
    ['statblock', 'statBlock'],
    ['stat_block', 'statBlock'],
    ['statblockjsx', 'statBlock'],
  ].map(([key, value]) => [key.replace(/[^a-z0-9]/gi, '').toLowerCase(), value]),
);

const DEFAULT_THEME_TOKENS = Object.freeze({
  colors: {
    primary: '#2563EB',
    secondary: '#0EA5E9',
    accent: '#F97316',
    surface: '#FFFFFF',
    background: '#F8FAFC',
    border: '#E2E8F0',
    muted: '#CBD5F5',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
  },
  typography: {
    headingFamily: 'Inter',
    bodyFamily: 'Inter',
    monospaceFamily: 'JetBrains Mono',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 600,
    bodyWeight: 400,
    tracking: 0,
  },
  layout: {
    borderRadius: 16,
    surfaceRadius: 24,
    sectionGutter: 64,
    cardSpacing: 24,
    containerWidth: 1200,
    gridColumns: 12,
  },
  components: {
    buttonShape: 'pill',
    buttonWeight: 'semibold',
    navStyle: 'floating',
    shadowStrength: 0.15,
    inputStyle: 'rounded',
  },
  imagery: {
    heroBackground: 'gradient:indigo-cyan',
    pattern: 'diagonal-lines',
    illustrationStyle: '3d',
  },
});

function slugify(value) {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 160);
}

function coerceString(value) {
  if (value == null) {
    return '';
  }
  return `${value}`.trim();
}

function coerceOptionalString(value) {
  const normalized = coerceString(value);
  return normalized.length ? normalized : undefined;
}

function coerceBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
}

function coerceNumber(value, fallback, { min, max, precision, integer = false } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  let next = numeric;
  if (typeof min === 'number' && next < min) {
    next = min;
  }
  if (typeof max === 'number' && next > max) {
    next = max;
  }
  if (integer) {
    next = Math.trunc(next);
  }
  if (typeof precision === 'number') {
    const multiplier = 10 ** precision;
    next = Math.round(next * multiplier) / multiplier;
  }
  return next;
}

function sanitizeColor(value, fallback) {
  const candidate = coerceString(value);
  if (!candidate) {
    return fallback;
  }
  if (/^#?[0-9a-f]{3,8}$/i.test(candidate)) {
    return candidate.startsWith('#') ? candidate : `#${candidate}`;
  }
  return fallback;
}

function sanitizeTokens(input = {}) {
  const tokens = {
    colors: { ...DEFAULT_THEME_TOKENS.colors },
    typography: { ...DEFAULT_THEME_TOKENS.typography },
    layout: { ...DEFAULT_THEME_TOKENS.layout },
    components: { ...DEFAULT_THEME_TOKENS.components },
    imagery: { ...DEFAULT_THEME_TOKENS.imagery },
  };

  if (input && typeof input === 'object') {
    if (input.colors && typeof input.colors === 'object') {
      Object.entries(input.colors).forEach(([key, value]) => {
        tokens.colors[key] = sanitizeColor(value, tokens.colors[key]);
      });
    }
    if (input.typography && typeof input.typography === 'object') {
      const typography = input.typography;
      if (typography.headingFamily != null) tokens.typography.headingFamily = coerceString(typography.headingFamily) || tokens.typography.headingFamily;
      if (typography.bodyFamily != null) tokens.typography.bodyFamily = coerceString(typography.bodyFamily) || tokens.typography.bodyFamily;
      if (typography.monospaceFamily != null)
        tokens.typography.monospaceFamily = coerceString(typography.monospaceFamily) || tokens.typography.monospaceFamily;
      if (typography.baseFontSize != null)
        tokens.typography.baseFontSize = coerceNumber(typography.baseFontSize, tokens.typography.baseFontSize, {
          min: 12,
          max: 22,
          precision: 1,
        });
      if (typography.lineHeight != null)
        tokens.typography.lineHeight = coerceNumber(typography.lineHeight, tokens.typography.lineHeight, {
          min: 1,
          max: 2.4,
          precision: 2,
        });
      if (typography.headingWeight != null)
        tokens.typography.headingWeight = coerceNumber(typography.headingWeight, tokens.typography.headingWeight, {
          min: 100,
          max: 900,
          integer: true,
        });
      if (typography.bodyWeight != null)
        tokens.typography.bodyWeight = coerceNumber(typography.bodyWeight, tokens.typography.bodyWeight, {
          min: 100,
          max: 900,
          integer: true,
        });
      if (typography.tracking != null)
        tokens.typography.tracking = coerceNumber(typography.tracking, tokens.typography.tracking, {
          min: -2,
          max: 4,
          precision: 2,
        });
    }
    if (input.layout && typeof input.layout === 'object') {
      const layout = input.layout;
      if (layout.borderRadius != null)
        tokens.layout.borderRadius = coerceNumber(layout.borderRadius, tokens.layout.borderRadius, { min: 0, max: 48, precision: 1 });
      if (layout.surfaceRadius != null)
        tokens.layout.surfaceRadius = coerceNumber(layout.surfaceRadius, tokens.layout.surfaceRadius, { min: 0, max: 64, precision: 1 });
      if (layout.sectionGutter != null)
        tokens.layout.sectionGutter = coerceNumber(layout.sectionGutter, tokens.layout.sectionGutter, { min: 32, max: 160, precision: 0 });
      if (layout.cardSpacing != null)
        tokens.layout.cardSpacing = coerceNumber(layout.cardSpacing, tokens.layout.cardSpacing, { min: 8, max: 64, precision: 0 });
      if (layout.containerWidth != null)
        tokens.layout.containerWidth = coerceNumber(layout.containerWidth, tokens.layout.containerWidth, { min: 960, max: 1440, precision: 0 });
      if (layout.gridColumns != null)
        tokens.layout.gridColumns = coerceNumber(layout.gridColumns, tokens.layout.gridColumns, { min: 2, max: 16, integer: true });
    }
    if (input.components && typeof input.components === 'object') {
      const components = input.components;
      if (components.buttonShape != null) tokens.components.buttonShape = coerceString(components.buttonShape) || tokens.components.buttonShape;
      if (components.buttonWeight != null)
        tokens.components.buttonWeight = coerceString(components.buttonWeight) || tokens.components.buttonWeight;
      if (components.navStyle != null) tokens.components.navStyle = coerceString(components.navStyle) || tokens.components.navStyle;
      if (components.shadowStrength != null)
        tokens.components.shadowStrength = coerceNumber(components.shadowStrength, tokens.components.shadowStrength, {
          min: 0,
          max: 1,
          precision: 2,
        });
      if (components.inputStyle != null) tokens.components.inputStyle = coerceString(components.inputStyle) || tokens.components.inputStyle;
    }
    if (input.imagery && typeof input.imagery === 'object') {
      const imagery = input.imagery;
      if (imagery.heroBackground != null)
        tokens.imagery.heroBackground = coerceString(imagery.heroBackground) || tokens.imagery.heroBackground;
      if (imagery.pattern != null) tokens.imagery.pattern = coerceString(imagery.pattern) || tokens.imagery.pattern;
      if (imagery.illustrationStyle != null)
        tokens.imagery.illustrationStyle = coerceString(imagery.illustrationStyle) || tokens.imagery.illustrationStyle;
    }
  }

  return tokens;
}

function sanitizeAccessibility(input = {}) {
  const accessibility = {
    minimumContrastRatio: 4.5,
    dyslexiaSafeFonts: false,
    reducedMotion: false,
    notes: '',
  };

  if (input && typeof input === 'object') {
    if (input.minimumContrastRatio != null)
      accessibility.minimumContrastRatio = coerceNumber(input.minimumContrastRatio, accessibility.minimumContrastRatio, {
        min: 3,
        max: 7,
        precision: 2,
      });
    if (input.dyslexiaSafeFonts != null) accessibility.dyslexiaSafeFonts = coerceBoolean(input.dyslexiaSafeFonts, accessibility.dyslexiaSafeFonts);
    if (input.reducedMotion != null) accessibility.reducedMotion = coerceBoolean(input.reducedMotion, accessibility.reducedMotion);
    if (input.notes != null) accessibility.notes = coerceString(input.notes).slice(0, 2000);
  }

  return accessibility;
}

function normalizeStatus(value, allowed, fallback) {
  const candidate = coerceString(value).toLowerCase();
  if (allowed.includes(candidate)) {
    return candidate;
  }
  return fallback;
}

function normalizeAllowedRoles(input) {
  if (!input) {
    return [];
  }
  const values = Array.isArray(input) ? input : `${input}`.split(',');
  const cleaned = values
    .map((value) => coerceString(value).toLowerCase())
    .filter((value) => value.length > 0 && value.length <= 80);
  return Array.from(new Set(cleaned));
}

function sanitizeMetadata(input) {
  if (!input || typeof input !== 'object') {
    return {};
  }
  const metadata = { ...input };
  if (metadata.width != null) metadata.width = coerceNumber(metadata.width, undefined, { min: 1, max: 8192, precision: 0 });
  if (metadata.height != null) metadata.height = coerceNumber(metadata.height, undefined, { min: 1, max: 8192, precision: 0 });
  if (metadata.aspectRatio != null)
    metadata.aspectRatio = coerceNumber(metadata.aspectRatio, undefined, { min: 0.1, max: 10, precision: 3 });
  if (metadata.focalPoint && typeof metadata.focalPoint === 'object') {
    metadata.focalPoint = {
      x: coerceNumber(metadata.focalPoint.x, 0.5, { min: 0, max: 1, precision: 3 }),
      y: coerceNumber(metadata.focalPoint.y, 0.5, { min: 0, max: 1, precision: 3 }),
    };
  }
  return metadata;
}

function sanitizeModuleItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const normalized = {
    id: coerceOptionalString(item.id),
    title: coerceString(item.title).slice(0, 160),
    description: coerceString(item.description).slice(0, 600),
    icon: coerceOptionalString(item.icon),
    media: coerceOptionalString(item.media),
  };
  if (!normalized.title) {
    return null;
  }
  if (!normalized.id) {
    normalized.id = slugify(normalized.title) || undefined;
  }
  return normalized;
}

function sanitizeLayoutModule(module, index) {
  if (!module || typeof module !== 'object') {
    return null;
  }
  const type = coerceString(module.type).toLowerCase() || 'feature';
  const normalized = {
    id: coerceOptionalString(module.id) ?? `module-${index + 1}`,
    type,
    title: coerceString(module.title).slice(0, 160),
    subtitle: coerceOptionalString(module.subtitle),
    description: coerceOptionalString(module.description),
    media: coerceOptionalString(module.media),
    mediaAlt: coerceOptionalString(module.mediaAlt),
    ctaLabel: coerceOptionalString(module.ctaLabel),
    ctaHref: coerceOptionalString(module.ctaHref),
    badge: coerceOptionalString(module.badge),
    layout: coerceOptionalString(module.layout),
    background: coerceOptionalString(module.background),
    accent: coerceOptionalString(module.accent),
    columns: coerceNumber(module.columns, undefined, { min: 1, max: 6, integer: true }),
    items: Array.isArray(module.items)
      ? module.items
          .map((item, itemIndex) => sanitizeModuleItem({ ...item, id: item?.id ?? `${type}-item-${itemIndex + 1}` }))
          .filter(Boolean)
      : undefined,
  };
  return normalized;
}

function sanitizeLayoutConfig(config = {}) {
  const sanitized = {
    modules: [],
    viewport: 'responsive',
    themeOverrides: {},
  };

  if (config && typeof config === 'object') {
    if (Array.isArray(config.modules)) {
      sanitized.modules = config.modules
        .map((module, index) => sanitizeLayoutModule(module, index))
        .filter(Boolean)
        .slice(0, 12);
    }
    if (config.viewport != null) sanitized.viewport = coerceString(config.viewport) || 'responsive';
    if (config.themeOverrides && typeof config.themeOverrides === 'object') {
      sanitized.themeOverrides = sanitizeTokens(config.themeOverrides);
    }
  }

  return sanitized;
}

function normalizeComponentKey(value) {
  const canonical = value && COMPONENT_KEYS.includes(value) ? value : null;
  if (canonical) {
    return canonical;
  }
  const normalized = coerceString(value)
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
  if (!normalized) {
    return null;
  }
  return COMPONENT_KEY_LOOKUP.get(normalized) ?? null;
}

function sanitizeComponentDefinition(componentKey, definition) {
  const overrides = definition && typeof definition === 'object' ? { [componentKey]: definition } : {};
  const merged = mergeComponentTokens(overrides)[componentKey];
  return JSON.parse(JSON.stringify(merged));
}

function sanitizeComponentMetadata(input) {
  return sanitizeMetadata(input);
}

function assertThemeExists(theme) {
  if (!theme) {
    throw new NotFoundError('Theme not found.');
  }
}

async function ensureThemeById(themeId, { transaction } = {}) {
  if (!themeId) {
    return null;
  }
  const theme = await AppearanceTheme.findByPk(themeId, { transaction });
  if (!theme) {
    throw new ValidationError('Specified theme does not exist.');
  }
  return theme;
}

async function ensureComponentProfileById(componentId, { transaction } = {}) {
  if (!componentId) {
    throw new ValidationError('componentProfileId is required.');
  }
  const profile = await AppearanceComponentProfile.findByPk(componentId, { transaction });
  if (!profile) {
    throw new NotFoundError('Component profile not found.');
  }
  return profile;
}

function serializeTheme(theme, { includeRelations = false } = {}) {
  if (!theme) {
    return null;
  }
  const object = theme.toPublicObject({ includeRelations });
  object.tokens = sanitizeTokens(object.tokens);
  object.accessibility = sanitizeAccessibility(object.accessibility);
  return object;
}

function serializeAsset(asset) {
  if (!asset) {
    return null;
  }
  const object = asset.toPublicObject();
  object.metadata = sanitizeMetadata(object.metadata);
  object.allowedRoles = normalizeAllowedRoles(object.allowedRoles);
  return object;
}

function serializeLayout(layout) {
  if (!layout) {
    return null;
  }
  const object = layout.toPublicObject();
  object.allowedRoles = normalizeAllowedRoles(object.allowedRoles);
  object.config = sanitizeLayoutConfig(object.config);
  return object;
}

function serializeComponentProfile(profile) {
  if (!profile) {
    return null;
  }
  const object = profile.toPublicObject();
  const componentKey = normalizeComponentKey(object.componentKey);
  if (!componentKey) {
    log.warn({ componentKey: object.componentKey }, 'Encountered component profile with unknown key.');
    return null;
  }
  return {
    ...object,
    componentKey,
    definition: sanitizeComponentDefinition(componentKey, object.definition),
    metadata: sanitizeComponentMetadata(object.metadata),
  };
}

export async function getAppearanceSummary() {
  const [themes, assets, layouts, componentProfiles] = await Promise.all([
    AppearanceTheme.findAll({
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    }),
    AppearanceAsset.findAll({
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    }),
    AppearanceLayout.findAll({
      order: [
        ['page', 'ASC'],
        ['name', 'ASC'],
      ],
    }),
    AppearanceComponentProfile.findAll({
      order: [
        ['componentKey', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    }),
  ]);

  const serializedThemes = themes.map((theme) => serializeTheme(theme));
  const serializedComponentProfiles = componentProfiles
    .map((profile) => serializeComponentProfile(profile))
    .filter(Boolean);
  const assetsByTheme = assets.reduce((acc, asset) => {
    const key = asset.themeId ?? 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(asset);
    return acc;
  }, {});
  const layoutsByTheme = layouts.reduce((acc, layout) => {
    const key = layout.themeId ?? 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(layout);
    return acc;
  }, {});
  const componentsByTheme = serializedComponentProfiles.reduce((acc, component) => {
    const key = component.themeId ?? 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(component);
    return acc;
  }, {});

  const enrichedThemes = serializedThemes.map((theme) => ({
    ...theme,
    componentProfiles: componentsByTheme[theme.id] ?? [],
    stats: {
      assetCount: (assetsByTheme[theme.id] ?? []).length,
      layoutCount: (layoutsByTheme[theme.id] ?? []).length,
      componentProfileCount: (componentsByTheme[theme.id] ?? []).length,
    },
  }));

  return {
    themes: enrichedThemes,
    assets: assets.map((asset) => serializeAsset(asset)),
    layouts: layouts.map((layout) => serializeLayout(layout)),
    componentProfiles: serializedComponentProfiles,
    stats: {
      totalThemes: themes.length,
      activeThemes: themes.filter((theme) => theme.status === 'active').length,
      defaultThemeId: themes.find((theme) => theme.isDefault)?.id ?? null,
      totalAssets: assets.length,
      activeAssets: assets.filter((asset) => asset.status === 'active').length,
      totalLayouts: layouts.length,
      publishedLayouts: layouts.filter((layout) => layout.status === 'published').length,
      totalComponentProfiles: serializedComponentProfiles.length,
      activeComponentProfiles: serializedComponentProfiles.filter((profile) => profile.status === 'active').length,
    },
  };
}

export async function createTheme(payload = {}, { actorId } = {}) {
  const name = coerceString(payload.name).slice(0, 120);
  if (!name) {
    throw new ValidationError('Theme name is required.');
  }
  const slug = slugify(payload.slug ?? name);
  if (!slug) {
    throw new ValidationError('Unable to derive a theme slug.');
  }
  const existing = await AppearanceTheme.findOne({ where: { slug } });
  if (existing) {
    throw new ConflictError('A theme with this slug already exists.');
  }

  const tokens = sanitizeTokens(payload.tokens);
  const accessibility = sanitizeAccessibility(payload.accessibility);
  const status = normalizeStatus(payload.status, APPEARANCE_THEME_STATUSES, 'draft');
  const markDefault = coerceBoolean(payload.isDefault, false);

  const theme = await sequelize.transaction(async (transaction) => {
    if (markDefault) {
      await AppearanceTheme.update({ isDefault: false }, { where: {}, transaction });
    }
    const created = await AppearanceTheme.create(
      {
        name,
        slug,
        description: coerceOptionalString(payload.description),
        status,
        tokens,
        accessibility,
        isDefault: markDefault,
        createdBy: actorId ?? null,
        updatedBy: actorId ?? null,
      },
      { transaction },
    );
    return created;
  });

  log.info({ themeId: theme.id, actorId }, 'Appearance theme created');
  return serializeTheme(theme);
}

export async function updateTheme(themeId, payload = {}, { actorId } = {}) {
  assert(themeId, 'themeId is required');
  const theme = await AppearanceTheme.findByPk(themeId);
  assertThemeExists(theme);

  const updates = {};
  if (payload.name != null) {
    const name = coerceString(payload.name).slice(0, 120);
    if (!name) {
      throw new ValidationError('Theme name cannot be empty.');
    }
    updates.name = name;
  }
  if (payload.description !== undefined) {
    updates.description = coerceOptionalString(payload.description) ?? null;
  }
  if (payload.slug != null) {
    const slug = slugify(payload.slug);
    if (!slug) {
      throw new ValidationError('Slug cannot be empty.');
    }
    const existing = await AppearanceTheme.findOne({
      where: {
        slug,
        id: { [Op.ne]: theme.id },
      },
    });
    if (existing) {
      throw new ConflictError('Another theme already uses that slug.');
    }
    updates.slug = slug;
  }
  if (payload.status != null) {
    updates.status = normalizeStatus(payload.status, APPEARANCE_THEME_STATUSES, theme.status);
  }
  if (payload.tokens != null) {
    updates.tokens = sanitizeTokens(payload.tokens);
  }
  if (payload.accessibility != null) {
    updates.accessibility = sanitizeAccessibility(payload.accessibility);
  }

  const shouldMarkDefault = payload.isDefault != null ? coerceBoolean(payload.isDefault, theme.isDefault) : theme.isDefault;

  const updatedTheme = await sequelize.transaction(async (transaction) => {
    if (shouldMarkDefault) {
      await AppearanceTheme.update({ isDefault: false }, { where: {}, transaction });
    }

    await theme.update(
      {
        ...updates,
        isDefault: shouldMarkDefault,
        updatedBy: actorId ?? null,
      },
      { transaction },
    );

    await theme.reload({ transaction });
    return theme;
  });

  log.info({ themeId: theme.id, actorId }, 'Appearance theme updated');
  return serializeTheme(updatedTheme);
}

export async function setDefaultTheme(themeId, { actorId } = {}) {
  assert(themeId, 'themeId is required');
  const theme = await AppearanceTheme.findByPk(themeId);
  assertThemeExists(theme);

  await sequelize.transaction(async (transaction) => {
    await AppearanceTheme.update({ isDefault: false }, { where: {}, transaction });
    await theme.update({ isDefault: true, status: 'active', updatedBy: actorId ?? null }, { transaction });
  });

  log.info({ themeId: theme.id, actorId }, 'Appearance theme set as default');
  await theme.reload();
  return serializeTheme(theme);
}

export async function deleteTheme(themeId) {
  assert(themeId, 'themeId is required');
  const theme = await AppearanceTheme.findByPk(themeId);
  assertThemeExists(theme);

  if (theme.isDefault) {
    throw new ConflictError('Default theme cannot be deleted. Assign a different default first.');
  }

  const publishedLayouts = await AppearanceLayout.count({ where: { themeId, status: 'published' } });
  if (publishedLayouts > 0) {
    throw new ConflictError('Cannot delete a theme that has published layouts. Archive or reassign them first.');
  }

  await theme.destroy();
  log.info({ themeId }, 'Appearance theme deleted');
  return { success: true };
}

export async function createAsset(payload = {}, { actorId } = {}) {
  const label = coerceString(payload.label).slice(0, 120);
  if (!label) {
    throw new ValidationError('Asset label is required.');
  }
  const url = coerceString(payload.url);
  if (!url) {
    throw new ValidationError('Asset URL is required.');
  }
  const type = normalizeStatus(payload.type, APPEARANCE_ASSET_TYPES, 'other');
  const status = normalizeStatus(payload.status, APPEARANCE_ASSET_STATUSES, 'active');

  if (payload.themeId) {
    await ensureThemeById(payload.themeId);
  }

  const asset = await AppearanceAsset.create({
    themeId: payload.themeId ?? null,
    type,
    label,
    description: coerceOptionalString(payload.description) ?? null,
    url,
    altText: coerceOptionalString(payload.altText) ?? null,
    metadata: sanitizeMetadata(payload.metadata),
    allowedRoles: normalizeAllowedRoles(payload.allowedRoles),
    status,
    isPrimary: coerceBoolean(payload.isPrimary, false),
    sortOrder: coerceNumber(payload.sortOrder, 0, { min: 0, max: 999, integer: true }),
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null,
  });

  log.info({ assetId: asset.id, actorId }, 'Appearance asset created');
  return serializeAsset(asset);
}

export async function updateAsset(assetId, payload = {}, { actorId } = {}) {
  assert(assetId, 'assetId is required');
  const asset = await AppearanceAsset.findByPk(assetId);
  if (!asset) {
    throw new NotFoundError('Asset not found.');
  }

  const updates = {};
  if (payload.label != null) {
    const label = coerceString(payload.label).slice(0, 120);
    if (!label) {
      throw new ValidationError('Asset label cannot be empty.');
    }
    updates.label = label;
  }
  if (payload.description !== undefined) {
    updates.description = coerceOptionalString(payload.description) ?? null;
  }
  if (payload.url != null) {
    const url = coerceString(payload.url);
    if (!url) {
      throw new ValidationError('Asset URL cannot be empty.');
    }
    updates.url = url;
  }
  if (payload.altText !== undefined) {
    updates.altText = coerceOptionalString(payload.altText) ?? null;
  }
  if (payload.type != null) {
    updates.type = normalizeStatus(payload.type, APPEARANCE_ASSET_TYPES, asset.type);
  }
  if (payload.status != null) {
    updates.status = normalizeStatus(payload.status, APPEARANCE_ASSET_STATUSES, asset.status);
  }
  if (payload.sortOrder != null) {
    updates.sortOrder = coerceNumber(payload.sortOrder, asset.sortOrder, { min: 0, max: 999, integer: true });
  }
  if (payload.metadata != null) {
    updates.metadata = sanitizeMetadata(payload.metadata);
  }
  if (payload.allowedRoles != null) {
    updates.allowedRoles = normalizeAllowedRoles(payload.allowedRoles);
  }
  if (payload.isPrimary != null) {
    updates.isPrimary = coerceBoolean(payload.isPrimary, asset.isPrimary);
  }
  if (payload.themeId !== undefined) {
    if (payload.themeId) {
      await ensureThemeById(payload.themeId);
    }
    updates.themeId = payload.themeId ?? null;
  }

  await asset.update({ ...updates, updatedBy: actorId ?? null });
  log.info({ assetId: asset.id, actorId }, 'Appearance asset updated');
  return serializeAsset(asset);
}

export async function deleteAsset(assetId) {
  assert(assetId, 'assetId is required');
  const asset = await AppearanceAsset.findByPk(assetId);
  if (!asset) {
    throw new NotFoundError('Asset not found.');
  }
  await asset.destroy();
  log.info({ assetId }, 'Appearance asset deleted');
  return { success: true };
}

export async function createLayout(payload = {}, { actorId } = {}) {
  const name = coerceString(payload.name).slice(0, 160);
  if (!name) {
    throw new ValidationError('Layout name is required.');
  }
  const slug = slugify(payload.slug ?? name);
  if (!slug) {
    throw new ValidationError('Unable to derive a layout slug.');
  }
  const page = normalizeStatus(payload.page, APPEARANCE_LAYOUT_PAGES, 'marketing');
  const status = normalizeStatus(payload.status, APPEARANCE_LAYOUT_STATUSES, 'draft');
  const config = sanitizeLayoutConfig(payload.config);

  if (payload.themeId) {
    await ensureThemeById(payload.themeId);
  }

  const existing = await AppearanceLayout.findOne({ where: { page, slug } });
  if (existing) {
    throw new ConflictError('A layout with this slug already exists for the selected page.');
  }

  const layout = await AppearanceLayout.create({
    themeId: payload.themeId ?? null,
    name,
    slug,
    page,
    status,
    version: 1,
    config,
    allowedRoles: normalizeAllowedRoles(payload.allowedRoles),
    metadata: sanitizeMetadata(payload.metadata),
    releaseNotes: coerceOptionalString(payload.releaseNotes) ?? null,
    publishedAt: status === 'published' ? new Date() : null,
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null,
  });

  log.info({ layoutId: layout.id, actorId }, 'Appearance layout created');
  return serializeLayout(layout);
}

export async function updateLayout(layoutId, payload = {}, { actorId } = {}) {
  assert(layoutId, 'layoutId is required');
  const layout = await AppearanceLayout.findByPk(layoutId);
  if (!layout) {
    throw new NotFoundError('Layout not found.');
  }

  const updates = {};
  if (payload.name != null) {
    const name = coerceString(payload.name).slice(0, 160);
    if (!name) {
      throw new ValidationError('Layout name cannot be empty.');
    }
    updates.name = name;
  }
  if (payload.slug != null) {
    const slug = slugify(payload.slug);
    if (!slug) {
      throw new ValidationError('Layout slug cannot be empty.');
    }
    const page = payload.page ? normalizeStatus(payload.page, APPEARANCE_LAYOUT_PAGES, layout.page) : layout.page;
    const existing = await AppearanceLayout.findOne({
      where: {
        page,
        slug,
        id: { [Op.ne]: layout.id },
      },
    });
    if (existing) {
      throw new ConflictError('Another layout already uses that slug for the selected page.');
    }
    updates.slug = slug;
  }
  if (payload.page != null) {
    updates.page = normalizeStatus(payload.page, APPEARANCE_LAYOUT_PAGES, layout.page);
  }
  if (payload.status != null) {
    updates.status = normalizeStatus(payload.status, APPEARANCE_LAYOUT_STATUSES, layout.status);
  }
  if (payload.config != null) {
    updates.config = sanitizeLayoutConfig(payload.config);
  }
  if (payload.allowedRoles != null) {
    updates.allowedRoles = normalizeAllowedRoles(payload.allowedRoles);
  }
  if (payload.metadata != null) {
    updates.metadata = sanitizeMetadata(payload.metadata);
  }
  if (payload.releaseNotes !== undefined) {
    updates.releaseNotes = coerceOptionalString(payload.releaseNotes) ?? null;
  }
  if (payload.themeId !== undefined) {
    if (payload.themeId) {
      await ensureThemeById(payload.themeId);
    }
    updates.themeId = payload.themeId ?? null;
  }

  const newStatus = updates.status ?? layout.status;
  if (newStatus === 'published' && layout.status !== 'published') {
    updates.version = (layout.version ?? 1) + 1;
    updates.publishedAt = new Date();
  } else if (newStatus !== 'published') {
    updates.publishedAt = null;
  }

  await layout.update({ ...updates, updatedBy: actorId ?? null });
  log.info({ layoutId: layout.id, actorId }, 'Appearance layout updated');
  return serializeLayout(layout);
}

export async function publishLayout(layoutId, payload = {}, { actorId } = {}) {
  assert(layoutId, 'layoutId is required');
  const layout = await AppearanceLayout.findByPk(layoutId);
  if (!layout) {
    throw new NotFoundError('Layout not found.');
  }

  const releaseNotes = payload.releaseNotes != null ? coerceString(payload.releaseNotes).slice(0, 2000) : layout.releaseNotes;

  await layout.update({
    status: 'published',
    version: (layout.version ?? 1) + 1,
    publishedAt: new Date(),
    releaseNotes,
    updatedBy: actorId ?? null,
  });

  log.info({ layoutId: layout.id, actorId }, 'Appearance layout published');
  return serializeLayout(layout);
}

export async function deleteLayout(layoutId) {
  assert(layoutId, 'layoutId is required');
  const layout = await AppearanceLayout.findByPk(layoutId);
  if (!layout) {
    throw new NotFoundError('Layout not found.');
  }
  if (layout.status === 'published') {
    throw new ConflictError('Published layouts cannot be deleted. Update the layout status to archived instead.');
  }
  await layout.destroy();
  log.info({ layoutId }, 'Appearance layout deleted');
  return { success: true };
}

export async function listComponentProfiles({ themeId, status } = {}) {
  const where = {};
  if (themeId) {
    where.themeId = themeId;
  }
  if (status) {
    const normalizedStatus = normalizeStatus(status, APPEARANCE_COMPONENT_PROFILE_STATUSES, null);
    if (!normalizedStatus) {
      throw new ValidationError(
        `status must be one of: ${APPEARANCE_COMPONENT_PROFILE_STATUSES.join(', ')}`,
      );
    }
    where.status = normalizedStatus;
  }

  const profiles = await AppearanceComponentProfile.findAll({
    where,
    order: [
      ['componentKey', 'ASC'],
      ['createdAt', 'DESC'],
    ],
  });

  return profiles
    .map((profile) => serializeComponentProfile(profile))
    .filter(Boolean);
}

export async function createComponentProfile(payload = {}, { actorId } = {}) {
  const componentKey = normalizeComponentKey(payload.componentKey);
  if (!componentKey) {
    throw new ValidationError(`componentKey must be one of: ${COMPONENT_KEYS.join(', ')}`);
  }

  let themeId = null;
  if (payload.themeId) {
    const theme = await ensureThemeById(payload.themeId);
    themeId = theme.id;
  }

  const status = normalizeStatus(payload.status, APPEARANCE_COMPONENT_PROFILE_STATUSES, 'active');
  const definition = sanitizeComponentDefinition(componentKey, payload.definition);
  const metadata = sanitizeComponentMetadata(payload.metadata);

  const profile = await sequelize.transaction(async (transaction) => {
    const existing = await AppearanceComponentProfile.findOne({
      where: { themeId, componentKey },
      transaction,
    });
    if (existing) {
      throw new ConflictError('A component profile already exists for this theme.');
    }

    const created = await AppearanceComponentProfile.create(
      {
        themeId,
        componentKey,
        status,
        definition,
        metadata,
        createdBy: actorId ?? null,
        updatedBy: actorId ?? null,
      },
      { transaction },
    );

    return created;
  });

  return serializeComponentProfile(profile);
}

export async function updateComponentProfile(componentProfileId, payload = {}, { actorId } = {}) {
  const profile = await ensureComponentProfileById(componentProfileId);

  return sequelize.transaction(async (transaction) => {
    let nextThemeId = profile.themeId;
    if (payload.themeId !== undefined) {
      if (!payload.themeId) {
        nextThemeId = null;
      } else {
        const theme = await ensureThemeById(payload.themeId, { transaction });
        nextThemeId = theme.id;
      }
    }

    let nextComponentKey = profile.componentKey;
    if (payload.componentKey !== undefined) {
      const normalizedKey = normalizeComponentKey(payload.componentKey);
      if (!normalizedKey) {
        throw new ValidationError(`componentKey must be one of: ${COMPONENT_KEYS.join(', ')}`);
      }
      nextComponentKey = normalizedKey;
    }

    const updates = {};

    if (payload.status !== undefined) {
      updates.status = normalizeStatus(
        payload.status,
        APPEARANCE_COMPONENT_PROFILE_STATUSES,
        profile.status,
      );
    }

    if (payload.definition !== undefined) {
      updates.definition = sanitizeComponentDefinition(nextComponentKey, payload.definition);
    }

    if (payload.metadata !== undefined) {
      updates.metadata = sanitizeComponentMetadata(payload.metadata);
    }

    updates.componentKey = nextComponentKey;
    updates.themeId = nextThemeId;
    updates.updatedBy = actorId ?? profile.updatedBy ?? null;

    const duplicate = await AppearanceComponentProfile.findOne({
      where: {
        id: { [Op.ne]: profile.id },
        themeId: nextThemeId,
        componentKey: nextComponentKey,
      },
      transaction,
    });

    if (duplicate) {
      throw new ConflictError('A component profile already exists for this theme.');
    }

    await profile.update(updates, { transaction });

    return serializeComponentProfile(profile);
  });
}

export async function deleteComponentProfile(componentProfileId) {
  const profile = await ensureComponentProfileById(componentProfileId);
  await profile.destroy();
  return { id: componentProfileId, deleted: true };
}

export default {
  getAppearanceSummary,
  createTheme,
  updateTheme,
  setDefaultTheme,
  deleteTheme,
  createAsset,
  updateAsset,
  deleteAsset,
  createLayout,
  updateLayout,
  publishLayout,
  deleteLayout,
  listComponentProfiles,
  createComponentProfile,
  updateComponentProfile,
  deleteComponentProfile,
};
