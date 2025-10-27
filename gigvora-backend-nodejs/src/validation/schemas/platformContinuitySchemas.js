import { z } from 'zod';
import { optionalTrimmedString } from '../primitives.js';

function booleanQueryField() {
  return z
    .union([z.boolean(), optionalTrimmedString({ max: 10 })])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      if (typeof value === 'boolean') {
        return value;
      }
      const token = value.trim().toLowerCase();
      if (token === 'true') {
        return true;
      }
      if (token === 'false') {
        return false;
      }
      return undefined;
    });
}

export const continuityBootstrapQuerySchema = z
  .object({
    mode: optionalTrimmedString({ max: 32 }).transform((value) => value ?? undefined),
    accent: optionalTrimmedString({ max: 32 }).transform((value) => value ?? undefined),
    density: optionalTrimmedString({ max: 32 }).transform((value) => value ?? undefined),
    includeRoutes: booleanQueryField(),
    includeComponents: booleanQueryField(),
  })
  .strip();

export default {
  continuityBootstrapQuerySchema,
};
