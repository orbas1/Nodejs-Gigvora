import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import {
  DEFAULT_GIG_BLUEPRINT_ID,
  GIG_BLUEPRINTS,
} from '../../../../shared-contracts/domain/marketplace/gig-blueprints.js';
import {
  getGigBlueprint,
  invalidateGigBlueprintCache,
  listGigBlueprints,
} from '../gigBlueprintService.js';
import { NotFoundError } from '../../utils/errors.js';

const DEFAULT_SLUG = GIG_BLUEPRINTS[0]?.slug ?? DEFAULT_GIG_BLUEPRINT_ID;

describe('gigBlueprintService', () => {
  beforeEach(() => {
    invalidateGigBlueprintCache();
  });

  afterEach(() => {
    invalidateGigBlueprintCache();
  });

  it('returns the list of gig blueprints with meta information', async () => {
    const { blueprints, meta } = await listGigBlueprints();

    expect(Array.isArray(blueprints)).toBe(true);
    expect(meta).toEqual(
      expect.objectContaining({
        total: blueprints.length,
        version: expect.any(String),
        defaultId: expect.any(String),
      }),
    );
    expect(blueprints[0]).toEqual(expect.objectContaining({ id: expect.any(String), hero: expect.any(Object) }));
  });

  it('provides deep clones so consumers cannot mutate cache entries', async () => {
    const { blueprints: firstCall } = await listGigBlueprints();
    firstCall[0].hero.title = 'Mutated title';

    const { blueprints: secondCall } = await listGigBlueprints();
    expect(secondCall[0].hero.title).not.toBe('Mutated title');
  });

  it('fetches a blueprint by identifier', async () => {
    const { blueprint, meta } = await getGigBlueprint(DEFAULT_GIG_BLUEPRINT_ID);

    expect(blueprint).toEqual(expect.objectContaining({ id: String(DEFAULT_GIG_BLUEPRINT_ID) }));
    expect(meta).toEqual(
      expect.objectContaining({
        version: expect.any(String),
        defaultId: String(DEFAULT_GIG_BLUEPRINT_ID),
      }),
    );
  });

  it('fetches a blueprint by slug', async () => {
    const { blueprint } = await getGigBlueprint(DEFAULT_SLUG);
    expect(blueprint.slug).toBe(DEFAULT_SLUG);
  });

  it('throws NotFoundError for unknown identifiers', async () => {
    await expect(getGigBlueprint('unknown-blueprint-id')).rejects.toThrow(NotFoundError);
  });
});
