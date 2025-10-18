import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const colorSchema = optionalTrimmedString({ max: 9 }).refine(
  (value) => !value || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value),
  { message: 'must be a valid hex color.' },
);

const heroSchema = z
  .object({
    title: optionalTrimmedString({ max: 200 }),
    subtitle: optionalTrimmedString({ max: 400 }),
    backgroundImageUrl: optionalTrimmedString({ max: 2048 }),
    backgroundImageAlt: optionalTrimmedString({ max: 255 }),
    ctaLabel: optionalTrimmedString({ max: 120 }),
    ctaUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const seoSchema = z
  .object({
    defaultTitle: optionalTrimmedString({ max: 200 }),
    defaultDescription: optionalTrimmedString({ max: 500 }),
    socialImageUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const assetsSchema = z
  .object({
    logoUrl: optionalTrimmedString({ max: 2048 }),
    faviconUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const socialSchema = z
  .object({
    twitter: optionalTrimmedString({ max: 2048 }),
    linkedin: optionalTrimmedString({ max: 2048 }),
    youtube: optionalTrimmedString({ max: 2048 }),
    instagram: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const announcementSchema = z
  .object({
    enabled: optionalBoolean(),
    message: optionalTrimmedString({ max: 255 }),
    linkLabel: optionalTrimmedString({ max: 120 }),
    linkUrl: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const footerLinkSchema = z
  .object({
    id: optionalTrimmedString({ max: 120 }),
    label: requiredTrimmedString({ max: 160 }),
    url: requiredTrimmedString({ max: 2048 }),
    description: optionalTrimmedString({ max: 255 }),
    icon: optionalTrimmedString({ max: 120 }),
    orderIndex: optionalNumber({ min: 0, precision: 0, integer: true }),
  })
  .strip();

const footerSchema = z
  .object({
    links: z.array(footerLinkSchema).optional(),
    copyright: optionalTrimmedString({ max: 255 }),
  })
  .strip();

export const siteSettingsBodySchema = z
  .object({
    siteName: optionalTrimmedString({ max: 160 }),
    tagline: optionalTrimmedString({ max: 255 }),
    domain: optionalTrimmedString({ max: 255 }),
    primaryColor: colorSchema,
    accentColor: colorSchema,
    supportEmail: optionalTrimmedString({ max: 255 }),
    supportPhone: optionalTrimmedString({ max: 60 }),
    hero: heroSchema.optional(),
    assets: assetsSchema.optional(),
    seo: seoSchema.optional(),
    social: socialSchema.optional(),
    announcement: announcementSchema.optional(),
    footer: footerSchema.optional(),
  })
  .strip();

const basePageSchema = z
  .object({
    title: requiredTrimmedString({ max: 200 }),
    slug: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
    status: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    summary: optionalTrimmedString({ max: 500 }),
    heroTitle: optionalTrimmedString({ max: 200 }),
    heroSubtitle: optionalTrimmedString({ max: 400 }),
    heroImageUrl: optionalTrimmedString({ max: 2048 }),
    heroImageAlt: optionalTrimmedString({ max: 255 }),
    ctaLabel: optionalTrimmedString({ max: 120 }),
    ctaUrl: optionalTrimmedString({ max: 2048 }),
    layout: optionalTrimmedString({ max: 80 }),
    body: z.union([z.string(), z.undefined(), z.null()]).transform((value) => value ?? undefined),
    featureHighlights: optionalStringArray({ maxItemLength: 240 }),
    seoTitle: optionalTrimmedString({ max: 200 }),
    seoDescription: optionalTrimmedString({ max: 500 }),
    seoKeywords: optionalStringArray({ maxItemLength: 120 }),
    thumbnailUrl: optionalTrimmedString({ max: 2048 }),
    allowedRoles: optionalStringArray({ maxItemLength: 120 }),
  })
  .strip();

export const sitePageCreateSchema = basePageSchema;

export const sitePageUpdateSchema = basePageSchema.partial().strip();

export const siteNavigationCreateSchema = z
  .object({
    menuKey: optionalTrimmedString({ max: 80 }).transform((value) => value?.toLowerCase()),
    label: requiredTrimmedString({ max: 160 }),
    url: requiredTrimmedString({ max: 2048 }),
    description: optionalTrimmedString({ max: 255 }),
    icon: optionalTrimmedString({ max: 120 }),
    orderIndex: optionalNumber({ min: 0, precision: 0, integer: true }),
    isExternal: optionalBoolean(),
    openInNewTab: optionalBoolean(),
    allowedRoles: optionalStringArray({ maxItemLength: 120 }),
    parentId: optionalNumber({ min: 1, precision: 0, integer: true }),
  })
  .strip();

export const siteNavigationUpdateSchema = siteNavigationCreateSchema.partial().strip();

export default {
  siteSettingsBodySchema,
  sitePageCreateSchema,
  sitePageUpdateSchema,
  siteNavigationCreateSchema,
  siteNavigationUpdateSchema,
};
