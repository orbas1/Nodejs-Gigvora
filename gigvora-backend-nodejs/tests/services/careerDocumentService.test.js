import { beforeEach, describe, expect, it } from '@jest/globals';
import careerDocumentService from '../../src/services/careerDocumentService.js';
import { AuthorizationError, ValidationError } from '../../src/utils/errors.js';
import {
  sequelize,
  User,
  CareerDocument,
  CareerDocumentVersion,
} from '../../src/models/careerDocumentModels.js';

async function createUser(overrides = {}) {
  return User.create({
    firstName: 'Lena',
    lastName: 'Fields',
    email: `lena.fields+${Math.random().toString(16).slice(2)}@gigvora.test`,
    password: 'hashed-password',
    userType: overrides.userType ?? 'user',
    ...overrides,
  });
}

describe('careerDocumentService', () => {
  let user;

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    user = await createUser();
  });

  it('creates a baseline CV document with enterprise metadata', async () => {
    const result = await careerDocumentService.createCvDocument({
      userId: user.id,
      actorId: user.id,
      actorRoles: ['user'],
      payload: {
        title: 'Enterprise Product Design CV',
        persona: 'Enterprise product design leader',
        impact: 'Scaled design ops to 12 markets',
        summary: 'Baseline enterprise CV.',
        metrics: { aiCopyScore: 0.92, toneScore: 0.87 },
        tags: ['design', 'leadership'],
      },
    });

    expect(result).toBeDefined();
    expect(result.metadata?.isBaseline).toBe(true);
    expect(result.latestVersion?.versionNumber).toBe(1);
    expect(result.latestVersion?.metrics?.aiCopyScore).toBe(0.92);
    expect(result.tags).toContain('design');

    const stored = await CareerDocument.findByPk(result.id, {
      include: [{ model: CareerDocumentVersion, as: 'versions' }],
    });
    expect(stored).not.toBeNull();
    expect(stored.metadata.isBaseline).toBe(true);
    expect(stored.versions.length).toBe(1);
  });

  it('prevents creating baseline without correct role access', async () => {
    await expect(
      careerDocumentService.createCvDocument({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['viewer'],
        payload: { title: 'Blocked CV' },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('uploads a new version and promotes to baseline when requested', async () => {
    const baseline = await careerDocumentService.createCvDocument({
      userId: user.id,
      actorId: user.id,
      actorRoles: ['user'],
      payload: { title: 'Executive CV', persona: 'Product leader' },
    });

    const updated = await careerDocumentService.uploadCvVersion({
      userId: user.id,
      documentId: baseline.id,
      actorId: user.id,
      actorRoles: ['user'],
      payload: {
        summary: 'Refreshed for 2024 hiring cycle',
        setAsBaseline: true,
        file: {
          storageKey: 's3://gigvora-cdn/cv/executive-v2.pdf',
          base64: Buffer.from('dummy').toString('base64'),
        },
        metrics: { aiCopyScore: 0.95 },
      },
    });

    expect(updated.latestVersion.versionNumber).toBe(2);
    expect(updated.metadata.isBaseline).toBe(true);
    expect(updated.latestVersion.metrics.aiCopyScore).toBe(0.95);
  });

  it('returns a secure workspace snapshot with baseline and variants', async () => {
    const baseline = await careerDocumentService.createCvDocument({
      userId: user.id,
      actorId: user.id,
      actorRoles: ['user'],
      payload: {
        title: 'Baseline CV',
        persona: 'Product operator',
      },
    });

    await careerDocumentService.createCvDocument({
      userId: user.id,
      actorId: user.id,
      actorRoles: ['user'],
      payload: {
        title: 'Growth CV Variant',
        persona: 'Growth focused',
        isBaseline: false,
        metadata: { variantOf: baseline.id },
      },
    });

    const workspace = await careerDocumentService.getCvWorkspace({
      userId: user.id,
      actorId: user.id,
      actorRoles: ['user'],
    });

    expect(workspace.summary.totalDocuments).toBe(2);
    expect(workspace.baseline?.id).toBe(baseline.id);
    expect(workspace.variants.length).toBe(1);
  });

  it('requires a title when creating a CV', async () => {
    await expect(
      careerDocumentService.createCvDocument({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {},
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
