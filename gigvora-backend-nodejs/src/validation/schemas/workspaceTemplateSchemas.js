import { z } from 'zod';

export const workspaceTemplateSlugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, 'slug must contain only alphanumeric characters and hyphens.'),
});

export default {
  workspaceTemplateSlugParamsSchema,
};
