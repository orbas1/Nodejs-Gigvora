import { createHash } from 'node:crypto';
import baseAppearanceModels from '../models/appearanceModels.js';
import { DesignSystemRelease } from '../models/designSystemModels.js';
import logger from '../utils/logger.js';
import {
  DESIGN_SYSTEM_VERSION,
  createDesignSystemSnapshot,
  resolveDesignRuntime,
} from '../../../shared-contracts/domain/platform/design-system.js';
import { COMPONENT_TOKEN_VERSION } from '../../../shared-contracts/domain/platform/component-tokens.js';
import { freezeDeep } from '../../../shared-contracts/domain/utils/freezeDeep.js';

let appearanceModels = baseAppearanceModels;
let releaseModel = DesignSystemRelease;
let currentLogger = logger.child({ component: 'designSystemService' });
let baseConfiguration = {};
let cachedRelease = null;
let cachedThemeHash = null;

function sanitisePreferences(preferences = {}) {
  const candidate = preferences && typeof preferences === 'object' ? preferences : {};
  const normalised = (value, fallback) =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
  return {
    mode: normalised(candidate.mode ?? baseConfiguration.mode, 'light'),
    accent: normalised(candidate.accent ?? baseConfiguration.accent, 'azure'),
    density: normalised(candidate.density ?? baseConfiguration.density, 'comfortable'),
  };
}

