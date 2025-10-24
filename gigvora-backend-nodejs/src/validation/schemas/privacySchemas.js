import { z } from 'zod';
import { optionalBoolean, optionalNumber, optionalTrimmedString } from '../primitives.js';

const formatEnum = ['zip', 'json', 'csv', 'pdf'];

export const updateSecurityPreferencesSchema = z
  .object({
    sessionTimeoutMinutes: optionalNumber({ min: 5, max: 1440, precision: 0, integer: true }).transform(
      (value) => value ?? undefined,
    ),
    biometricApprovalsEnabled: optionalBoolean(),
    deviceApprovalsEnabled: optionalBoolean(),
  })
  .strip();

const optionalExportFormat = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }
    const normalised = `${value}`.trim().toLowerCase();
    if (!normalised) {
      return undefined;
    }
    return normalised;
  })
  .refine((value) => value === undefined || formatEnum.includes(value), {
    message: 'format must be one of zip, json, csv, or pdf.',
  });

const optionalExportType = optionalTrimmedString({ max: 60 }).transform((value) =>
  value ? value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').slice(0, 60) : undefined,
);

const optionalNotes = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }
    const text = `${value}`.trim();
    return text ? text.slice(0, 2000) : undefined;
  });

export const createDataExportRequestSchema = z
  .object({
    format: optionalExportFormat,
    type: optionalExportType,
    notes: optionalNotes,
    priority: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    channels: z
      .union([z.array(optionalTrimmedString({ max: 40 })), optionalTrimmedString({ max: 40 }), z.undefined(), z.null()])
      .transform((value) => {
        if (value == null) {
          return undefined;
        }
        if (Array.isArray(value)) {
          return Array.from(new Set(value.filter(Boolean)));
        }
        return [value];
      }),
    includeInvoices: optionalBoolean(),
    includeMessages: optionalBoolean(),
  })
  .strip();

export default {
  updateSecurityPreferencesSchema,
  createDataExportRequestSchema,
};
