import { Op } from 'sequelize';
import PlatformSettingsWatcher, {
  PLATFORM_SETTINGS_WATCHER_CHANNELS,
  PLATFORM_SETTINGS_WATCHER_DIGEST_FREQUENCIES,
} from '../models/platformSettingsWatcher.js';
import sequelize from '../models/sequelizeClient.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const ACTIVE_CACHE_TTL_MS = 30_000;

let activeWatcherCache = { expiresAt: 0, value: null };

function getUserModel() {
  const model = sequelize.models?.User;
  if (!model) {
    throw new Error('User model is not initialised – ensure user models are registered before using platform settings watchers.');
  }
  return model;
}

function normalizeEmail(value) {
  if (!value) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed.toLowerCase() : null;
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return JSON.parse(JSON.stringify(metadata));
}

function normalizeDigestFrequency(value, fallback = 'immediate') {
  const candidate = typeof value === 'string' ? value.trim().toLowerCase() : fallback;
  if (!PLATFORM_SETTINGS_WATCHER_DIGEST_FREQUENCIES.includes(candidate)) {
    throw new ValidationError(
      `Unsupported digest frequency "${value}". Expected one of: ${PLATFORM_SETTINGS_WATCHER_DIGEST_FREQUENCIES.join(', ')}.`,
    );
  }
  return candidate;
}

function normalizeDeliveryChannel(value, fallback = 'notification') {
  const candidate = typeof value === 'string' ? value.trim().toLowerCase() : fallback;
  if (!PLATFORM_SETTINGS_WATCHER_CHANNELS.includes(candidate)) {
    throw new ValidationError(
      `Unsupported delivery channel "${value}". Expected one of: ${PLATFORM_SETTINGS_WATCHER_CHANNELS.join(', ')}.`,
    );
  }
  return candidate;
}