function toPlain(record) {
  if (!record) {
    return null;
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (typeof record.toJSON === 'function') {
    return record.toJSON();
  }
  return record;
}

function sanitiseAssets(assets = []) {
  if (!Array.isArray(assets)) {
    return [];
  }
  return assets
    .map((asset) => ({
      id: asset.id ?? null,
      type: asset.type ?? null,
      label: asset.label ?? '',
      url: asset.url ?? '',
      altText: asset.altText ?? asset.alt_text ?? '',
      isPrimary: asset.isPrimary === true || asset.is_primary === true,
      sortOrder: Number.isFinite(asset.sortOrder) ? asset.sortOrder : Number(asset.sort_order ?? 0) || 0,
      metadata: asset.metadata ?? {},
      createdAt: asset.createdAt ?? asset.created_at ?? null,
      updatedAt: asset.updatedAt ?? asset.updated_at ?? null,
    }))
    .filter((asset) => asset.url);
}

function sanitiseComponentProfiles(profiles = []) {
  if (!Array.isArray(profiles)) {
    return [];
  }
  return profiles
    .map((profile) => ({
      key: profile.componentKey ?? profile.key ?? null,
      definition: profile.definition ?? {},
      metadata: profile.metadata ?? {},
      updatedAt: profile.updatedAt ?? profile.updated_at ?? null,
    }))
    .filter((profile) => typeof profile.key === 'string' && profile.key.length > 0);
}

function buildComponentData(componentProfiles = []) {
  const registry = {};
  let resolvedVersion = COMPONENT_TOKEN_VERSION;
  let latestUpdatedAt = null;

  sanitiseComponentProfiles(componentProfiles).forEach((profile) => {
    registry[profile.key] = profile.definition ?? {};
    const profileVersion = profile.metadata?.version;
    if (profileVersion && typeof profileVersion === 'string') {
      resolvedVersion = profileVersion;
    }
    if (profile.updatedAt) {
      const timestamp = new Date(profile.updatedAt).getTime();
      if (Number.isFinite(timestamp) && (latestUpdatedAt == null || timestamp > latestUpdatedAt)) {
        latestUpdatedAt = timestamp;
      }
    }
  });

  return {
    registry,
    version: resolvedVersion,
    updatedAt: latestUpdatedAt ? new Date(latestUpdatedAt).toISOString() : null,
    count: Object.keys(registry).length,
  };
}

function buildThemeMetadata(themeBundle) {
  if (!themeBundle) {
    return null;
  }
  return {
    id: themeBundle.id ?? null,
    slug: themeBundle.slug ?? null,
    name: themeBundle.name ?? '',
    status: themeBundle.status ?? 'draft',
    accessibility: themeBundle.accessibility ?? {},
    tokens: themeBundle.tokens ?? {},
    assets: sanitiseAssets(themeBundle.assets),
    updatedAt: themeBundle.updatedAt ? new Date(themeBundle.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function computeThemeHash(themeMetadata, componentData) {
  const payload = {
    tokens: themeMetadata?.tokens ?? {},
    accessibility: themeMetadata?.accessibility ?? {},
    assets: (themeMetadata?.assets ?? []).map((asset) => ({
      type: asset.type,
      url: asset.url,
      sortOrder: asset.sortOrder,
      updatedAt: asset.updatedAt,
    })),
    componentRegistry: componentData.registry,
    componentTokenVersion: componentData.version,
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function applyThemeTokens(snapshot, themeMetadata) {
  if (!snapshot || !themeMetadata) {
    return freezeDeep({ ...(snapshot ?? createDesignSystemSnapshot()) });
  }

  const runtime = snapshot.tokens?.runtime ?? {};
  const colors = themeMetadata.tokens?.colors ?? {};
  const updatedRuntime = {
    ...runtime,
    colors: {
      ...runtime.colors,
      background: colors.background ?? runtime.colors?.background,
      surface: colors.surface ?? runtime.colors?.surface,
      surfaceMuted: colors.surfaceMuted ?? runtime.colors?.surfaceMuted,
      border: colors.border ?? runtime.colors?.border,
      borderStrong: colors.borderStrong ?? runtime.colors?.borderStrong,
      text: colors.textPrimary ?? runtime.colors?.text,
      textMuted: colors.textSecondary ?? runtime.colors?.textMuted,
      accent: colors.accent ?? colors.primary ?? runtime.colors?.accent,
      accentStrong: colors.accentStrong ?? runtime.colors?.accentStrong ?? colors.primary,
      accentSoft: colors.accentSoft ?? runtime.colors?.accentSoft,
      primary: colors.primary ?? runtime.colors?.primary,
      primarySoft: colors.primarySoft ?? runtime.colors?.primarySoft,
    },
  };

  return freezeDeep({
    ...snapshot,
    tokens: {
      ...snapshot.tokens,
      runtime: updatedRuntime,
    },
    metadata: {
      ...snapshot.metadata,
      theme: themeMetadata,
    },
  });
}

async function loadDefaultTheme({ slug } = {}) {
  const models = appearanceModels ?? baseAppearanceModels;
  const { AppearanceTheme, AppearanceAsset, AppearanceComponentProfile } = models;
  if (!AppearanceTheme) {
    return null;
  }

  try {
    const theme = await AppearanceTheme.findOne({
      where: slug ? { slug } : { isDefault: true },
      include: [
        {
          model: AppearanceAsset,
          as: 'assets',
          required: false,
          where: { status: 'active' },
          separate: true,
          order: [
            ['sortOrder', 'ASC'],
            ['createdAt', 'ASC'],
          ],
        },
        {
          model: AppearanceComponentProfile,
          as: 'componentProfiles',
          required: false,
          where: { status: 'active' },
          separate: true,
          order: [['componentKey', 'ASC']],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    if (!theme) {
      return null;
    }

    const payload = theme.toPublicObject({ includeRelations: true });
    return {
      id: payload.id,
      slug: payload.slug,
      name: payload.name,
      status: payload.status,
      tokens: payload.tokens ?? {},
      accessibility: payload.accessibility ?? {},
      assets: payload.assets ?? [],
      componentProfiles: payload.componentProfiles ?? [],
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
    };
  } catch (error) {
    currentLogger.error({ error }, 'Failed to load default appearance theme for design system');
    return null;
  }
}

function buildReleasePayload(themeBundle, { preferences } = {}) {
  const resolvedPreferences = sanitisePreferences(preferences);
  const themeMetadata = buildThemeMetadata(themeBundle);
  const componentData = buildComponentData(themeBundle?.componentProfiles);

  const analytics = {
    themeAssetCount: themeMetadata?.assets?.length ?? 0,
    componentProfileCount: componentData.count,
    themeUpdatedAt: themeMetadata?.updatedAt ?? null,
    componentRegistryUpdatedAt: componentData.updatedAt,
  };

  const metadata = {
    theme: themeMetadata,
    componentRegistry: componentData.registry,
    componentTokenVersion: componentData.version,
    release: {
      generatedBy: baseConfiguration.releasedBy ?? 'design-system-service',
      generatedAt: new Date().toISOString(),
      themeUpdatedAt: themeMetadata?.updatedAt ?? null,
      componentRegistryUpdatedAt: componentData.updatedAt,
    },
  };

  const baseSnapshot = createDesignSystemSnapshot({
    ...resolvedPreferences,
    componentTokens: componentData.registry,
    componentTokenVersion: componentData.version,
    metadata,
    analytics,
  });

  const themedSnapshot = applyThemeTokens(baseSnapshot, metadata.theme);
  const serialisedSnapshot = JSON.parse(JSON.stringify(themedSnapshot));
  const checksum = createHash('sha256').update(JSON.stringify(serialisedSnapshot)).digest('hex');
  const now = new Date();

  const record = {
    themeId: themeBundle?.id ?? null,
    version: serialisedSnapshot.version ?? DESIGN_SYSTEM_VERSION,
    preferences: resolvedPreferences,
    snapshot: serialisedSnapshot,
    analytics: serialisedSnapshot.metadata?.analytics ?? analytics,
    metadata: serialisedSnapshot.metadata ?? metadata,
    releasedBy: baseConfiguration.releasedBy ?? 'design-system-service',
    releasedAt: now,
    releaseNotes: baseConfiguration.releaseNotes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  return { record, snapshot: serialisedSnapshot, checksum, preferences: resolvedPreferences };
}

async function ensureRelease(themeBundle) {
  if (!themeBundle) {
    return { release: null, themeHash: null };
  }

  const themeMetadata = buildThemeMetadata(themeBundle);
  const componentData = buildComponentData(themeBundle.componentProfiles);
  const themeHash = computeThemeHash(themeMetadata, componentData);

  if (cachedRelease && cachedThemeHash === themeHash) {
    return { release: cachedRelease, themeHash };
  }

  let latestRecord = null;
  try {
    latestRecord = await releaseModel.findOne({
      where: { themeId: themeBundle.id },
      order: [['releasedAt', 'DESC']],
    });
  } catch (error) {
    currentLogger.warn({ error }, 'Failed to query design system release history');
  }

  let releasePlain = toPlain(latestRecord);
  if (releasePlain && releasePlain.themeHash === themeHash) {
    cachedRelease = releasePlain;
    cachedThemeHash = themeHash;
    return { release: releasePlain, themeHash };
  }

  const releasePayload = buildReleasePayload(themeBundle, {});
  const insertPayload = {
    ...releasePayload.record,
    themeHash,
    checksum: releasePayload.checksum,
  };

  try {
    const created = await releaseModel.create(insertPayload);
    releasePlain = toPlain(created) ?? insertPayload;
  } catch (error) {
    currentLogger.warn({ error }, 'Failed to persist design system release, serving calculated snapshot');
    releasePlain = insertPayload;
  }

  cachedRelease = { ...releasePlain, snapshot: insertPayload.snapshot };
  cachedThemeHash = themeHash;
  return { release: cachedRelease, themeHash };
}

function cloneSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }
  return JSON.parse(JSON.stringify(snapshot));
}

function preferencesMatch(left = {}, right = {}) {
  return left.mode === right.mode && left.accent === right.accent && left.density === right.density;
}

function buildSnapshotFromRelease(release, preferences) {
  const metadata = release.metadata ?? {};
  const componentTokens = metadata.componentRegistry ?? release.snapshot?.componentTokens?.registry ?? {};
  const componentTokenVersion =
    metadata.componentTokenVersion ?? release.snapshot?.componentTokens?.version ?? COMPONENT_TOKEN_VERSION;
  const analytics = release.analytics ?? release.snapshot?.metadata?.analytics ?? {};

  const baseSnapshot = createDesignSystemSnapshot({
    ...preferences,
    componentTokens,
    componentTokenVersion,
    metadata,
    analytics,
  });

  const themedSnapshot = applyThemeTokens(baseSnapshot, metadata.theme);
  return cloneSnapshot(themedSnapshot);
}

export async function getDesignSystemSnapshot(options = {}) {
  const overrides = options && typeof options === 'object' ? options : {};
  const requestedPreferences = sanitisePreferences(overrides);

  try {
    const themeBundle = await loadDefaultTheme({ slug: baseConfiguration.themeSlug });
    if (!themeBundle) {
      return freezeDeep(createDesignSystemSnapshot({ ...requestedPreferences }));
    }

    const { release } = await ensureRelease(themeBundle);
    if (!release) {
      const releasePayload = buildReleasePayload(themeBundle, { preferences: requestedPreferences });
      return freezeDeep(releasePayload.snapshot);
    }

    const releaseSnapshot = release.snapshot ?? release.record?.snapshot ?? null;
    if (releaseSnapshot && preferencesMatch(release.preferences ?? {}, requestedPreferences)) {
      return freezeDeep(cloneSnapshot(releaseSnapshot));
    }

    const rebuilt = buildSnapshotFromRelease(release, requestedPreferences);
    if (rebuilt) {
      return freezeDeep(rebuilt);
    }

    return freezeDeep(createDesignSystemSnapshot({ ...requestedPreferences }));
  } catch (error) {
    currentLogger.error({ error }, 'Failed to produce design system snapshot, falling back to defaults');
    return freezeDeep(createDesignSystemSnapshot({ ...requestedPreferences }));
  }
}

export async function getRuntimeDesignTokens(preferences = {}) {
  const snapshot = await getDesignSystemSnapshot(preferences);
  return resolveDesignRuntime({ snapshot, ...preferences });
}

export async function getDesignSystemMetadata() {
  const snapshot = await getDesignSystemSnapshot();
  return {
    version: snapshot.version ?? DESIGN_SYSTEM_VERSION,
    generatedAt: snapshot.generatedAt,
    analytics: snapshot.metadata?.analytics ?? null,
    componentTokenVersion: snapshot.componentTokens?.version ?? null,
  };
}

export function configureDesignSystem(options = {}) {
  if (!options || typeof options !== 'object') {
    return;
  }
  baseConfiguration = { ...baseConfiguration, ...options };
}

export function resetDesignSystem() {
  baseConfiguration = {};
  cachedRelease = null;
  cachedThemeHash = null;
}

export function __setDependencies({ appearanceModels: nextAppearance, releaseModel: nextRelease, logger: nextLogger } = {}) {
  if (nextAppearance) {
    appearanceModels = nextAppearance;
  }
  if (nextRelease) {
    releaseModel = nextRelease;
  }
  if (nextLogger) {
    currentLogger = typeof nextLogger.child === 'function' ? nextLogger.child({ component: 'designSystemService' }) : nextLogger;
  }
}

export function __resetDependencies() {
  appearanceModels = baseAppearanceModels;
  releaseModel = DesignSystemRelease;
  currentLogger = logger.child({ component: 'designSystemService' });
  resetDesignSystem();
}

export default {
  configureDesignSystem,
  resetDesignSystem,
  getDesignSystemSnapshot,
  getRuntimeDesignTokens,
  getDesignSystemMetadata,
  __setDependencies,
  __resetDependencies,
};
