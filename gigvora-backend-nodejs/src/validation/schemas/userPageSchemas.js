import { z } from 'zod';
import {
  PAGE_VISIBILITIES,
  PAGE_MEMBER_ROLES,
  PAGE_MEMBER_STATUSES,
  PAGE_POST_STATUSES,
  PAGE_POST_VISIBILITIES,
  COMMUNITY_INVITE_STATUSES,
} from '../../models/constants/index.js';

const numericId = z.coerce.number().int().positive();
const optionalString = (min = 0, max = 2048) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => `${value}`.trim())
    .refine((value) => (min === 0 ? true : value.length >= min), {
      message: `Must be at least ${min} characters long`,
    })
    .refine((value) => value.length <= max, {
      message: `Must be at most ${max} characters long`,
    });

const nullableString = (max = 2048) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value == null) {
        return null;
      }
      const text = `${value}`.trim();
      return text.length ? text : null;
    })
    .refine((value) => (value == null ? true : value.length <= max), {
      message: `Must be at most ${max} characters long`,
    });

const requiredString = (min = 1, max = 2048) =>
  z.preprocess(
    (value) => {
      if (value == null) {
        return value;
      }
      const text = `${value}`.trim();
      return text.length ? text : null;
    },
    z.string().min(min, { message: `Must be at least ${min} characters long` }).max(max),
  );

const booleanLike = z
  .union([z.boolean(), z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null) {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    const normalised = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalised)) {
      return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalised)) {
      return false;
    }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid boolean value.' });
    return z.NEVER;
  })
  .optional();

const metadataSchema = z
  .union([z.record(z.string(), z.any()), z.null()])
  .transform((value) => {
    if (!value || typeof value !== 'object') {
      return null;
    }
    return JSON.parse(JSON.stringify(value));
  })
  .optional();

const attachmentsSchema = z
  .array(
    z
      .object({
        label: nullableString(140).optional(),
        url: optionalString(1, 2048),
        type: nullableString(60).optional(),
        thumbnail: nullableString(2048).optional(),
      })
      .strict(),
  )
  .max(25)
  .optional();

const tagsSchema = z
  .union([
    z.array(optionalString(1, 60)),
    z
      .string()
      .transform((value) => value.split(/[\n,]+/).map((entry) => entry.trim()).filter(Boolean)),
  ])
  .optional();

const isoDateSchema = z
  .union([z.coerce.date(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return null;
    }
    return value;
  });

export const userPageParamsSchema = z.object({
  id: numericId,
});

export const userPageDetailParamsSchema = userPageParamsSchema.extend({
  pageId: numericId,
});

export const userPageMembershipParamsSchema = userPageDetailParamsSchema.extend({
  membershipId: numericId,
});

export const userPageInviteParamsSchema = userPageDetailParamsSchema.extend({
  inviteId: numericId,
});

export const userPagePostParamsSchema = userPageDetailParamsSchema.extend({
  postId: numericId,
});

export const userPagePostCommentParamsSchema = userPagePostParamsSchema.extend({
  commentId: numericId,
});

export const userPageInviteCreationParamsSchema = userPageDetailParamsSchema;

export const userPageMembershipQuerySchema = z.object({
  includeMemberships: booleanLike,
});

export const userPageManagedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const userPagePostsQuerySchema = z.object({
  status: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .refine((value) => PAGE_POST_STATUSES.includes(value), {
      message: `status must be one of: ${PAGE_POST_STATUSES.join(', ')}`,
    })
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const userPageCreateSchema = z
  .object({
    name: requiredString(3, 160),
    visibility: z.enum(PAGE_VISIBILITIES).optional(),
    contactEmail: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value == null) {
          return null;
        }
        const text = `${value}`.trim();
        return text.length ? text : null;
      })
      .refine((value) => value == null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), {
        message: 'contactEmail must be a valid email address',
      })
      .optional(),
    category: nullableString(120).optional(),
    websiteUrl: nullableString(2048).optional(),
    callToAction: nullableString(180).optional(),
    description: nullableString(2000).optional(),
    avatarColor: nullableString(16).optional(),
    bannerImageUrl: nullableString(2048).optional(),
    settings: z.record(z.string(), z.any()).optional(),
    metadata: metadataSchema,
  })
  .strict();

export const userPageUpdateSchema = userPageCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one field must be provided to update the page.',
  },
);

export const userPageMembershipUpdateSchema = z
  .object({
    role: z.enum(PAGE_MEMBER_ROLES).optional(),
    status: z.enum(PAGE_MEMBER_STATUSES).optional(),
    notes: nullableString(1000).optional(),
    metadata: metadataSchema,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one membership field must be updated.',
  });

export const userPageInviteCreateSchema = z
  .object({
    email: optionalString(3, 320).refine((value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), {
      message: 'email must be a valid email address',
    }),
    role: z.enum(PAGE_MEMBER_ROLES).optional(),
    status: z.enum(COMMUNITY_INVITE_STATUSES).optional(),
    message: nullableString(2000).optional(),
    expiresAt: isoDateSchema.optional(),
    metadata: metadataSchema,
  })
  .strict();

export const userPageInviteUpdateSchema = userPageInviteCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one invite field must be updated.',
  },
);

export const userPagePostCreateSchema = z
  .object({
    title: requiredString(3, 180),
    content: requiredString(1, 20_000),
    summary: nullableString(4000).optional(),
    status: z.enum(PAGE_POST_STATUSES).optional(),
    visibility: z.enum(PAGE_POST_VISIBILITIES).optional(),
    scheduledAt: isoDateSchema.optional(),
    attachments: attachmentsSchema,
    metadata: metadataSchema,
    tags: tagsSchema,
  })
  .strict();

export const userPagePostUpdateSchema = userPagePostCreateSchema.partial()
  .extend({
    scheduledAt: z.union([isoDateSchema, z.literal(false)]).transform((value) => {
      if (value === false) {
        return null;
      }
      return value;
    }),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one post field must be provided.',
  });

export default {
  userPageParamsSchema,
  userPageDetailParamsSchema,
  userPageMembershipParamsSchema,
  userPageInviteParamsSchema,
  userPagePostParamsSchema,
  userPageMembershipQuerySchema,
  userPageManagedQuerySchema,
  userPagePostsQuerySchema,
  userPageCreateSchema,
  userPageUpdateSchema,
  userPageMembershipUpdateSchema,
  userPageInviteCreateSchema,
  userPageInviteUpdateSchema,
  userPagePostCreateSchema,
  userPagePostUpdateSchema,
};
