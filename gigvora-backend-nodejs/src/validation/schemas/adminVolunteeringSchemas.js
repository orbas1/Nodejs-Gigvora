import { z } from 'zod';
import {
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';
import {
  VOLUNTEER_PROGRAM_STATUSES,
  VOLUNTEER_ROLE_STATUSES,
  VOLUNTEER_SHIFT_STATUSES,
  VOLUNTEER_ASSIGNMENT_STATUSES,
} from '../../models/index.js';

function optionalStatus(validStatuses) {
  return optionalTrimmedString({ max: 40 })
    .transform((value) => (value ? value.toLowerCase() : undefined))
    .refine((value) => !value || validStatuses.includes(value), {
      message: `status must be one of: ${validStatuses.join(', ')}`,
    });
}

const optionalDateInput = optionalTrimmedString({ max: 40 }).refine(
  (value) => !value || !Number.isNaN(new Date(value).getTime()),
  { message: 'must be a valid date.' },
);

const optionalTimeInput = optionalTrimmedString({ max: 20 }).refine(
  (value) =>
    !value ||
    /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/u.test(value),
  { message: 'must be a valid time (HH:MM or HH:MM:SS).' },
);

export const volunteeringInsightsQuerySchema = z.object({}).strip();

export const programQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, precision: 0, integer: true }),
    pageSize: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }),
    status: optionalStatus(VOLUNTEER_PROGRAM_STATUSES),
    search: optionalTrimmedString({ max: 160 }),
  })
  .strip();

export const programBodySchema = z
  .object({
    name: requiredTrimmedString({ max: 160 }),
    summary: optionalTrimmedString({ max: 2000 }),
    status: optionalStatus(VOLUNTEER_PROGRAM_STATUSES),
    contactEmail: optionalTrimmedString({ max: 255 }),
    contactPhone: optionalTrimmedString({ max: 40 }),
    location: optionalTrimmedString({ max: 255 }),
    tags: optionalStringArray({ maxItemLength: 60, maxLength: 20 }),
    startsAt: optionalDateInput,
    endsAt: optionalDateInput,
    maxVolunteers: optionalNumber({ min: 0, precision: 0, integer: true }),
  })
  .strip();

export const roleQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, precision: 0, integer: true }),
    pageSize: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }),
    status: optionalStatus(VOLUNTEER_ROLE_STATUSES),
    remoteType: optionalTrimmedString({ max: 12 })
      .transform((value) => (value ? value.toLowerCase() : undefined))
      .refine((value) => !value || ['remote', 'hybrid', 'onsite'].includes(value), {
        message: 'remoteType must be remote, hybrid, or onsite.',
      }),
    programId: optionalNumber({ min: 1, precision: 0, integer: true }),
    search: optionalTrimmedString({ max: 160 }),
  })
  .strip();

export const roleBodySchema = z
  .object({
    programId: optionalNumber({ min: 1, precision: 0, integer: true }),
    title: requiredTrimmedString({ max: 255 }),
    organization: requiredTrimmedString({ max: 255 }),
    summary: optionalTrimmedString({ max: 2000 }),
    description: requiredTrimmedString({ max: 8000 }),
    location: optionalTrimmedString({ max: 255 }),
    status: optionalStatus(VOLUNTEER_ROLE_STATUSES),
    remoteType: optionalTrimmedString({ max: 12 })
      .transform((value) => (value ? value.toLowerCase() : undefined))
      .refine((value) => !value || ['remote', 'hybrid', 'onsite'].includes(value), {
        message: 'remoteType must be remote, hybrid, or onsite.',
      }),
    commitmentHours: optionalNumber({ min: 0, max: 500, precision: 2 }),
    applicationUrl: optionalTrimmedString({ max: 500 }),
    applicationDeadline: optionalDateInput,
    spots: optionalNumber({ min: 0, precision: 0, integer: true }),
    skills: optionalStringArray({ maxItemLength: 80, maxLength: 30 }),
    requirements: z
      .array(
        z
          .object({
            label: requiredTrimmedString({ max: 200 }),
            type: optionalTrimmedString({ max: 16 })
              .transform((value) => (value ? value.toLowerCase() : undefined))
              .refine((value) => !value || ['skill', 'check', 'note'].includes(value), {
                message: 'type must be skill, check, or note.',
              }),
          })
          .strip(),
      )
      .max(30)
      .optional(),
    tags: optionalStringArray({ maxItemLength: 60, maxLength: 20 }),
    imageUrl: optionalTrimmedString({ max: 500 }),
    accessRoles: optionalStringArray({ maxItemLength: 60, maxLength: 20 }),
  })
  .strip();

export const shiftQuerySchema = z
  .object({
    status: optionalStatus(VOLUNTEER_SHIFT_STATUSES),
    startDate: optionalDateInput,
    endDate: optionalDateInput,
  })
  .strip();

export const shiftBodySchema = z
  .object({
    programId: optionalNumber({ min: 1, precision: 0, integer: true }),
    title: requiredTrimmedString({ max: 160 }),
    shiftDate: requiredTrimmedString({ max: 10 })
      .refine((value) => /^\d{4}-\d{2}-\d{2}$/u.test(value), { message: 'shiftDate must be YYYY-MM-DD.' }),
    startTime: optionalTimeInput,
    endTime: optionalTimeInput,
    timezone: optionalTrimmedString({ max: 120 }),
    location: optionalTrimmedString({ max: 255 }),
    status: optionalStatus(VOLUNTEER_SHIFT_STATUSES),
    requirements: z
      .array(
        z
          .object({
            label: requiredTrimmedString({ max: 200 }),
            type: optionalTrimmedString({ max: 16 })
              .transform((value) => (value ? value.toLowerCase() : undefined))
              .refine((value) => !value || ['skill', 'check', 'note'].includes(value), {
                message: 'type must be skill, check, or note.',
              }),
          })
          .strip(),
      )
      .max(20)
      .optional(),
    capacity: optionalNumber({ min: 0, precision: 0, integer: true }),
    reserved: optionalNumber({ min: 0, precision: 0, integer: true }),
    notes: optionalTrimmedString({ max: 2000 }),
  })
  .strip();

export const assignmentBodySchema = z
  .object({
    volunteerId: optionalNumber({ min: 1, precision: 0, integer: true }),
    fullName: optionalTrimmedString({ max: 160 }),
    email: optionalTrimmedString({ max: 255 }),
    phone: optionalTrimmedString({ max: 40 }),
    status: optionalStatus(VOLUNTEER_ASSIGNMENT_STATUSES),
    notes: optionalTrimmedString({ max: 2000 }),
    checkInAt: optionalDateInput,
    checkOutAt: optionalDateInput,
  })
  .strip();
