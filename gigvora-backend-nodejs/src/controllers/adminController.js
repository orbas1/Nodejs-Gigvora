import {
  getAdminDashboardSnapshot,
  updateAdminOverview,
} from '../services/adminDashboardService.js';
import { getAffiliateSettings, updateAffiliateSettings } from '../services/affiliateSettingsService.js';
import { getGdprSettings, updateGdprSettings } from '../services/gdprSettingsService.js';
import {
  listPageSettings,
  createPageSetting,
  updatePageSetting,
  deletePageSetting,
} from '../services/pageSettingsService.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
  getHomepageSettings,
  updateHomepageSettings,
  listPlatformSettingsAuditEvents,
} from '../services/platformSettingsService.js';
import {
  listPlatformSettingsWatchers,
  createPlatformSettingsWatcher,
  updatePlatformSettingsWatcher,
  deletePlatformSettingsWatcher,
} from '../services/platformSettingsWatchersService.js';
import { getRuntimeOperationalSnapshot } from '../services/runtimeObservabilityService.js';
import { getSeoSettings, updateSeoSettings } from '../services/seoSettingsService.js';
import { getSystemSettings, updateSystemSettings } from '../services/systemSettingsService.js';
import {
  sanitizeAdminDashboardFilters,
  sanitizePlatformSettingsAuditFilters,
  sanitizePlatformSettingsInput,
  sanitizeHomepageSettingsInput,
  sanitizeAffiliateSettingsInput,
} from '../utils/adminSanitizers.js';

function resolveActorId(user) {
  if (!user) {
    return undefined;
  }
  const candidate =
    typeof user.id === 'number'
      ? user.id
      : typeof user.id === 'string'
      ? Number.parseInt(user.id, 10)
      : typeof user.userId === 'number'
      ? user.userId
      : typeof user.userId === 'string'
      ? Number.parseInt(user.userId, 10)
      : undefined;
  return Number.isFinite(candidate) ? candidate : undefined;
}

function resolveActorMetadata(user) {
  const actorId = resolveActorId(user);
  const email = typeof user?.email === 'string' && user.email.trim().length ? user.email.trim() : null;
  const nameFromUser =
    typeof user?.name === 'string' && user.name.trim().length
      ? user.name.trim()
      : [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const actorName = nameFromUser && nameFromUser.length ? nameFromUser : null;

  return {
    actorId: actorId ?? null,
    actorEmail: email,
    actorName,
  };
}

export async function dashboard(req, res) {
  const filters = sanitizeAdminDashboardFilters(req.query ?? {});
  const adminUserId = resolveActorId(req.user);
  const snapshot = await getAdminDashboardSnapshot({
    ...filters,
    ...(adminUserId !== undefined ? { adminUserId } : {}),
  });
  res.json(snapshot);
}

export async function fetchPlatformSettings(req, res) {
  const settings = await getPlatformSettings();
  res.json(settings);
}

export async function persistPlatformSettings(req, res) {
  const payload = sanitizePlatformSettingsInput(req.body ?? {});
  const actor = resolveActorMetadata(req.user);
  const settings = await updatePlatformSettings(payload, actor);
  res.json(settings);
}

export async function listPlatformSettingsAuditTrail(req, res) {
  const filters = sanitizePlatformSettingsAuditFilters(req.query ?? {});
  const events = await listPlatformSettingsAuditEvents(filters);
  res.json(events);
}

export async function listPlatformSettingsWatchersController(req, res) {
  const includeDisabled = Boolean(req.query?.includeDisabled);
  const watchers = await listPlatformSettingsWatchers({ includeDisabled });
  res.json({ watchers });
}

export async function createPlatformSettingsWatcherController(req, res) {
  const actor = resolveActorMetadata(req.user);
  const watcher = await createPlatformSettingsWatcher(req.body ?? {}, { actor });
  res.status(201).json(watcher);
}

export async function updatePlatformSettingsWatcherController(req, res) {
  const actor = resolveActorMetadata(req.user);
  const watcher = await updatePlatformSettingsWatcher(req.params.watcherId, req.body ?? {}, { actor });
  res.json(watcher);
}

export async function removePlatformSettingsWatcher(req, res) {
  await deletePlatformSettingsWatcher(req.params.watcherId, { actor: resolveActorMetadata(req.user) });
  res.status(204).send();
}

export async function fetchHomepageSettings(req, res) {
  const settings = await getHomepageSettings();
  res.json(settings);
}

export async function persistHomepageSettings(req, res) {
  const payload = sanitizeHomepageSettingsInput(req.body ?? {});
  const settings = await updateHomepageSettings(payload);
  res.json(settings);
}

export async function fetchAffiliateSettings(req, res) {
  const settings = await getAffiliateSettings();
  res.json(settings);
}

export async function persistAffiliateSettings(req, res) {
  const payload = sanitizeAffiliateSettingsInput(req.body ?? {});
  const settings = await updateAffiliateSettings(payload);
  res.json(settings);
}

export async function fetchPageSettings(req, res) {
  const { limit, offset } = req.query ?? {};
  const result = await listPageSettings({ limit, offset });
  res.json(result);
}

export async function createAdminPageSetting(req, res) {
  const actorId = resolveActorId(req.user);
  const record = await createPageSetting(req.body ?? {}, { actorId });
  res.status(201).json(record);
}

export async function persistPageSetting(req, res) {
  const actorId = resolveActorId(req.user);
  const record = await updatePageSetting(req.params.pageId, req.body ?? {}, { actorId });
  res.json(record);
}

export async function removePageSetting(req, res) {
  await deletePageSetting(req.params.pageId);
  res.status(204).send();
}

export async function fetchGdprSettings(req, res) {
  const settings = await getGdprSettings();
  res.json(settings);
}

export async function persistGdprSettings(req, res) {
  const settings = await updateGdprSettings(req.body ?? {});
  res.json(settings);
}

export async function fetchSeoSettings(req, res) {
  const settings = await getSeoSettings();
  res.json(settings);
}

export async function persistSeoSettings(req, res) {
  const settings = await updateSeoSettings(req.body ?? {});
  res.json(settings);
}

export async function fetchSystemSettings(req, res) {
  const settings = await getSystemSettings();
  res.json(settings);
}

export async function persistSystemSettings(req, res) {
  const settings = await updateSystemSettings(req.body ?? {});
  res.json(settings);
}

export async function runtimeHealth(req, res) {
  const snapshot = await getRuntimeOperationalSnapshot();
  res.json(snapshot);
}

export async function persistAdminOverview(req, res) {
  const adminId = resolveActorId(req.user) ?? null;
  const overview = await updateAdminOverview(adminId, req.body ?? {});
  res.json(overview);
}

