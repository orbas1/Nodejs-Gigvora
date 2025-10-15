export interface ContextGovernanceSummaries {
  generatedAt: string;
  contexts: {
    contextName: string;
    displayName: string;
    description?: string | null;
    ownerTeam: string | null;
    dataSteward: string | null;
    dataClassification: string | null;
    businessCriticality?: string | null;
    defaultRetention?: string | null;
    regulatoryFrameworks?: string[];
    piiModelCount: number;
    piiFieldCount: number;
    reviewStatus: string;
    reviewedAt?: string | null;
    nextReviewDueAt?: string | null;
    automationCoverage?: number | null;
    remediationItems?: number | null;
  }[];
}
