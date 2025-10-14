import { z } from 'zod';

export const projectWorkspaceSchema = z.object({
  id: z.number().int().positive(),
  projectId: z.number().int().positive(),
  status: z.enum(['briefing', 'active', 'blocked', 'completed']),
  healthScore: z.number().min(0).max(100).nullable(),
  velocityScore: z.number().min(0).max(100).nullable(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  progressPercent: z.number().min(0).max(100).nullable(),
  clientSatisfaction: z.number().min(0).max(5).nullable(),
  automationCoverage: z.number().min(0).max(100).nullable(),
  billingStatus: z.string().nullable(),
  nextMilestone: z.string().nullable(),
  nextMilestoneDueAt: z.string().datetime().nullable(),
  lastActivityAt: z.string().datetime().nullable(),
});

export default projectWorkspaceSchema;
