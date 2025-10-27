import {
  DEFAULT_GIG_BLUEPRINT_ID,
  GIG_BLUEPRINT_VERSION,
  listGigBlueprintsContract,
} from '../../../shared-contracts/domain/marketplace/gig-blueprints.js';
import { appCache } from '../utils/cache.js';
import { NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'marketplace:gig-blueprints';
const CACHE_KEY = `${CACHE_NAMESPACE}:index:v1`;
const CACHE_TTL_SECONDS = 60;

const structuredCloneFn = typeof globalThis.structuredClone === 'function' ? globalThis.structuredClone : null;

function clone(value) {
  if (typeof structuredCloneFn === 'function') {
    return structuredCloneFn(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function normaliseBlueprint(contract) {
  const blueprint = clone(contract);
  blueprint.id = String(contract.id);
  blueprint.slug = (contract.slug ?? contract.id ?? '').toString();
  if (!blueprint.slug) {
    blueprint.slug = blueprint.id;
  }
  return blueprint;
}

async function loadBlueprintIndex() {
  return appCache.remember(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
    const contractBlueprints = listGigBlueprintsContract();
    const items = contractBlueprints.map((entry) => normaliseBlueprint(entry));
    const lookup = new Map();
    items.forEach((item) => {
      lookup.set(item.id.toLowerCase(), item);
      if (item.slug) {
        lookup.set(item.slug.toLowerCase(), item);
      }
    });
    return {
      items,
      lookup,
      meta: {
        version: GIG_BLUEPRINT_VERSION,
        defaultId: String(DEFAULT_GIG_BLUEPRINT_ID),
        total: items.length,
      },
    };
  });
}

export async function listGigBlueprints() {
  const index = await loadBlueprintIndex();
  return {
    blueprints: index.items.map((item) => clone(item)),
    meta: { ...index.meta },
  };
}

export async function getGigBlueprint(identifier = DEFAULT_GIG_BLUEPRINT_ID) {
  const index = await loadBlueprintIndex();
  const key = identifier ? identifier.toString().trim().toLowerCase() : index.meta.defaultId;
  let blueprint = index.lookup.get(key);
  if (!blueprint && (!identifier || key === index.meta.defaultId)) {
    blueprint = index.lookup.get(index.meta.defaultId);
  }
  if (!blueprint) {
    throw new NotFoundError('Gig blueprint not found.');
  }
  return {
    blueprint: clone(blueprint),
    meta: { ...index.meta },
  };
}

export function invalidateGigBlueprintCache() {
  appCache.flushByPrefix(CACHE_NAMESPACE);
}

export default {
  listGigBlueprints,
  getGigBlueprint,
  invalidateGigBlueprintCache,
};
