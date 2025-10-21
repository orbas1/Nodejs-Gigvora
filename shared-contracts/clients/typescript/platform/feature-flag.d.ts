export type FeatureFlagStatus = "draft" | "active" | "disabled" | "sunset";

export type FeatureFlagRolloutType = "global" | "percentage" | "cohort" | "conditional";

export type FeatureFlagAudienceType = "user" | "workspace" | "membership" | "domain";

export type FeatureFlagTargetOperator =
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "starts_with";

export interface FeatureFlagTargetCriterion {
  attribute: string;
  operator: FeatureFlagTargetOperator;
  value: string | number | boolean | Array<string | number>;
}

export interface FeatureFlagGuardRail {
  maxErrorRate?: number | null;
  maxLatencyMs?: number | null;
  automaticDisable?: boolean;
  monitorMetrics?: string[];
}

export interface FeatureFlagAssignment {
  id?: number;
  flagId?: number;
  audienceType: FeatureFlagAudienceType;
  audienceValue: string;
  rolloutPercentage?: number | null;
  conditions?: Record<string, unknown> | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeatureFlagOverride {
  subject: string;
  subjectType: "user" | "workspace" | "account";
  enabled: boolean;
  reason?: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagScheduleWindow {
  startAt: string;
  endAt?: string | null;
  timeZone?: string;
}

export interface FeatureFlagEnvironment {
  name: string;
  enabled: boolean;
  defaultRolloutPercentage?: number | null;
  schedule?: FeatureFlagScheduleWindow | null;
  rules?: FeatureFlagRule[];
  overrides?: FeatureFlagOverride[];
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagRule {
  id: string;
  description?: string;
  priority: number;
  criteria: FeatureFlagTargetCriterion[];
  rolloutPercentage?: number | null;
  guardRails?: FeatureFlagGuardRail | null;
}

export interface FeatureFlagAccessControl {
  allowedRoles: string[];
  deniedRoles?: string[];
  allowedOrigins: string[];
  requiresMfa: boolean;
  dataAgreements?: string[];
}

export interface FeatureFlagAuditApproval {
  reviewer: string;
  status: "approved" | "rejected" | "pending";
  reviewedAt?: string | null;
  notes?: string | null;
}

export interface FeatureFlagAuditTrail {
  createdBy: string;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
  approvals?: FeatureFlagAuditApproval[];
}

export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description?: string;
  status: FeatureFlagStatus;
  rolloutType: FeatureFlagRolloutType;
  rolloutPercentage: number | null;
  metadata?: Record<string, unknown>;
  version?: number;
  tags?: string[];
  assignments?: FeatureFlagAssignment[];
  environments?: FeatureFlagEnvironment[];
  accessControl?: FeatureFlagAccessControl;
  audit?: FeatureFlagAuditTrail;
  createdAt?: string;
  updatedAt?: string;
}
