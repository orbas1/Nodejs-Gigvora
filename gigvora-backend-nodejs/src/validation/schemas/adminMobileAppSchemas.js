import { z } from 'zod';
import {
  MOBILE_APP_PLATFORMS,
  MOBILE_APP_STATUSES,
  MOBILE_APP_RELEASE_CHANNELS,
  MOBILE_APP_COMPLIANCE_STATUSES,
  MOBILE_APP_VERSION_STATUSES,
  MOBILE_APP_VERSION_TYPES,
  MOBILE_APP_FEATURE_ROLLOUT_TYPES,
} from '../../models/index.js';
import {
  optionalBoolean,
  optionalNumber,
  optionalTrimmedString,
  optionalStringArray,
  requiredTrimmedString,
} from '../primitives.js';

const optionalDateTimeString = optionalTrimmedString({ max: 40 })
  .refine((value) => {
    if (value == null) {
      return true;
    }
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }, { message: 'must be a valid date-time string.' })
  .transform((value) => {
    if (value == null) {
      return undefined;
    }
    return new Date(value).toISOString();
  });

const metadataSchema = z.record(z.string(), z.unknown()).optional().or(z.null());

const mobileAppBaseSchema = z
  .object({
    displayName: requiredTrimmedString({ max: 255 }),
    slug: optionalTrimmedString({ max: 160, toLowerCase: true }),
    platform: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    releaseChannel: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    complianceStatus: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    currentVersion: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    latestBuildNumber: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    minimumSupportedVersion: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    storeUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    supportEmail: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    supportUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    marketingUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    iconUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    heroImageUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    rolloutNotes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
  })
  .strip()
  .refine((value) => !value.platform || MOBILE_APP_PLATFORMS.includes(value.platform), {
    message: `platform must be one of: ${MOBILE_APP_PLATFORMS.join(', ')}`,
    path: ['platform'],
  })
  .refine((value) => !value.status || MOBILE_APP_STATUSES.includes(value.status), {
    message: `status must be one of: ${MOBILE_APP_STATUSES.join(', ')}`,
    path: ['status'],
  })
  .refine((value) => !value.releaseChannel || MOBILE_APP_RELEASE_CHANNELS.includes(value.releaseChannel), {
    message: `releaseChannel must be one of: ${MOBILE_APP_RELEASE_CHANNELS.join(', ')}`,
    path: ['releaseChannel'],
  })
  .refine((value) => !value.complianceStatus || MOBILE_APP_COMPLIANCE_STATUSES.includes(value.complianceStatus), {
    message: `complianceStatus must be one of: ${MOBILE_APP_COMPLIANCE_STATUSES.join(', ')}`,
    path: ['complianceStatus'],
  });

export const mobileAppCreateSchema = mobileAppBaseSchema;

export const mobileAppUpdateSchema = mobileAppBaseSchema.partial().extend({
  displayName: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
});

const appIdSchema = z.object({
  appId: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, 'appId must be a positive integer.')
    .transform((value) => Number.parseInt(value, 10)),
});

const versionIdSchema = z.object({
  versionId: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, 'versionId must be a positive integer.')
    .transform((value) => Number.parseInt(value, 10)),
});

const featureIdSchema = z.object({
  featureId: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, 'featureId must be a positive integer.')
    .transform((value) => Number.parseInt(value, 10)),
});

const mobileAppVersionBaseSchema = z
  .object({
    version: requiredTrimmedString({ max: 40 }),
    buildNumber: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    releaseType: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    releaseChannel: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    rolloutPercentage: optionalNumber({ min: 0, max: 100, precision: 2 }),
    downloadUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    releaseNotes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    releaseNotesUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    checksum: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    minOsVersion: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    sizeBytes: optionalNumber({ min: 0, integer: true }),
    scheduledAt: optionalDateTimeString,
    releasedAt: optionalDateTimeString,
    metadata: metadataSchema,
  })
  .strip()
  .refine((value) => !value.status || MOBILE_APP_VERSION_STATUSES.includes(value.status), {
    message: `status must be one of: ${MOBILE_APP_VERSION_STATUSES.join(', ')}`,
    path: ['status'],
  })
  .refine((value) => !value.releaseType || MOBILE_APP_VERSION_TYPES.includes(value.releaseType), {
    message: `releaseType must be one of: ${MOBILE_APP_VERSION_TYPES.join(', ')}`,
    path: ['releaseType'],
  })
  .refine((value) => !value.releaseChannel || MOBILE_APP_RELEASE_CHANNELS.includes(value.releaseChannel), {
    message: `releaseChannel must be one of: ${MOBILE_APP_RELEASE_CHANNELS.join(', ')}`,
    path: ['releaseChannel'],
  });

export const mobileAppVersionCreateSchema = mobileAppVersionBaseSchema;

export const mobileAppVersionUpdateSchema = mobileAppVersionBaseSchema.partial().extend({
  version: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
});

const mobileAppFeatureBaseSchema = z
  .object({
    key: requiredTrimmedString({ max: 160, toLowerCase: true }),
    name: requiredTrimmedString({ max: 255 }),
    description: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    enabled: optionalBoolean(),
    rolloutType: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    rolloutPercentage: optionalNumber({ min: 0, max: 100, precision: 2 }),
    minAppVersion: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    maxAppVersion: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    audienceRoles: optionalStringArray({ maxItemLength: 120 }),
    metadata: metadataSchema,
  })
  .strip()
  .refine((value) => !value.rolloutType || MOBILE_APP_FEATURE_ROLLOUT_TYPES.includes(value.rolloutType), {
    message: `rolloutType must be one of: ${MOBILE_APP_FEATURE_ROLLOUT_TYPES.join(', ')}`,
    path: ['rolloutType'],
  })
  .refine((value) => {
    if (!value.rolloutType || value.rolloutType !== 'percentage') {
      return true;
    }
    return value.rolloutPercentage == null || (value.rolloutPercentage >= 0 && value.rolloutPercentage <= 100);
  }, {
    message: 'rolloutPercentage must be between 0 and 100 when rolloutType is percentage.',
    path: ['rolloutPercentage'],
  });

export const mobileAppFeatureCreateSchema = mobileAppFeatureBaseSchema;

export const mobileAppFeatureUpdateSchema = mobileAppFeatureBaseSchema.partial().extend({
  key: optionalTrimmedString({ max: 160, toLowerCase: true }).transform((value) => value ?? undefined),
  name: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
});

export const mobileAppListQuerySchema = z
  .object({
    includeInactive: optionalBoolean(),
  })
  .strip();

export const mobileAppParamsSchema = appIdSchema;
export const mobileAppVersionParamsSchema = appIdSchema.merge(versionIdSchema);
export const mobileAppFeatureParamsSchema = appIdSchema.merge(featureIdSchema);

export default {
  mobileAppListQuerySchema,
  mobileAppCreateSchema,
  mobileAppUpdateSchema,
  mobileAppParamsSchema,
  mobileAppVersionParamsSchema,
  mobileAppVersionCreateSchema,
  mobileAppVersionUpdateSchema,
  mobileAppFeatureParamsSchema,
  mobileAppFeatureCreateSchema,
  mobileAppFeatureUpdateSchema,
};
