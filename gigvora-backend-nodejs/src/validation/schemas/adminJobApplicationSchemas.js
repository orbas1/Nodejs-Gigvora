import { z } from 'zod';
import {
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredEmail,
  requiredTrimmedString,
} from '../primitives.js';
import {
  JOB_APPLICATION_INTERVIEW_STATUSES,
  JOB_APPLICATION_INTERVIEW_TYPES,
  JOB_APPLICATION_PRIORITIES,
  JOB_APPLICATION_SOURCES,
  JOB_APPLICATION_STAGES,
  JOB_APPLICATION_STATUSES,
  JOB_APPLICATION_VISIBILITIES,
} from '../../models/index.js';

const statusEnum = z.enum(JOB_APPLICATION_STATUSES);
const stageEnum = z.enum(JOB_APPLICATION_STAGES);
const priorityEnum = z.enum(JOB_APPLICATION_PRIORITIES);
const sourceEnum = z.enum(JOB_APPLICATION_SOURCES);
const visibilityEnum = z.enum(JOB_APPLICATION_VISIBILITIES);
const interviewTypeEnum = z.enum(JOB_APPLICATION_INTERVIEW_TYPES);
const interviewStatusEnum = z.enum(JOB_APPLICATION_INTERVIEW_STATUSES);

const optionalDate = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date;
  }, z.date({ invalid_type_error: 'must be a valid ISO date-time.' }))
  .optional();

const optionalCurrency = optionalTrimmedString({ max: 6, toUpperCase: true });
const optionalUrl = optionalTrimmedString({ max: 2048 });
const optionalEmploymentType = optionalTrimmedString({ max: 120 });
const optionalLocation = optionalTrimmedString({ max: 180 });

const baseNoteSchema = z
  .object({
    body: requiredTrimmedString({ max: 4000 }),
    visibility: visibilityEnum.optional(),
  })
  .strip();

const baseDocumentSchema = z
  .object({
    fileName: requiredTrimmedString({ max: 255 }),
    fileUrl: requiredTrimmedString({ max: 2048 }),
    fileType: optionalTrimmedString({ max: 120 }),
    sizeBytes: optionalNumber({ min: 0, precision: 0, integer: true }),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

const baseInterviewSchema = z
  .object({
    scheduledAt: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
          return value;
        }
        return date;
      }, z.date({ invalid_type_error: 'scheduledAt must be a valid ISO date-time.' })),
    durationMinutes: optionalNumber({ min: 0, precision: 0, integer: true }),
    type: interviewTypeEnum.optional(),
    status: interviewStatusEnum.optional(),
    location: optionalTrimmedString({ max: 255 }),
    meetingLink: optionalTrimmedString({ max: 2048 }),
    interviewerName: optionalTrimmedString({ max: 180 }),
    interviewerEmail: optionalTrimmedString({ max: 255 }),
    notes: optionalTrimmedString({ max: 4000 }),
  })
  .strip();

export const jobApplicationListQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, max: 1000, precision: 0, integer: true }),
    pageSize: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }),
    search: optionalTrimmedString({ max: 200 }),
    status: statusEnum.optional(),
    stage: stageEnum.optional(),
    priority: priorityEnum.optional(),
    source: sourceEnum.optional(),
    assignedRecruiterId: optionalNumber({ min: 1, precision: 0, integer: true }),
  })
  .strip();

export const jobApplicationCreateSchema = z
  .object({
    candidateName: requiredTrimmedString({ max: 180 }),
    candidateEmail: requiredEmail({ max: 255 }),
    candidatePhone: optionalTrimmedString({ max: 50 }),
    resumeUrl: optionalUrl,
    coverLetter: optionalTrimmedString({ max: 10000 }),
    portfolioUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    githubUrl: optionalUrl,
    jobTitle: requiredTrimmedString({ max: 180 }),
    jobId: optionalTrimmedString({ max: 80 }),
    jobLocation: optionalLocation,
    employmentType: optionalEmploymentType,
    salaryExpectation: optionalNumber({ min: 0, precision: 2 }),
    currency: optionalCurrency,
    status: statusEnum.optional(),
    stage: stageEnum.optional(),
    priority: priorityEnum.optional(),
    source: sourceEnum.optional(),
    score: optionalNumber({ min: 0, max: 100, precision: 2 }),
    tags: optionalStringArray({ maxItemLength: 80, maxLength: 20 }),
    skills: optionalStringArray({ maxItemLength: 80, maxLength: 40 }),
    metadata: z.record(z.any()).optional(),
    assignedRecruiterId: optionalNumber({ min: 1, precision: 0, integer: true }),
    assignedRecruiterName: optionalTrimmedString({ max: 180 }),
    assignedTeam: optionalTrimmedString({ max: 120 }),
    availabilityDate: optionalDate,
    notes: z.array(baseNoteSchema).optional(),
    documents: z.array(baseDocumentSchema).optional(),
    interviews: z.array(baseInterviewSchema).optional(),
  })
  .strip();

export const jobApplicationUpdateSchema = jobApplicationCreateSchema
  .partial()
  .extend({
    candidateName: optionalTrimmedString({ max: 180 }),
    candidateEmail: optionalTrimmedString({ max: 255 }),
    jobTitle: optionalTrimmedString({ max: 180 }),
    transitionNote: optionalTrimmedString({ max: 500 }),
  })
  .strip();

export const jobApplicationNoteCreateSchema = baseNoteSchema;

export const jobApplicationNoteUpdateSchema = baseNoteSchema.partial().strip();

export const jobApplicationInterviewCreateSchema = baseInterviewSchema;

export const jobApplicationInterviewUpdateSchema = baseInterviewSchema.partial().strip();

export const jobApplicationDocumentCreateSchema = baseDocumentSchema;

export const jobApplicationDocumentUpdateSchema = baseDocumentSchema.partial().strip();
