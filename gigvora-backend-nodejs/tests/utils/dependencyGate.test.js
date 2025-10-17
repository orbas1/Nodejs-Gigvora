import { describe, it, expect, afterEach } from '@jest/globals';
import { assertDependenciesHealthy } from '../../src/utils/dependencyGate.js';
import { markDependencyUnavailable, markDependencyHealthy } from '../../src/lifecycle/runtimeHealth.js';
import { ServiceUnavailableError } from '../../src/utils/errors.js';

const originalGuard = process.env.ENABLE_DEPENDENCY_GUARD;

afterEach(() => {
  if (originalGuard === undefined) {
    delete process.env.ENABLE_DEPENDENCY_GUARD;
  } else {
    process.env.ENABLE_DEPENDENCY_GUARD = originalGuard;
  }
});

describe('dependencyGate.assertDependenciesHealthy', () => {
  it('does not throw in test environments when guard is disabled', () => {
    delete process.env.ENABLE_DEPENDENCY_GUARD;
    expect(() => assertDependenciesHealthy(['unregistered-service'])).not.toThrow();
  });

  it('throws when guard is explicitly enabled and dependency is unavailable', () => {
    process.env.ENABLE_DEPENDENCY_GUARD = 'true';
    markDependencyUnavailable('search-index', new Error('down'));
    expect(() => assertDependenciesHealthy(['search-index'])).toThrow(ServiceUnavailableError);
  });

  it('treats explicitly healthy dependencies as successful', () => {
    process.env.ENABLE_DEPENDENCY_GUARD = 'true';
    markDependencyHealthy('email-smtp');
    expect(() => assertDependenciesHealthy(['email-smtp'])).not.toThrow();
  });
});
