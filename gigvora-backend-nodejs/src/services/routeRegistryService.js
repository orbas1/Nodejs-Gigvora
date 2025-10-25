import sequelize from '../models/sequelizeClient.js';
import { RouteRegistryEntry } from '../models/routeRegistryModels.js';
import {
  flattenRouteRegistry,
} from '../../../shared-contracts/domain/platform/route-registry.js';

function normaliseList(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return Array.from(new Set(values.map((value) => `${value ?? ''}`.trim()).filter(Boolean))).sort();
}

function buildModelPayload(entry) {
  return {
    routeId: entry.routeId,
    collection: entry.collection,
    path: entry.path,
    absolutePath: entry.absolutePath,
    modulePath: entry.module ?? null,
    title: entry.title,
    icon: entry.icon ?? null,
    persona: entry.persona ?? null,
    featureFlag: entry.featureFlag ?? null,
    shellTheme: entry.shellTheme ?? null,
    allowedRoles: normaliseList(entry.allowedRoles),
    allowedMemberships: normaliseList(entry.allowedMemberships),
    metadata: entry.metadata ?? {},
    isActive: true,
    deprecatedAt: null,
  };
}

export function getCanonicalRouteRegistry() {
  return flattenRouteRegistry().map((entry) => ({
    ...entry,
    allowedRoles: entry.allowedRoles ?? [],
    allowedMemberships: entry.allowedMemberships ?? [],
    metadata: entry.metadata ?? {},
  }));
}

export async function listRouteRegistry({ includeInactive = false } = {}) {
  const where = includeInactive ? {} : { isActive: true };
  const entries = await RouteRegistryEntry.findAll({
    where,
    order: [
      ['collection', 'ASC'],
      ['absolutePath', 'ASC'],
    ],
  });
  return entries.map((entry) => entry.toPublicObject());
}

function hasDifferences(model, payload) {
  if (
    model.collection !== payload.collection ||
    model.path !== payload.path ||
    model.absolutePath !== payload.absolutePath ||
    model.modulePath !== payload.modulePath ||
    model.title !== payload.title ||
    (model.icon || null) !== payload.icon ||
    (model.persona || null) !== payload.persona ||
    (model.featureFlag || null) !== payload.featureFlag ||
    (model.shellTheme || null) !== payload.shellTheme
  ) {
    return true;
  }

  const currentRoles = normaliseList(model.allowedRoles);
  const nextRoles = normaliseList(payload.allowedRoles);
  const currentMemberships = normaliseList(model.allowedMemberships);
  const nextMemberships = normaliseList(payload.allowedMemberships);

  if (currentRoles.length !== nextRoles.length || currentRoles.some((value, index) => value !== nextRoles[index])) {
    return true;
  }
  if (
    currentMemberships.length !== nextMemberships.length ||
    currentMemberships.some((value, index) => value !== nextMemberships[index])
  ) {
    return true;
  }

  const currentMetadata = model.metadata ? JSON.stringify(model.metadata) : '{}';
  const nextMetadata = payload.metadata ? JSON.stringify(payload.metadata) : '{}';
  if (currentMetadata !== nextMetadata) {
    return true;
  }

  if (!model.isActive || model.deprecatedAt !== payload.deprecatedAt) {
    return true;
  }

  return false;
}

export async function syncRouteRegistry({ actor } = {}) {
  const canonicalEntries = getCanonicalRouteRegistry();
  const summary = { created: 0, updated: 0, deactivated: 0, total: canonicalEntries.length };

  await sequelize.transaction(async (transaction) => {
    const existingEntries = await RouteRegistryEntry.findAll({ transaction });
    const existingByRouteId = new Map(existingEntries.map((entry) => [entry.routeId, entry]));

    for (const entry of canonicalEntries) {
      const payload = buildModelPayload(entry);
      const current = existingByRouteId.get(entry.routeId);

      if (!current) {
        await RouteRegistryEntry.create(payload, { transaction });
        summary.created += 1;
        continue;
      }

      existingByRouteId.delete(entry.routeId);
      if (hasDifferences(current, payload)) {
        await current.update(payload, { transaction });
        summary.updated += 1;
      } else if (!current.isActive || current.deprecatedAt) {
        await current.update({ isActive: true, deprecatedAt: null }, { transaction });
        summary.updated += 1;
      }
    }

    const now = new Date();
    for (const entry of existingByRouteId.values()) {
      if (entry.isActive) {
        await entry.update({ isActive: false, deprecatedAt: now }, { transaction });
        summary.deactivated += 1;
      }
    }
  });

  return { ...summary, actor: actor ?? null };
}

export async function findRouteById(routeId) {
  const entry = await RouteRegistryEntry.findOne({ where: { routeId } });
  return entry ? entry.toPublicObject() : null;
}

export default {
  getCanonicalRouteRegistry,
  listRouteRegistry,
  syncRouteRegistry,
  findRouteById,
};
