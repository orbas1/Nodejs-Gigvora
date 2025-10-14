import { describe, expect, it } from '@jest/globals';
import '../setupTestEnv.js';
import domainIntrospectionService from '../../src/services/domainIntrospectionService.js';

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
});
