import { z } from 'zod';

const statusEnum = z.enum(['invited', 'active', 'suspended', 'archived']);

const socialLinkSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    url: z.string().trim().min(1).max(500).optional(),
  })
  .partial()
  .refine((value) => Boolean(value.label || value.url), {
    message: 'Link label or URL is required.',
  });

const baseCompanySchema = z.object({
  companyName: z.string().trim().min(2).max(255),
  description: z.string().trim().max(6000).optional().nullable(),
  website: z.string().url().max(255).optional().nullable(),
  location: z.string().trim().max(255).optional().nullable(),
  tagline: z.string().trim().max(255).optional().nullable(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  bannerUrl: z.string().url().max(500).optional().nullable(),
  contactEmail: z.string().email().max(255).optional().nullable(),
  contactPhone: z.string().trim().max(60).optional().nullable(),
  socialLinks: z.array(socialLinkSchema).max(10).optional(),
  profileHeadline: z.string().trim().max(255).optional().nullable(),
  profileMission: z.string().trim().max(4000).optional().nullable(),
  timezone: z.string().trim().max(120).optional().nullable(),
});

export const adminCompanyListQuerySchema = z
  .object({
    search: z.string().min(1).max(200).optional(),
    status: statusEnum.optional(),
    sort: z.enum(['created_desc', 'created_asc', 'name_asc', 'name_desc']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .partial();

export const adminCompanyCreateSchema = baseCompanySchema.merge(
  z.object({
    ownerEmail: z.string().email().max(255),
    ownerFirstName: z.string().trim().min(1).max(120),
    ownerLastName: z.string().trim().min(1).max(120),
    ownerPhone: z.string().trim().max(60).optional().nullable(),
    password: z.string().min(12).max(120),
    status: statusEnum.optional(),
  }),
);

export const adminCompanyUpdateSchema = baseCompanySchema.merge(
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
  adminCompanyListQuerySchema,
  adminCompanyCreateSchema,
  adminCompanyUpdateSchema,
};

