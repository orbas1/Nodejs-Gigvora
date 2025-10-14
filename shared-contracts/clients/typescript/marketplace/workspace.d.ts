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
}
