import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const nullableTrimmedString = ({ max }) =>
  z
    .union([z.null(), optionalTrimmedString({ max })])
    .transform((value) => (value === null ? null : value));

const metadataSchema = z
  .union([z.record(z.any()), z.null()])
  .optional()
  .transform((value) => (value === null ? null : value));

export const storageLocationCreateSchema = z
  .object({
    locationKey: requiredTrimmedString({ max: 120, toLowerCase: true }),
    name: requiredTrimmedString({ max: 255 }),
    provider: requiredTrimmedString({ max: 60, toLowerCase: true }),
    bucket: requiredTrimmedString({ max: 255 }),
    region: optionalTrimmedString({ max: 120 }),
    endpoint: optionalTrimmedString({ max: 255 }),
    publicBaseUrl: optionalTrimmedString({ max: 2048 }),
    defaultPathPrefix: optionalTrimmedString({ max: 255 }),
    status: optionalTrimmedString({ max: 32, toLowerCase: true }),
    isPrimary: optionalBoolean(),
    versioningEnabled: optionalBoolean(),
    replicationEnabled: optionalBoolean(),
    kmsKeyArn: optionalTrimmedString({ max: 255 }),
    accessKeyId: optionalTrimmedString({ max: 255 }),
    secretAccessKey: nullableTrimmedString({ max: 1024 }).optional(),
    roleArn: optionalTrimmedString({ max: 255 }),
    externalId: optionalTrimmedString({ max: 255 }),
    metadata: metadataSchema,
    currentUsageMb: optionalNumber({ min: 0, precision: 2 }),
    objectCount: optionalNumber({ min: 0, integer: true }),
    ingestBytes24h: optionalNumber({ min: 0, integer: true }),
    egressBytes24h: optionalNumber({ min: 0, integer: true }),
    errorCount24h: optionalNumber({ min: 0, integer: true }),
    lastInventoryAt: optionalTrimmedString({ max: 120 }),
  })
  .strip();

export const storageLocationUpdateSchema = storageLocationCreateSchema.partial().extend({
  locationKey: optionalTrimmedString({ max: 120 }),
  name: optionalTrimmedString({ max: 255 }),
  provider: optionalTrimmedString({ max: 60 }),
  bucket: optionalTrimmedString({ max: 255 }),
});

export const storageLifecycleCreateSchema = z
  .object({
    locationId: z.coerce.number().int().positive(),
    name: requiredTrimmedString({ max: 180 }),
    description: optionalTrimmedString({ max: 500 }),
    status: optionalTrimmedString({ max: 32, toLowerCase: true }),
    filterPrefix: optionalTrimmedString({ max: 255 }),
    transitionAfterDays: optionalNumber({ min: 1, integer: true }),
    transitionStorageClass: optionalTrimmedString({ max: 64, toLowerCase: true }),
    expireAfterDays: optionalNumber({ min: 1, integer: true }),
    deleteExpiredObjects: optionalBoolean(),
    compressObjects: optionalBoolean(),
    metadata: metadataSchema,
  })
  .strip();

export const storageLifecycleUpdateSchema = storageLifecycleCreateSchema.partial().extend({
  locationId: optionalNumber({ min: 1, integer: true }),
});

export const storageUploadPresetCreateSchema = z
  .object({
    locationId: z.coerce.number().int().positive(),
    name: requiredTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 1000 }),
    pathPrefix: optionalTrimmedString({ max: 255 }),
    allowedMimeTypes: optionalStringArray({ maxItemLength: 180 }),
    maxSizeMb: optionalNumber({ min: 1, max: 2048, precision: 2 }),
    allowedRoles: optionalStringArray({ maxItemLength: 120 }),
    requireModeration: optionalBoolean(),
    encryption: optionalTrimmedString({ max: 60, toLowerCase: true }),
    expiresAfterMinutes: optionalNumber({ min: 5, max: 7 * 24 * 60, integer: true }),
    active: optionalBoolean(),
    metadata: metadataSchema,
  })
  .strip();

export const storageUploadPresetUpdateSchema = storageUploadPresetCreateSchema.partial().extend({
  locationId: optionalNumber({ min: 1, integer: true }),
});

export const identifierParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strip();

export default {
  storageLocationCreateSchema,
  storageLocationUpdateSchema,
  storageLifecycleCreateSchema,
  storageLifecycleUpdateSchema,
  storageUploadPresetCreateSchema,
  storageUploadPresetUpdateSchema,
  identifierParamSchema,
};
