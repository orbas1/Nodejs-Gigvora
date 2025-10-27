import { z } from 'zod';

const numericQuery = (min, max) =>
  z
    .union([z.string().regex(/^\d+$/), z.number().int()])
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => value >= min && value <= max, `Value must be between ${min} and ${max}.`);

export const governanceOverviewQuerySchema = z
  .object({
    lookbackDays: numericQuery(1, 180).optional(),
    queueLimit: numericQuery(1, 50).optional(),
    publicationLimit: numericQuery(1, 50).optional(),
    timelineLimit: numericQuery(1, 50).optional(),
  })
  .strict();

export default {
  governanceOverviewQuerySchema,
};
