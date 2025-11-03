import {
  DEFAULT_PROFILE_BLUEPRINT_ID,
  PROFILE_BLUEPRINT_VERSION,
  listProfileBlueprintsContract,
  findProfileBlueprintContract,
} from '../../../shared-contracts/domain/marketplace/profile-blueprints.js';
import { appCache } from '../utils/cache.js';
import { NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'marketplace:profile-blueprints';
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
  blueprint.type = (contract.type ?? 'profile').toString();
  return blueprint;
}

async function loadBlueprintIndex() {
  return appCache.remember(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
    const contractBlueprints = listProfileBlueprintsContract();
    const items = contractBlueprints.map((entry) => normaliseBlueprint(entry));
    const lookup = new Map();
    items.forEach((item) => {
      lookup.set(item.id.toLowerCase(), item);
      if (item.slug) {
        lookup.set(item.slug.toLowerCase(), item);
      }
      if (item.type) {
        lookup.set(item.type.toLowerCase(), item);
      }
    });
    return {
      items,
      lookup,
      meta: {
        version: PROFILE_BLUEPRINT_VERSION,
        defaultId: String(DEFAULT_PROFILE_BLUEPRINT_ID),
        total: items.length,
      },
    };
  });
}

export async function listProfileBlueprints() {
  const index = await loadBlueprintIndex();
  return {
    blueprints: index.items.map((item) => clone(item)),
    meta: { ...index.meta },
  };
}

export async function getProfileBlueprint(identifier = DEFAULT_PROFILE_BLUEPRINT_ID) {
  const index = await loadBlueprintIndex();
  const key = identifier ? identifier.toString().trim().toLowerCase() : index.meta.defaultId;
  let blueprint = index.lookup.get(key);
  if (!blueprint && (!identifier || key === index.meta.defaultId)) {
    blueprint = index.lookup.get(index.meta.defaultId);
  }
  if (!blueprint) {
    const contractFallback = findProfileBlueprintContract(identifier);
    if (contractFallback) {
      blueprint = normaliseBlueprint(contractFallback);
    }
  }
  if (!blueprint) {
    throw new NotFoundError('Profile blueprint not found.');
  }
  return {
    blueprint: clone(blueprint),
    meta: { ...index.meta },
  };
}

export function invalidateProfileBlueprintCache() {
  appCache.flushByPrefix(CACHE_NAMESPACE);
}

export default {
  listProfileBlueprints,
  getProfileBlueprint,
  invalidateProfileBlueprintCache,
};
