import { z } from 'zod';

const statusEnum = z.enum(['invited', 'active', 'suspended', 'archived']);

export const adminAgencyListQuerySchema = z
  .object({
    search: z.string().min(1).max(200).optional(),
    status: statusEnum.optional(),
    focusArea: z.string().min(1).max(200).optional(),
    sort: z.enum(['created_desc', 'created_asc', 'name_asc', 'name_desc']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .partial();

const socialLinkSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    url: z.string().trim().min(1).max(500).optional(),
  })
  .partial()
  .refine((value) => Boolean(value.label || value.url), {
    message: 'Link label or URL is required.',
  });

const baseAgencySchema = z.object({
  agencyName: z.string().trim().min(2).max(255),
  focusArea: z.string().trim().max(255).optional().nullable(),
  website: z.string().url().max(255).optional().nullable(),
  location: z.string().trim().max(255).optional().nullable(),
  tagline: z.string().trim().max(160).optional().nullable(),
  summary: z.string().trim().max(5000).optional().nullable(),
  services: z.union([z.array(z.string().trim().max(255)), z.string().trim().max(2000)]).optional(),
  industries: z.union([z.array(z.string().trim().max(255)), z.string().trim().max(2000)]).optional(),
  clients: z.union([z.array(z.string().trim().max(255)), z.string().trim().max(2000)]).optional(),
  awards: z.union([z.array(z.string().trim().max(255)), z.string().trim().max(2000)]).optional(),
  socialLinks: z.array(socialLinkSchema).max(10).optional(),
  teamSize: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  foundedYear: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  workforceAvailable: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  workforceNotes: z.string().trim().max(255).optional().nullable(),
  introVideoUrl: z.string().url().max(500).optional().nullable(),
  bannerUrl: z.string().url().max(500).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  brandColor: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/).optional().nullable(),
  primaryContactName: z.string().trim().max(160).optional().nullable(),
  primaryContactEmail: z.string().email().max(255).optional().nullable(),
  primaryContactPhone: z.string().trim().max(60).optional().nullable(),
  autoAcceptFollowers: z.boolean().optional(),
  followerPolicy: z.enum(['open', 'approval_required', 'closed']).optional(),
  connectionPolicy: z.enum(['open', 'invite_only', 'manual_review']).optional(),
  defaultConnectionMessage: z.string().trim().max(2000).optional().nullable(),
  profileHeadline: z.string().trim().max(255).optional().nullable(),
  profileMission: z.string().trim().max(4000).optional().nullable(),
  timezone: z.string().trim().max(120).optional().nullable(),
});

export const adminAgencyCreateSchema = baseAgencySchema.merge(
  z.object({
    ownerEmail: z.string().email().max(255),
    ownerFirstName: z.string().trim().min(1).max(120),
    ownerLastName: z.string().trim().min(1).max(120),
    ownerPhone: z.string().trim().max(60).optional().nullable(),
    password: z.string().min(12).max(120),
    status: statusEnum.optional(),
  }),
);

export const adminAgencyUpdateSchema = baseAgencySchema.merge(
  z
    .object({
      ownerEmail: z.string().email().max(255).optional(),
      ownerFirstName: z.string().trim().min(1).max(120).optional(),
      ownerLastName: z.string().trim().min(1).max(120).optional(),
      ownerPhone: z.string().trim().max(60).optional().nullable(),
      status: statusEnum.optional(),
      memberships: z.array(z.string().trim().min(1).max(60)).optional(),
      primaryDashboard: z.string().trim().max(60).optional(),
    })
    .partial(),
);

export default {
  adminAgencyListQuerySchema,
  adminAgencyCreateSchema,
  adminAgencyUpdateSchema,
};

