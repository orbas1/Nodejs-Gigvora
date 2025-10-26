import type { Workspace } from '../typescript/marketplace/workspace';

declare namespace SharedContractsRuntime {
  interface ScoreSummary {
    value: number | null;
    grade: 'excellent' | 'healthy' | 'watch' | 'at-risk' | 'critical' | 'unknown';
    display: string;
  }

  interface AutomationScoreSummary extends ScoreSummary {
    coverageLabel: 'high' | 'moderate' | 'low' | 'none';
  }

  interface NormalisedWorkspace {
    id: number;
    projectId: number;
    status: Workspace['status'];
    riskLevel: Workspace['riskLevel'];
    scores: {
      health: ScoreSummary;
      velocity: ScoreSummary;
      progress: ScoreSummary;
      automation: AutomationScoreSummary;
    };
    clientSatisfaction: ScoreSummary;
    billingStatus: string | null;
    nextMilestone: {
      label: string | null;
      dueAt: string | null;
    };
    lastActivityAt: string | null;
    searchFilters: {
      ranking: {
        score: number | null;
        tier: Workspace['searchFilters']['ranking']['tier'];
        lastEvaluatedAt: string | null;
        algorithmVersion: string | null;
        signals: string[];
      };
      freshness: {
        status: Workspace['searchFilters']['freshness']['status'];
        updatedAt: string | null;
        daysSinceInteraction: number | null;
        decayRate: number | null;
        signals: string[];
      };
      audienceTags: string[];
      highlightedMentors: number[];
      featuredGroups: string[];
    };
  }
}

export type ScoreSummary = SharedContractsRuntime.ScoreSummary;
export type AutomationScoreSummary = SharedContractsRuntime.AutomationScoreSummary;
export type NormalisedWorkspace = SharedContractsRuntime.NormalisedWorkspace;

export declare function normaliseWorkspaceHealth(workspace: Workspace): NormalisedWorkspace;
export declare function computeAutomationCoverageLabel(
  coverage: number | null | undefined,
): AutomationScoreSummary['coverageLabel'];
export declare function computeRankingTier(
  score: number | null | undefined,
): Workspace['searchFilters']['ranking']['tier'];
export declare function computeFreshnessStatus(
  freshness: Workspace['searchFilters']['freshness'] | undefined | null,
): Workspace['searchFilters']['freshness']['status'];
