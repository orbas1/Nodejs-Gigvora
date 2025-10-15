import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import '../setupTestEnv.js';
import domainIntrospectionService from '../../src/services/domainIntrospectionService.js';
import { DomainGovernanceReview } from '../../src/models/index.js';

beforeAll(async () => {
  await DomainGovernanceReview.sync({ force: true });
  await DomainGovernanceReview.create({
    contextName: 'auth',
    ownerTeam: 'Identity & Access Engineering',
    dataSteward: 'Security & Compliance',
    reviewStatus: 'approved',
    reviewedAt: new Date('2024-09-30T10:00:00Z'),
    nextReviewDueAt: new Date('2025-03-31T10:00:00Z'),
    scorecard: { automationCoverage: 0.92, remediationItems: 1 },
    notes: 'Seeded for domain introspection governance test coverage.',
  });
});

afterAll(async () => {
  await DomainGovernanceReview.destroy({ where: {} });
});

describe('DomainIntrospectionService', () => {
  it('lists contexts with attached services and sampled models', () => {
    const contexts = domainIntrospectionService.listContexts();
    const authContext = contexts.find((context) => context.name === 'auth');

    expect(authContext).toBeDefined();
    expect(Array.isArray(authContext.services)).toBe(true);
    expect(authContext.services.some((service) => service.key === 'auth')).toBe(true);
    expect(authContext.sampledModels.length).toBeGreaterThan(0);
  });

  it('returns context detail including model metadata', () => {
    const detail = domainIntrospectionService.getContextDetail('auth');
    const userModel = detail.models.find((model) => model.name === 'User');

    expect(userModel).toBeDefined();
    expect(userModel.tableName).toBe('users');
    expect(userModel.attributes.some((attribute) => attribute.name === 'email')).toBe(true);
  });

  it('returns a specific model definition with indexes', () => {
    const featureFlagModel = domainIntrospectionService.getModelDetail('platform', 'FeatureFlag');

    expect(featureFlagModel).toBeDefined();
    expect(featureFlagModel.indexes.some((index) => Array.isArray(index.fields) && index.fields.length > 0)).toBe(true);
    expect(featureFlagModel.associations.some((association) => association.target === 'User')).toBe(true);
  });

  it('summarises governance metadata for every context', async () => {
    const summaries = await domainIntrospectionService.listGovernanceSummaries();
    const authSummary = summaries.find((context) => context.contextName === 'auth');

    expect(authSummary).toBeDefined();
    expect(authSummary?.dataClassification).toBe('Restricted');
    expect(authSummary?.reviewStatus).toBe('approved');
    expect(authSummary?.piiFieldCount).toBeGreaterThan(0);
  });

  it('merges metadata and review records when fetching governance detail', async () => {
    const detail = await domainIntrospectionService.getContextGovernance('auth');

    expect(detail.context.name).toBe('auth');
    expect(detail.review?.reviewStatus).toBe('approved');
    expect(detail.qualityChecks.length).toBeGreaterThan(0);
    expect(detail.models.some((model) => model.piiFields.length > 0)).toBe(true);
  });
});
