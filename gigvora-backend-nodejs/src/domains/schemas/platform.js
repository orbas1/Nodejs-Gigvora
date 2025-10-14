import { z } from 'zod';

export const featureFlagSchema = z.object({
  id: z.number().int().positive(),
  key: z.string().min(3).max(120),
  name: z.string().max(255),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'disabled']),
  rolloutType: z.enum(['global', 'percentage', 'cohort']),
  rolloutPercentage: z.number().min(0).max(100).nullable(),
  metadata: z.record(z.any()).optional(),
});

export default featureFlagSchema;
