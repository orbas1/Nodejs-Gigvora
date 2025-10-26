import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

function optionalUuid() {
  return z
    .preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      return value;
    }, z.string().uuid({ message: 'must be a valid UUID.' }))
    .optional();
}

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#?[0-9A-Fa-f]{3,8}$/u, { message: 'must be a valid hex color.' })
  .transform((value) => (value.startsWith('#') ? value : `#${value}`));

const colorPaletteSchema = z
  .object({
    primary: hexColorSchema.optional(),
    secondary: hexColorSchema.optional(),
    accent: hexColorSchema.optional(),
    surface: hexColorSchema.optional(),
    background: hexColorSchema.optional(),
    border: hexColorSchema.optional(),
    muted: hexColorSchema.optional(),
    success: hexColorSchema.optional(),
    warning: hexColorSchema.optional(),
    danger: hexColorSchema.optional(),
    textPrimary: hexColorSchema.optional(),
    textSecondary: hexColorSchema.optional(),
  })
  .strip();

const typographySchema = z
  .object({
    headingFamily: optionalTrimmedString({ max: 120 }),
    bodyFamily: optionalTrimmedString({ max: 120 }),
    monospaceFamily: optionalTrimmedString({ max: 120 }),
    baseFontSize: optionalNumber({ min: 12, max: 22, precision: 1 }),
    lineHeight: optionalNumber({ min: 1, max: 2.4, precision: 2 }),
    headingWeight: optionalNumber({ min: 100, max: 900, precision: 0, integer: true }),
    bodyWeight: optionalNumber({ min: 100, max: 900, precision: 0, integer: true }),
    tracking: optionalNumber({ min: -2, max: 4, precision: 2 }),
  })
  .strip();

const layoutTokensSchema = z
  .object({
    borderRadius: optionalNumber({ min: 0, max: 48, precision: 1 }),
    surfaceRadius: optionalNumber({ min: 0, max: 64, precision: 1 }),
    sectionGutter: optionalNumber({ min: 32, max: 160, precision: 0, integer: true }),
    cardSpacing: optionalNumber({ min: 8, max: 64, precision: 0, integer: true }),
    containerWidth: optionalNumber({ min: 960, max: 1440, precision: 0, integer: true }),
    gridColumns: optionalNumber({ min: 2, max: 16, precision: 0, integer: true }),
  })
  .strip();

const componentTokensSchema = z
  .object({
    buttonShape: optionalTrimmedString({ max: 40 }),
    buttonWeight: optionalTrimmedString({ max: 40 }),
    navStyle: optionalTrimmedString({ max: 40 }),
    shadowStrength: optionalNumber({ min: 0, max: 1, precision: 2 }),
    inputStyle: optionalTrimmedString({ max: 40 }),
  })
  .strip();

const imageryTokensSchema = z
  .object({
    heroBackground: optionalTrimmedString({ max: 120 }),
    pattern: optionalTrimmedString({ max: 120 }),
    illustrationStyle: optionalTrimmedString({ max: 120 }),
  })
  .strip();

const themeTokensSchema = z
  .object({
    colors: colorPaletteSchema.optional(),
    typography: typographySchema.optional(),
    layout: layoutTokensSchema.optional(),
    components: componentTokensSchema.optional(),
    imagery: imageryTokensSchema.optional(),
  })
  .strip();

const accessibilitySchema = z
  .object({
    minimumContrastRatio: optionalNumber({ min: 3, max: 7, precision: 2 }),
    dyslexiaSafeFonts: optionalBoolean(),
    reducedMotion: optionalBoolean(),
    notes: optionalTrimmedString({ max: 2000 }),
  })
  .strip();

const layoutModuleItemSchema = z
  .object({
    id: optionalTrimmedString({ max: 160 }),
    title: requiredTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 600 }),
    icon: optionalTrimmedString({ max: 160 }),
    media: optionalTrimmedString({ max: 2048 }),
  })
  .strip();

const layoutModuleSchema = z
  .object({
    id: optionalTrimmedString({ max: 160 }),
    type: optionalTrimmedString({ max: 80 }).transform((value) => value?.toLowerCase()),
    title: optionalTrimmedString({ max: 160 }),
    subtitle: optionalTrimmedString({ max: 200 }),
    description: optionalTrimmedString({ max: 600 }),
    media: optionalTrimmedString({ max: 2048 }),
    mediaAlt: optionalTrimmedString({ max: 255 }),
    ctaLabel: optionalTrimmedString({ max: 80 }),
    ctaHref: optionalTrimmedString({ max: 2048 }),
    badge: optionalTrimmedString({ max: 80 }),
    layout: optionalTrimmedString({ max: 80 }),
    background: optionalTrimmedString({ max: 80 }),
    accent: optionalTrimmedString({ max: 80 }),
    columns: optionalNumber({ min: 1, max: 6, precision: 0, integer: true }),
    items: z.array(layoutModuleItemSchema).optional(),
  })
  .strip();

