import {
  getHealthState,
  markDependencyHealthy,
  markDependencyUnavailable,
  markDependencyDegraded,
} from '../lifecycle/runtimeHealth.js';
import { ServiceUnavailableError } from './errors.js';

const FAILURE_STATUSES = new Set(['error', 'degraded', 'disabled']);

function toArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return [value];
}

function describeIssue({ name, status, reason }) {
  if (reason) {
    return `${name} (${reason})`;
  }
  if (status && status !== 'ok') {
    return `${name} (${status})`;
  }
  return name;
}

function buildErrorMessage(issues, feature) {
  const descriptor = issues.map(describeIssue).join(', ');
  const recoveryVerb = issues.length > 1 ? 'recover' : 'recovers';
  if (feature) {
    return `${feature} is temporarily paused while ${descriptor} ${recoveryVerb}.`;
  }
  return `Operation is temporarily paused while ${descriptor} ${recoveryVerb}.`;
}

export function assertDependenciesHealthy(dependencies, { feature } = {}) {
  const names = toArray(dependencies);
  if (names.length === 0) {
    return;
  }

  const state = getHealthState();
  const dependencyState = state.dependencies ?? {};

  const issues = names
    .map((name) => {
      const entry = dependencyState[name];
      if (!entry || FAILURE_STATUSES.has(entry.status)) {
        return {
          name,
          status: entry?.status ?? 'unknown',
          reason: entry?.error?.message ?? entry?.reason ?? null,
          lastUpdatedAt: entry?.updatedAt ?? null,
          metadata: entry ?? null,
        };
      }
      return null;
    })
    .filter(Boolean);

  if (issues.length === 0) {
    return;
  }

  throw new ServiceUnavailableError(buildErrorMessage(issues, feature), {
    feature: feature ?? null,
    dependencies: issues,
  });
}

export function recordDependencyIncident(name, error, meta = {}) {
  markDependencyUnavailable(name, error, meta);
}

export function recordDependencyRecovery(name, meta = {}) {
  markDependencyHealthy(name, meta);
}

export function recordDependencyDegradation(name, error, meta = {}) {
  markDependencyDegraded(name, error, meta);
}

export default {
  assertDependenciesHealthy,
  recordDependencyIncident,
  recordDependencyRecovery,
  recordDependencyDegradation,
};
