export type AppearanceThemeStatus = 'draft' | 'active' | 'archived';
export type AppearanceAssetStatus = 'active' | 'inactive' | 'archived';
export type AppearanceAssetType =
  | 'logo_light'
  | 'logo_dark'
  | 'favicon'
  | 'hero'
  | 'illustration'
  | 'background'
  | 'icon'
  | 'pattern'
  | 'other';
export type AppearanceLayoutStatus = 'draft' | 'published' | 'archived';
export type AppearanceLayoutPage = 'marketing' | 'dashboard' | 'auth' | 'admin' | 'support';

export interface AppearanceThemeTokensColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  surface?: string;
  background?: string;
  border?: string;
  muted?: string;
  success?: string;
  warning?: string;
  danger?: string;
  textPrimary?: string;
  textSecondary?: string;
  [token: string]: string | undefined;
}

export interface AppearanceThemeTokensTypography {
  headingFamily?: string;
  bodyFamily?: string;
  monospaceFamily?: string;
  baseFontSize?: number;
  lineHeight?: number;
  headingWeight?: number;
  bodyWeight?: number;
  tracking?: number;
  [token: string]: string | number | undefined;
}

export interface AppearanceThemeTokensLayout {
  borderRadius?: number;
  surfaceRadius?: number;
  sectionGutter?: number;
  cardSpacing?: number;
  containerWidth?: number;
  gridColumns?: number;
  [token: string]: number | undefined;
}

export interface AppearanceThemeTokensComponents {
  buttonShape?: string;
  buttonWeight?: string;
  navStyle?: string;
  shadowStrength?: number;
  inputStyle?: string;
  [token: string]: string | number | undefined;
}

export interface AppearanceThemeTokensImagery {
  heroBackground?: string;
  pattern?: string;
  illustrationStyle?: string;
  [token: string]: string | undefined;
}

export interface AppearanceThemeTokens {
  colors?: AppearanceThemeTokensColors;
  typography?: AppearanceThemeTokensTypography;
  layout?: AppearanceThemeTokensLayout;
  components?: AppearanceThemeTokensComponents;
  imagery?: AppearanceThemeTokensImagery;
  [section: string]: unknown;
}

export interface AppearanceThemeAccessibility {
  minimumContrastRatio?: number;
  dyslexiaSafeFonts?: boolean;
  reducedMotion?: boolean;
  notes?: string | null;
  [property: string]: unknown;
}

export interface AppearanceThemeStats {
  assetCount: number;
  layoutCount: number;
}

export interface AppearanceThemeSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: AppearanceThemeStatus;
  isDefault: boolean;
  tokens: AppearanceThemeTokens;
  accessibility: AppearanceThemeAccessibility;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
  stats?: AppearanceThemeStats;
}

export interface AppearanceAssetSummary {
  id: string;
  themeId: string | null;
  type: AppearanceAssetType;
  label: string;
  description: string;
  url: string;
  altText: string;
  metadata: Record<string, unknown>;
  allowedRoles: string[];
  status: AppearanceAssetStatus;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface AppearanceLayoutModuleItem {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  media?: string;
}

export interface AppearanceLayoutModule {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  description?: string;
  media?: string;
  mediaAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  badge?: string;
  layout?: string;
  background?: string;
  accent?: string;
  columns?: number;
  items?: AppearanceLayoutModuleItem[];
  [property: string]: unknown;
}

export interface AppearanceLayoutConfig {
  viewport?: string;
  modules?: AppearanceLayoutModule[];
  themeOverrides?: AppearanceThemeTokens;
  [property: string]: unknown;
}

export interface AppearanceLayoutSummary {
  id: string;
  themeId: string | null;
  name: string;
  slug: string;
  page: AppearanceLayoutPage;
  status: AppearanceLayoutStatus;
  version: number;
  config: AppearanceLayoutConfig;
  allowedRoles: string[];
  metadata: Record<string, unknown>;
  releaseNotes: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface AppearanceSummaryStats {
  totalThemes: number;
  activeThemes: number;
  defaultThemeId: string | null;
  totalAssets: number;
  activeAssets: number;
  totalLayouts: number;
  publishedLayouts: number;
}

export interface AppearanceSummarySnapshot {
  themes: AppearanceThemeSummary[];
  assets: AppearanceAssetSummary[];
  layouts: AppearanceLayoutSummary[];
  stats: AppearanceSummaryStats;
}
