import { z } from 'zod';

export const navigationPulseQuerySchema = z.object({
  limit: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (value == null || value === '') {
        return true;
      }
      const numeric = Number.parseInt(value, 10);
      return Number.isInteger(numeric) && numeric > 0 && numeric <= 20;
    }, 'limit must be an integer between 1 and 20.')
    .transform((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      return Number.parseInt(value, 10);
    }),
  timeframe: z
    .string()
    .trim()
    .optional()
    .transform((value) => value?.toLowerCase())
    .refine((value) => {
      if (!value) {
        return true;
      }
      return ['24h', '7d', '30d'].includes(value);
    }, 'timeframe must be one of 24h, 7d, or 30d.')
    .transform((value) => (value ? value : undefined)),
  persona: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.toLowerCase() : undefined)),
});

export default {
  navigationPulseQuerySchema,
};
