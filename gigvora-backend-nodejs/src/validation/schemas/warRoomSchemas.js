import { z } from 'zod';
import { optionalNumber } from '../primitives.js';

export const warRoomPerformanceQuerySchema = z
  .object({
    windowMinutes: optionalNumber({ min: 5, max: 24 * 60, integer: true, precision: 0 }).transform((value) => value ?? undefined),
  })
  .strip();

export const warRoomSecurityQuerySchema = z
  .object({
    limit: optionalNumber({ min: 5, max: 50, integer: true, precision: 0 }).transform((value) => value ?? undefined),
  })
  .strip();

export default {
  warRoomPerformanceQuerySchema,
  warRoomSecurityQuerySchema,
};
