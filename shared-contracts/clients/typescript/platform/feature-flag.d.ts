export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "disabled" | "sunset";
  rolloutType: "global" | "percentage" | "cohort" | "conditional";
  rolloutPercentage: number | null;
  metadata?: {
    [k: string]: unknown;
  };
  assignments?: Assignment[];
  environments?: Environment[];
  tags?: string[];
  version?: number;
  accessControl?: AccessControl;
  audit?: AuditTrail;
  createdAt?: string;
  updatedAt?: string;
}
export interface Assignment {
  id?: number | null;
  flagId?: number | null;
  audienceType: "user" | "workspace" | "membership" | "domain";
  audienceValue: string;
  rolloutPercentage?: number | null;
  conditions?: {
    [k: string]: unknown;
  } | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
export interface Environment {
  name: string;
  enabled: boolean;
  defaultRolloutPercentage?: number | null;
  schedule?: ScheduleWindow | null;
  rules?: Rule[];
  overrides?: Override[];
  metadata?: {
    [k: string]: unknown;
  };
}
export interface ScheduleWindow {
  startAt: string;
  endAt?: string | null;
  timeZone?: string;
}
export interface Rule {
  id: string;
  description?: string;
  priority: number;
  /**
   * @minItems 1
   */
  criteria: [Criterion, ...Criterion[]];
  rolloutPercentage?: number | null;
  guardRails?: GuardRail | null;
}
export interface Criterion {
  attribute: string;
  operator: "eq" | "neq" | "in" | "not_in" | "gt" | "gte" | "lt" | "lte" | "contains" | "starts_with";
  value: string | number | boolean | [string | number, ...(string | number)[]];
}
export interface GuardRail {
  maxErrorRate?: number | null;
  maxLatencyMs?: number | null;
  automaticDisable?: boolean;
  monitorMetrics?: string[];
}
export interface Override {
  subject: string;
  subjectType: "user" | "workspace" | "account";
  enabled: boolean;
  reason?: string;
  expiresAt?: string | null;
  metadata?: {
    [k: string]: unknown;
  };
}
export interface AccessControl {
  /**
   * @minItems 1
   */
  allowedRoles: [string, ...string[]];
  deniedRoles?: string[];
  /**
   * @minItems 1
   */
  allowedOrigins: [string, ...string[]];
  requiresMfa: boolean;
  dataAgreements?: string[];
}
export interface AuditTrail {
  createdBy: string;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
  approvals?: AuditApproval[];
}
export interface AuditApproval {
  reviewer: string;
  status: "approved" | "rejected" | "pending";
  reviewedAt?: string | null;
  notes?: string | null;
}
