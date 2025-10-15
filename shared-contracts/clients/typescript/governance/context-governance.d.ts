export interface ContextGovernance {
  context: {
    name: string;
    displayName: string;
    description: string;
    metadata?: {
      [k: string]: unknown;
    } | null;
    [k: string]: unknown;
  };
  ownerTeam?: string | null;
  dataSteward?: string | null;
  dataClassification?: string | null;
  businessCriticality?: string | null;
  defaultRetention?: string | null;
  dataResidency?: {
    primaryRegion?: string;
    failoverRegion?: string;
    [k: string]: unknown;
  } | null;
  regulatoryFrameworks: string[];
  qualityChecks: {
    name: string;
    cadence: string;
    owner: string;
    [k: string]: unknown;
  }[];
  piiModelCount: number;
  piiFieldCount: number;
  review?: {
    id?: number | null;
    contextName?: string | null;
    ownerTeam?: string | null;
    dataSteward?: string | null;
    reviewStatus?: string | null;
    reviewedAt?: string | null;
    nextReviewDueAt?: string | null;
    scorecard?: {
      [k: string]: unknown;
    } | null;
    notes?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    [k: string]: unknown;
  } | null;
  models: {
    name: string;
    tableName: string | null;
    retention?: string | null;
    classification?: string | null;
    piiFields: string[];
    attributes: {
      name: string;
      type: string | null;
      allowNull: boolean;
      pii: boolean;
      retention?: string | null;
      description?: string | null;
    }[];
  }[];
}
