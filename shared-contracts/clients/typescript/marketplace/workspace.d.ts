export interface Workspace {
  id: number;
  projectId: number;
  status: "briefing" | "active" | "blocked" | "completed";
  healthScore: number | null;
  velocityScore: number | null;
  riskLevel: "low" | "medium" | "high";
  progressPercent: number | null;
  clientSatisfaction: number | null;
  automationCoverage: number | null;
  billingStatus: string | null;
  nextMilestone: string | null;
  nextMilestoneDueAt: string | null;
  lastActivityAt: string | null;
  searchFilters: WorkspaceSearchFilters;
}

export interface WorkspaceSearchFilters {
  ranking: WorkspaceRankingSignal;
  freshness: WorkspaceFreshnessSignal;
  audienceTags?: string[];
  highlightedMentors?: number[];
  featuredGroups?: string[];
}

export interface WorkspaceRankingSignal {
  score: number;
  tier: "signature" | "premium" | "core" | "emerging";
  lastEvaluatedAt: string | null;
  algorithmVersion?: string | null;
  signals?: string[];
}

export interface WorkspaceFreshnessSignal {
  status: "vibrant" | "active" | "cooling" | "dormant";
  updatedAt: string | null;
  daysSinceInteraction?: number | null;
  decayRate?: number | null;
  signals?: string[];
}
