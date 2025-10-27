import {
  DESIGN_SYSTEM_VERSION,
  createDesignSystemSnapshot,
  resolveDesignRuntime,
  withDesignTokens,
} from '../../../shared-contracts/domain/platform/design-system.js';

let baseConfiguration = {};

export function configureDesignSystem(options = {}) {
  if (!options || typeof options !== 'object') {
    return;
  }
  baseConfiguration = { ...baseConfiguration, ...options };
}

export function resetDesignSystem() {
  baseConfiguration = {};
}

export function getDesignSystemSnapshot(options = {}) {
  const overrides = options && typeof options === 'object' ? options : {};
  return withDesignTokens(createDesignSystemSnapshot({ ...baseConfiguration }), overrides);
}

export function getRuntimeDesignTokens(preferences = {}) {
  const snapshot = getDesignSystemSnapshot();
  return resolveDesignRuntime({ snapshot, ...preferences });
}

export function getDesignSystemMetadata() {
  const snapshot = getDesignSystemSnapshot();
  return {
    version: snapshot.version ?? DESIGN_SYSTEM_VERSION,
    generatedAt: snapshot.generatedAt,
    analytics: snapshot.metadata?.analytics ?? null,
    componentTokenVersion: snapshot.componentTokens?.version ?? null,
  };
}

export default {
  configureDesignSystem,
  resetDesignSystem,
  getDesignSystemSnapshot,
  getRuntimeDesignTokens,
  getDesignSystemMetadata,
};
