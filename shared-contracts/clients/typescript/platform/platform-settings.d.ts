export interface PlatformSettingDocumentationField {
  label: string;
  description: string;
  impact?: string;
  sensitive?: boolean;
  i18nKey: string;
}

export interface PlatformSettingDocumentationSection {
  i18nKey: string;
  title: string;
  description: string;
  impact?: string;
  fields: Record<string, PlatformSettingDocumentationField>;
}

export interface PlatformSettingsDocumentation {
  version: string;
  generatedAt: string;
  sections: Record<string, PlatformSettingDocumentationSection>;
}

export interface PlatformSettingsMetadata {
  version: string;
  generatedAt: string;
  sensitiveFields: string[];
  updatedAt?: string | null;
}

export type PlatformSettingsWatcherDeliveryChannel = 'notification' | 'email';
export type PlatformSettingsWatcherDigestFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';

export interface PlatformSettingsWatcher {
  id: number;
  userId: number | null;
  email: string | null;
  deliveryChannel: PlatformSettingsWatcherDeliveryChannel;
  digestFrequency: PlatformSettingsWatcherDigestFrequency;
  role: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  enabled: boolean;
  lastDigestAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
