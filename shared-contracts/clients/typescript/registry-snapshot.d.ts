export interface RegistrySnapshotIntegrity {
  algorithm: "sha256";
  checksum: string;
  generatedAt: string;
  expiresAt?: string | null;
}

export interface RegistryContextQualityCheck {
  name: string;
  cadence: string;
  owner: string;
}

export interface RegistryContextDataResidency {
  primaryRegion: string;
  failoverRegion: string;
  [k: string]: unknown;
}

export interface RegistryContextAccessControl {
  allowedRoles: string[];
  deniedRoles?: string[];
  allowedOrigins: string[];
  requiresMfa: boolean;
  dataAgreements?: string[];
}

export interface RegistryContextObservability {
  dataFreshnessSlaMinutes: number;
  incidentSlackChannel: string;
  pagerDutyServiceId: string;
}

export interface RegistryContextMetadata {
  ownerTeam: string;
  dataSteward: string;
  dataClassification: string;
  businessCriticality: string;
  dataResidency: RegistryContextDataResidency;
  defaultRetention: string;
  regulatoryFrameworks: string[];
  qualityChecks: RegistryContextQualityCheck[];
  accessControl: RegistryContextAccessControl;
  observability: RegistryContextObservability;
  [k: string]: unknown;
}

export interface RegistryContext {
  name: string;
  displayName: string;
  description: string;
  modelNames: string[];
  metadata: RegistryContextMetadata;
}

export interface RegistrySnapshot {
  version: string;
  generatedAt: string;
  integrity: RegistrySnapshotIntegrity;
  contexts: Record<string, RegistryContext>;
}
