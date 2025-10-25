import { z } from 'zod';
import {
  COMPLIANCE_FRAMEWORK_STATUSES,
  COMPLIANCE_FRAMEWORK_TYPES,
  COMPLIANCE_AUDIT_STATUSES,
  COMPLIANCE_OBLIGATION_STATUSES,
  COMPLIANCE_RISK_RATINGS,
} from '../../models/complianceGovernanceModels.js';
import {
  optionalNumber,
  optionalTrimmedString,
  optionalStringArray,
  requiredTrimmedString,
} from '../primitives.js';

const FRAMEWORK_STATUSES = COMPLIANCE_FRAMEWORK_STATUSES.map((value) => value.toLowerCase());
const FRAMEWORK_TYPES = COMPLIANCE_FRAMEWORK_TYPES.map((value) => value.toLowerCase());
const AUDIT_STATUSES = COMPLIANCE_AUDIT_STATUSES.map((value) => value.toLowerCase());
const OBLIGATION_STATUSES = COMPLIANCE_OBLIGATION_STATUSES.map((value) => value.toLowerCase());
const RISK_RATINGS = COMPLIANCE_RISK_RATINGS.map((value) => value.toLowerCase());

const optionalEnum = (values, field) =>
  optionalTrimmedString({ max: 80 })
    .transform((value) => (value ? value.toLowerCase() : undefined))
    .pipe(
      z.union([
        z.undefined(),
        z.string().refine((value) => values.includes(value), {
          message: `${field} is not supported.`,
        }),
      ]),
    );

const requiredEnum = (values, field, fallback) =>
  optionalEnum(values, field).transform((value) => value ?? fallback);

const stringArray = optionalStringArray({ maxItemLength: 240 }).transform((value) => value ?? []);
const optionalStringArrayRaw = optionalStringArray({ maxItemLength: 240 });

const positiveId = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    const numeric = Number(value);
    if (!Number.isInteger(numeric)) {
      return Number.NaN;
    }
    return numeric;
  }, z.number({ invalid_type_error: 'must be a positive integer.' }))
  .int()
  .positive({ message: 'must be a positive integer.' });

export const adminComplianceFrameworkParamsSchema = z
  .object({ frameworkId: positiveId })
  .strip();

export const adminComplianceAuditParamsSchema = z
  .object({ auditId: positiveId })
  .strip();

export const adminComplianceObligationParamsSchema = z
  .object({ obligationId: positiveId })
  .strip();

export const adminComplianceFrameworkBodySchema = z
  .object({
    name: requiredTrimmedString({ max: 180 }),
    owner: requiredTrimmedString({ max: 180 }),
    region: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    status: requiredEnum(FRAMEWORK_STATUSES, 'status', 'planning'),
    type: requiredEnum(FRAMEWORK_TYPES, 'type', 'attestation'),
    slug: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    automationCoverage: optionalNumber({ min: 0, max: 100, integer: true }).transform((value) => value ?? undefined),
    renewalCadenceMonths: optionalNumber({ min: 1, max: 120, integer: true }).transform((value) => value ?? undefined),
    controls: stringArray,
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminComplianceFrameworkUpdateSchema = z
  .object({
    name: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    owner: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    region: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    status: optionalEnum(FRAMEWORK_STATUSES, 'status'),
    type: optionalEnum(FRAMEWORK_TYPES, 'type'),
    slug: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    automationCoverage: optionalNumber({ min: 0, max: 100, integer: true }).transform((value) => value ?? undefined),
    renewalCadenceMonths: optionalNumber({ min: 1, max: 120, integer: true }).transform((value) => value ?? undefined),
    controls: optionalStringArrayRaw,
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminComplianceAuditBodySchema = z
  .object({
    frameworkId: positiveId,
    name: requiredTrimmedString({ max: 180 }),
    auditFirm: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    status: requiredEnum(AUDIT_STATUSES, 'status', 'scheduled'),
    startDate: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    endDate: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    scope: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    deliverables: stringArray,
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminComplianceAuditUpdateSchema = z
  .object({
    frameworkId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    name: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    auditFirm: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    status: optionalEnum(AUDIT_STATUSES, 'status'),
    startDate: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    endDate: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    scope: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    deliverables: optionalStringArrayRaw,
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminComplianceObligationBodySchema = z
  .object({
    title: requiredTrimmedString({ max: 200 }),
    owner: requiredTrimmedString({ max: 180 }),
    status: requiredEnum(OBLIGATION_STATUSES, 'status', 'backlog'),
    riskRating: requiredEnum(RISK_RATINGS, 'riskRating', 'medium'),
    dueDate: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    frameworkIds: optionalStringArrayRaw,
    notes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    evidenceRequired: z.preprocess((value) => {
      if (value == null || value === '') {
        return false;
      }
      if (typeof value === 'boolean') {
        return value;
      }
      return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
    }, z.boolean()).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminComplianceObligationUpdateSchema = z
  .object({
    title: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined),
    owner: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    status: optionalEnum(OBLIGATION_STATUSES, 'status'),
    riskRating: optionalEnum(RISK_RATINGS, 'riskRating'),
    dueDate: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    frameworkIds: optionalStringArrayRaw,
    notes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    evidenceRequired: z.preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      if (typeof value === 'boolean') {
        return value;
      }
      return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
    }, z.boolean()).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminComplianceEvidenceBodySchema = z
  .object({
    description: requiredTrimmedString({ max: 2000 }),
    fileUrl: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    source: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    submittedAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    submittedById: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    submittedByName: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export default {
  adminComplianceFrameworkParamsSchema,
  adminComplianceFrameworkBodySchema,
  adminComplianceFrameworkUpdateSchema,
  adminComplianceAuditParamsSchema,
  adminComplianceAuditBodySchema,
  adminComplianceAuditUpdateSchema,
  adminComplianceObligationParamsSchema,
  adminComplianceObligationBodySchema,
  adminComplianceObligationUpdateSchema,
  adminComplianceEvidenceBodySchema,
};