function sanitizeWatcher(record) {
  if (!record) {
    return null;
  }
  const plain = record.get?.({ plain: true }) ?? record;
  return {
    id: plain.id,
    userId: plain.userId ?? null,
    email: normalizeEmail(plain.email),
    deliveryChannel: plain.deliveryChannel,
    digestFrequency: plain.digestFrequency,
    role: plain.role ?? null,
    description: plain.description ?? null,
    metadata: normalizeMetadata(plain.metadata),
    enabled: Boolean(plain.enabled),
    lastDigestAt: plain.lastDigestAt ? new Date(plain.lastDigestAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function invalidateActiveWatcherCache() {
  activeWatcherCache = { expiresAt: 0, value: null };
}

export function __dangerouslyResetPlatformSettingsWatcherCache() {
  invalidateActiveWatcherCache();
}

async function ensureUserExists(userId, transaction) {
  if (!userId) {
    return null;
  }
  const User = getUserModel();
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw new ValidationError(`User ${userId} does not exist.`);
  }
  return user;
}

async function assertUniqueWatcher({ userId, email }, { ignoreId, transaction } = {}) {
  const where = [];
  if (userId) {
    where.push({ userId });
  }
  if (email) {
    where.push({ email });
  }
  if (!where.length) {
    return;
  }
  const existing = await PlatformSettingsWatcher.findOne({
    where: { [Op.or]: where, ...(ignoreId ? { id: { [Op.ne]: ignoreId } } : {}) },
    transaction,
  });
  if (existing) {
    throw new ValidationError('A watcher already exists for the provided user or email.');
  }
}

function requireDeliveryPrerequisites({ deliveryChannel, userId, email }) {
  if (deliveryChannel === 'notification' && !userId) {
    throw new ValidationError('A userId is required for notification delivery.');
  }
  if (deliveryChannel === 'email' && !email) {
    throw new ValidationError('An email address is required for email delivery.');
  }
}

function computeCacheShouldRefresh(forceRefresh) {
  if (forceRefresh) {
    return true;
  }
  if (!activeWatcherCache.value) {
    return true;
  }
  return Date.now() >= activeWatcherCache.expiresAt;
}

export async function listPlatformSettingsWatchers({ includeDisabled = false } = {}) {
  const where = includeDisabled ? {} : { enabled: true };
  const records = await PlatformSettingsWatcher.findAll({ where, order: [['id', 'ASC']] });
  return records.map((record) => sanitizeWatcher(record));
}

export async function listActivePlatformSettingsWatchers({ forceRefresh = false, transaction } = {}) {
  if (!computeCacheShouldRefresh(forceRefresh)) {
    return activeWatcherCache.value;
  }
  const records = await PlatformSettingsWatcher.findAll({
    where: { enabled: true },
    order: [['id', 'ASC']],
    transaction,
  });
  const watchers = records.map((record) => sanitizeWatcher(record));
  activeWatcherCache = { value: watchers, expiresAt: Date.now() + ACTIVE_CACHE_TTL_MS };
  return watchers;
}

export async function listActivePlatformSettingsWatcherIds(options = {}) {
  const watchers = await listActivePlatformSettingsWatchers(options);
  return watchers.filter((watcher) => watcher.deliveryChannel === 'notification' && watcher.userId).map((watcher) => watcher.userId);
}

export async function createPlatformSettingsWatcher(payload = {}, { actor } = {}) {
  const userId = payload.userId ? Number(payload.userId) : null;
  const email = normalizeEmail(payload.email);
  const deliveryChannel = normalizeDeliveryChannel(payload.deliveryChannel, 'notification');
  const digestFrequency = normalizeDigestFrequency(payload.digestFrequency, 'immediate');
  const role = typeof payload.role === 'string' ? payload.role.trim() || null : null;
  const description = typeof payload.description === 'string' ? payload.description.trim() || null : null;
  const metadata = normalizeMetadata(payload.metadata);
  const enabled = payload.enabled === false ? false : true;

  requireDeliveryPrerequisites({ deliveryChannel, userId, email });

  return sequelize.transaction(async (transaction) => {
    await ensureUserExists(userId, transaction);
    await assertUniqueWatcher({ userId, email }, { transaction });

    const record = await PlatformSettingsWatcher.create(
      {
        userId,
        email,
        deliveryChannel,
        digestFrequency,
        role,
        description,
        metadata,
        enabled,
        lastDigestAt: payload.lastDigestAt ? new Date(payload.lastDigestAt) : null,
      },
      { transaction },
    );

    if (actor?.email) {
      logger.info(
        {
          watcherId: record.id,
          actor: actor.email,
          deliveryChannel,
          digestFrequency,
        },
        'Platform settings watcher created',
      );
    }

    invalidateActiveWatcherCache();
    return sanitizeWatcher(record);
  });
}

export async function updatePlatformSettingsWatcher(id, payload = {}, { actor } = {}) {
  const watcherId = Number(id);
  if (!Number.isFinite(watcherId) || watcherId <= 0) {
    throw new ValidationError('A valid watcher id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const record = await PlatformSettingsWatcher.findByPk(watcherId, { transaction });
    if (!record) {
      throw new NotFoundError('Watcher not found.');
    }

    const nextUserId = payload.userId === undefined ? record.userId : payload.userId ? Number(payload.userId) : null;
    const nextEmail = payload.email === undefined ? record.email : normalizeEmail(payload.email);
    const nextDeliveryChannel =
      payload.deliveryChannel === undefined
        ? record.deliveryChannel
        : normalizeDeliveryChannel(payload.deliveryChannel, record.deliveryChannel);
    const nextDigestFrequency =
      payload.digestFrequency === undefined
        ? record.digestFrequency
        : normalizeDigestFrequency(payload.digestFrequency, record.digestFrequency);
    const nextRole =
      payload.role === undefined ? record.role : typeof payload.role === 'string' ? payload.role.trim() || null : null;
    const nextDescription =
      payload.description === undefined
        ? record.description
        : typeof payload.description === 'string'
          ? payload.description.trim() || null
          : null;
    const nextMetadata = payload.metadata === undefined ? record.metadata : normalizeMetadata(payload.metadata);
    const nextEnabled = payload.enabled === undefined ? record.enabled : Boolean(payload.enabled);

    requireDeliveryPrerequisites({ deliveryChannel: nextDeliveryChannel, userId: nextUserId, email: nextEmail });
    await ensureUserExists(nextUserId, transaction);
    await assertUniqueWatcher({ userId: nextUserId, email: nextEmail }, { ignoreId: watcherId, transaction });

    const updates = {
      userId: nextUserId,
      email: nextEmail,
      deliveryChannel: nextDeliveryChannel,
      digestFrequency: nextDigestFrequency,
      role: nextRole,
      description: nextDescription,
      metadata: nextMetadata,
      enabled: nextEnabled,
    };

    if (payload.lastDigestAt !== undefined) {
      updates.lastDigestAt = payload.lastDigestAt ? new Date(payload.lastDigestAt) : null;
    }

    await record.update(updates, { transaction });

    if (actor?.email) {
      logger.info(
        {
          watcherId: record.id,
          actor: actor.email,
          deliveryChannel: record.deliveryChannel,
          digestFrequency: record.digestFrequency,
          enabled: record.enabled,
        },
        'Platform settings watcher updated',
      );
    }

    invalidateActiveWatcherCache();
    return sanitizeWatcher(record);
  });
}

export async function disablePlatformSettingsWatcher(id, { actor } = {}) {
  const watcherId = Number(id);
  if (!Number.isFinite(watcherId) || watcherId <= 0) {
    throw new ValidationError('A valid watcher id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const record = await PlatformSettingsWatcher.findByPk(watcherId, { transaction });
    if (!record) {
      throw new NotFoundError('Watcher not found.');
    }

    await record.update({ enabled: false }, { transaction });
    if (actor?.email) {
      logger.info({ watcherId, actor: actor.email }, 'Platform settings watcher disabled');
    }
    invalidateActiveWatcherCache();
    return sanitizeWatcher(record);
  });
}

export async function deletePlatformSettingsWatcher(id, { actor } = {}) {
  const watcherId = Number(id);
  if (!Number.isFinite(watcherId) || watcherId <= 0) {
    throw new ValidationError('A valid watcher id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const record = await PlatformSettingsWatcher.findByPk(watcherId, { transaction });
    if (!record) {
      return { deleted: false };
    }
    await record.destroy({ transaction });
    if (actor?.email) {
      logger.info({ watcherId, actor: actor.email }, 'Platform settings watcher deleted');
    }
    invalidateActiveWatcherCache();
    return { deleted: true };
  });
}

export async function markPlatformSettingsWatcherDigest(id, executedAt = new Date()) {
  const watcherId = Number(id);
  if (!Number.isFinite(watcherId) || watcherId <= 0) {
    throw new ValidationError('A valid watcher id is required.');
  }
  const timestamp = executedAt instanceof Date ? executedAt : new Date(executedAt);
  await PlatformSettingsWatcher.update({ lastDigestAt: timestamp }, { where: { id: watcherId } });
  invalidateActiveWatcherCache();
}

export default {
  listPlatformSettingsWatchers,
  listActivePlatformSettingsWatchers,
  listActivePlatformSettingsWatcherIds,
  createPlatformSettingsWatcher,
  updatePlatformSettingsWatcher,
  disablePlatformSettingsWatcher,
  deletePlatformSettingsWatcher,
  markPlatformSettingsWatcherDigest,
  __dangerouslyResetPlatformSettingsWatcherCache,
};
