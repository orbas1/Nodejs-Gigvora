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
  }
}

export type ScoreSummary = SharedContractsRuntime.ScoreSummary;
export type AutomationScoreSummary = SharedContractsRuntime.AutomationScoreSummary;
export type NormalisedWorkspace = SharedContractsRuntime.NormalisedWorkspace;

export declare function normaliseWorkspaceHealth(workspace: Workspace): NormalisedWorkspace;
export declare function computeAutomationCoverageLabel(
  coverage: number | null | undefined,
): AutomationScoreSummary['coverageLabel'];
