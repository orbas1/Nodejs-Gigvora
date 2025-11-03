import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  DEFAULT_PROFILE_BLUEPRINT_ID,
  PROFILE_BLUEPRINTS,
} from '../../../../shared-contracts/domain/marketplace/profile-blueprints.js';
import {
  getProfileBlueprint,
  listProfileBlueprints,
  invalidateProfileBlueprintCache,
} from '../profileBlueprintService.js';
import { NotFoundError } from '../../utils/errors.js';

describe('profileBlueprintService', () => {
  beforeEach(() => {
    invalidateProfileBlueprintCache();
  });

  it('lists all profile blueprints with metadata', async () => {
    const { blueprints, meta } = await listProfileBlueprints();

    expect(Array.isArray(blueprints)).toBe(true);
    expect(blueprints.length).toBe(PROFILE_BLUEPRINTS.length);
    expect(meta).toMatchObject({
      total: PROFILE_BLUEPRINTS.length,
      defaultId: String(DEFAULT_PROFILE_BLUEPRINT_ID),
      version: expect.any(String),
    });
  });

  it('fetches the default profile blueprint when no identifier is provided', async () => {
    const { blueprint, meta } = await getProfileBlueprint();

    expect(blueprint.id).toBe(String(DEFAULT_PROFILE_BLUEPRINT_ID));
    expect(meta.defaultId).toBe(String(DEFAULT_PROFILE_BLUEPRINT_ID));
  });

  it('fetches a profile blueprint by slug', async () => {
    const slug = PROFILE_BLUEPRINTS.find((entry) => entry.slug)?.slug;
    const { blueprint } = await getProfileBlueprint(slug);

    expect(blueprint.slug).toBe(slug);
  });

  it('throws when a profile blueprint cannot be found', async () => {
    await expect(getProfileBlueprint('unknown-blueprint')).rejects.toThrow(NotFoundError);
  });
});