const layoutConfigSchema = z
  .object({
    modules: z.array(layoutModuleSchema).max(12).optional(),
    viewport: optionalTrimmedString({ max: 40 }),
    themeOverrides: themeTokensSchema.optional(),
  })
  .strip();

export const appearanceSummaryQuerySchema = z.object({}).strip();

export const appearanceThemeParamsSchema = z
  .object({
    themeId: z.string().uuid({ message: 'themeId must be a valid UUID.' }),
  })
  .strip();

export const appearanceAssetParamsSchema = z
  .object({
    assetId: z.string().uuid({ message: 'assetId must be a valid UUID.' }),
  })
  .strip();

export const appearanceLayoutParamsSchema = z
  .object({
    layoutId: z.string().uuid({ message: 'layoutId must be a valid UUID.' }),
  })
  .strip();

export const appearanceThemeCreateSchema = z
  .object({
    name: requiredTrimmedString({ max: 120 }),
    slug: optionalTrimmedString({ max: 160 }),
    description: optionalTrimmedString({ max: 500 }),
    status: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
    isDefault: optionalBoolean(),
    tokens: themeTokensSchema.optional(),
    accessibility: accessibilitySchema.optional(),
  })
  .strip();

export const appearanceThemeUpdateSchema = appearanceThemeCreateSchema.partial({ name: true }).strip();

export const appearanceAssetCreateSchema = z
  .object({
    themeId: optionalUuid(),
    label: requiredTrimmedString({ max: 120 }),
    description: optionalTrimmedString({ max: 500 }),
    url: requiredTrimmedString({ max: 2048 }),
    altText: optionalTrimmedString({ max: 255 }),
    type: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    metadata: z.record(z.any()).optional(),
    allowedRoles: optionalStringArray({ maxItemLength: 80 }),
    sortOrder: optionalNumber({ min: 0, max: 999, precision: 0, integer: true }),
    isPrimary: optionalBoolean(),
  })
  .strip();

export const appearanceAssetUpdateSchema = appearanceAssetCreateSchema.partial({ label: true, url: true }).strip();

export const appearanceLayoutCreateSchema = z
  .object({
    themeId: optionalUuid(),
    name: requiredTrimmedString({ max: 160 }),
    slug: optionalTrimmedString({ max: 160 }),
    page: optionalTrimmedString({ max: 60 }).transform((value) => value?.toLowerCase()),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    config: layoutConfigSchema.optional(),
    allowedRoles: optionalStringArray({ maxItemLength: 80 }),
    metadata: z.record(z.any()).optional(),
    releaseNotes: optionalTrimmedString({ max: 2000 }),
  })
  .strip();

export const appearanceLayoutUpdateSchema = appearanceLayoutCreateSchema.partial({ name: true }).strip();

export const appearanceLayoutPublishSchema = z
  .object({
    releaseNotes: optionalTrimmedString({ max: 2000 }),
  })
  .strip();

export const appearanceComponentProfileParamsSchema = z
  .object({
    componentProfileId: z.string().uuid({ message: 'componentProfileId must be a valid UUID.' }),
  })
  .strip();

export const appearanceComponentProfileQuerySchema = z
  .object({
    themeId: optionalUuid(),
    status: optionalTrimmedString({ max: 32 }).transform((value) => value?.toLowerCase()),
  })
  .strip();

export const appearanceComponentProfileCreateSchema = z
  .object({
    themeId: optionalUuid(),
    componentKey: requiredTrimmedString({ max: 120 }),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    definition: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const appearanceComponentProfileUpdateSchema = appearanceComponentProfileCreateSchema
  .partial({ componentKey: true })
  .strip();

export default {
  appearanceSummaryQuerySchema,
  appearanceThemeParamsSchema,
  appearanceAssetParamsSchema,
  appearanceLayoutParamsSchema,
  appearanceThemeCreateSchema,
  appearanceThemeUpdateSchema,
  appearanceAssetCreateSchema,
  appearanceAssetUpdateSchema,
  appearanceLayoutCreateSchema,
  appearanceLayoutUpdateSchema,
  appearanceLayoutPublishSchema,
  appearanceComponentProfileParamsSchema,
  appearanceComponentProfileQuerySchema,
  appearanceComponentProfileCreateSchema,
  appearanceComponentProfileUpdateSchema,
};
