process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = 'tmp/career-document-service.test.sqlite';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

import { beforeEach, describe, expect, it } from '@jest/globals';
import { DataTypes } from 'sequelize';
import careerDocumentService from '../../src/services/careerDocumentService.js';
import { AuthorizationError, ValidationError } from '../../src/utils/errors.js';
import { sequelize, User, CareerDocument, CareerDocumentVersion } from '../../src/models/careerDocumentModels.js';

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
  beforeEach(async () => {
    await sequelize.sync({ force: true });
    const [schema] = await sequelize.query("PRAGMA table_info('users');");
    const columnNames = schema.map((col) => col.name);
    const queryInterface = sequelize.getQueryInterface();
    if (!columnNames.includes('location')) {
      await queryInterface.addColumn('users', 'location', { type: DataTypes.STRING(255), allowNull: true });
    }
    if (!columnNames.includes('geoLocation')) {
      await queryInterface.addColumn('users', 'geoLocation', { type: DataTypes.JSON, allowNull: true });
    }
  });

  it('creates a baseline CV document with enterprise metadata', async () => {
    const user = await createUser();
    const totalUsers = await User.count();
    expect(totalUsers).toBe(1);
    const resolved = await User.findByPk(user.id);
    expect(resolved).not.toBeNull();
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
    const user = await createUser();
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
    const user = await createUser();
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

  it('allows a talent coach to bootstrap a CV for a freelancer workspace', async () => {
    const talentCoach = await createUser({ userType: 'admin' });
    const freelancer = await createUser({ userType: 'freelancer' });

    const document = await careerDocumentService.createCvDocument({
      userId: freelancer.id,
      actorId: talentCoach.id,
      actorRoles: ['admin', 'talent_lead'],
      payload: {
        title: 'Freelancer Launch CV',
        persona: 'Independent growth marketer',
        impact: 'Scaled marketplaces across LATAM',
        tags: ['marketing', 'growth'],
        metadata: { variantOf: null },
      },
    });

    expect(document.userId).toBe(freelancer.id);
    expect(document.metadata.isBaseline).toBe(true);
    expect(document.tags).toContain('marketing');
  });

  it('returns a secure workspace snapshot with baseline and variants', async () => {
    const user = await createUser();
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
    const user = await createUser();
    await expect(
      careerDocumentService.createCvDocument({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {},
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  describe('cover letters', () => {
    it('creates a cover letter template with sanitized story blocks and scores', async () => {
      const user = await createUser();
      const result = await careerDocumentService.createCoverLetter({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {
          title: 'Growth Stage Cover Letter',
          persona: 'Product storyteller',
          targetCompany: 'Gigvora',
          targetRole: 'Lead PM',
          storyBlocks: [1, '2', 2],
          metrics: { toneScore: 0.84, qualityScore: 0.9, wordCount: 420 },
          file: { storageKey: 'r2://cover-letters/growth.pdf' },
          tags: 'product, storytelling',
        },
      });

      expect(result.documentType).toBe('cover_letter');
      expect(result.metadata.storyBlocks).toEqual([1, 2]);
      expect(result.latestVersion.metrics.storyBlocksUsed).toEqual([1, 2]);
      expect(result.aiAssisted).toBe(true);
      expect(result.shareUrl).toContain('documents/growth-stage-cover-letter');
    });

    it('uploads a new cover letter version with refreshed story mix', async () => {
      const user = await createUser();
      const template = await careerDocumentService.createCoverLetter({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {
          title: 'Series B Cover Letter',
          storyBlocks: [10],
        },
      });

      const updated = await careerDocumentService.uploadCoverLetterVersion({
        userId: user.id,
        documentId: template.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {
          storyBlocks: ['4', 5],
          metrics: { toneScore: 0.9, qualityScore: 0.93 },
          content: 'Refined content for targeted outreach',
        },
      });

      expect(updated.latestVersion.versionNumber).toBe(2);
      expect(updated.metadata.storyBlocks).toEqual([4, 5]);
      expect(updated.latestVersion.metrics.storyBlocksUsed).toEqual([4, 5]);
    });

    it('summarizes a cover letter workspace with tone insights', async () => {
      const user = await createUser();
      await careerDocumentService.createCoverLetter({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {
          title: 'AI Startup Cover Letter',
          metrics: { toneScore: 0.8 },
          storyBlocks: [1],
        },
      });

      await careerDocumentService.createCoverLetter({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {
          title: 'Enterprise SaaS Cover Letter',
          metrics: { toneScore: 0.9 },
          storyBlocks: [2, 3],
        },
      });

      await careerDocumentService.createStoryBlock({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {
          title: 'Growth Narrative',
          content: 'Launched new go-to-market motions across EU.',
          metrics: { toneScore: 0.88 },
          metadata: { useCount: 5 },
        },
      });

      const workspace = await careerDocumentService.getCoverLetterWorkspace({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['user'],
      });

      expect(workspace.summary.totalTemplates).toBe(2);
      expect(workspace.summary.totalStoryBlocks).toBe(1);
      expect(workspace.templates).toHaveLength(2);
      expect(workspace.toneSummary.average).toBeCloseTo(0.85, 2);
      expect(workspace.templates[0].storyBlocksUsed.length).toBeGreaterThan(0);
      expect(workspace.storyBlocks[0].useCount).toBe(5);
    });
  });

  describe('story blocks', () => {
    it('creates and iterates on a storytelling block for targeted outreach', async () => {
      const user = await createUser();
      const block = await careerDocumentService.createStoryBlock({
        userId: user.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {
          title: 'Marketplace GTM Story',
          content: 'Grew GMV by 320% by orchestrating remote teams.',
          metrics: { toneScore: 0.82 },
          metadata: { category: 'growth' },
        },
      });

      expect(block.documentType).toBe('story_block');
      expect(block.latestVersion.versionNumber).toBe(1);
      expect(block.metadata.category).toBe('growth');

      const refined = await careerDocumentService.uploadStoryBlockVersion({
        userId: user.id,
        documentId: block.id,
        actorId: user.id,
        actorRoles: ['user'],
        payload: {
          title: 'Marketplace GTM Story v2',
          content: 'Refined narrative with quantified results.',
          metrics: { toneScore: 0.9 },
          metadata: { impact: 'Improved conversions by 45%' },
        },
      });

      expect(refined.latestVersion.versionNumber).toBe(2);
      expect(refined.metadata.impact).toBe('Improved conversions by 45%');
    });
  });
});
