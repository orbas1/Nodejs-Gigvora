const SCHEMA_VERSION = '2025-03-11';
const DOCUMENTATION_GENERATED_AT = '2025-03-11T08:00:00Z';

function deepFreeze(object) {
  if (!object || typeof object !== 'object' || Object.isFrozen(object)) {
    return object;
  }
  Object.getOwnPropertyNames(object).forEach((key) => {
    const value = object[key];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  return Object.freeze(object);
}

function clone(value) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

const BASE_SECTIONS = {
  commissions: {
    i18nKey: 'platform.settings.sections.commissions',
    title: 'Commission Policy & Payout Governance',
    description:
      'Controls Gigvora\'s default commission schedule, minimum fees, and payout messaging applied to bookings.',
    impact:
      'Adjusting these values updates revenue share calculations, payout statements, and treasury guardrails across dashboards.',
    fields: {
      'commissions.enabled': {
        i18nKey: 'platform.settings.fields.commissions.enabled',
        label: 'Enable platform commission',
        description: 'Gates whether the global service fee is active for marketplace transactions.',
        impact: 'Disabling the fee bypasses platform revenue capture and removes fee callouts in billing flows.',
      },
      'commissions.rate': {
        i18nKey: 'platform.settings.fields.commissions.rate',
        label: 'Default commission rate',
        description: 'Percentage withheld from each qualifying transaction before creator payout.',
        impact:
          'Feeds pricing calculators, escrow releases, and finance dashboards; changes trigger treasury cache refreshes.',
      },
      'commissions.minimumFee': {
        i18nKey: 'platform.settings.fields.commissions.minimumFee',
        label: 'Minimum commission amount',
        description: 'Ensures low-value bookings still contribute a baseline platform fee.',
        impact: 'Impacts invoice rounding and minimum payout threshold messaging for creators.',
      },
      'commissions.currency': {
        i18nKey: 'platform.settings.fields.commissions.currency',
        label: 'Commission settlement currency',
        description: 'Currency used for fee calculations and billing copy when applying platform commissions.',
        impact: 'Must align with treasury ledgers and payout processors to avoid mismatched settlement.',
      },
      'commissions.providerControlsServicemanPay': {
        i18nKey: 'platform.settings.fields.commissions.providerControlsServicemanPay',
        label: 'Provider controls serviceman pay',
        description: 'Determines whether providers compensate their own servicemen directly.',
        impact: 'Guides compliance copy and determines whether escrow holds include serviceman allotments.',
      },
      'commissions.servicemanMinimumRate': {
        i18nKey: 'platform.settings.fields.commissions.servicemanMinimumRate',
        label: 'Minimum serviceman rate',
        description: 'Lowest hourly/engagement rate permitted when providers pay their own crews.',
        impact: 'Feeds compliance warnings and budgeting validations for provider-run teams.',
      },
      'commissions.servicemanPayoutNotes': {
        i18nKey: 'platform.settings.fields.commissions.servicemanPayoutNotes',
        label: 'Serviceman payout notes',
        description: 'Guidance surfaced in admin consoles clarifying who is responsible for serviceman remuneration.',
        impact: 'Displayed in payout workflows, agreements, and compliance wizards.',
      },
    },
  },
  subscriptions: {
    i18nKey: 'platform.settings.sections.subscriptions',
    title: 'Subscription Packaging',
    description: 'Defines membership plans, restricted features, and trial windows for recurring offers.',
    impact:
      'Updates propagate to storefront selectors, billing sync jobs, and access-control enforcement for gated modules.',
    fields: {
      'subscriptions.enabled': {
        i18nKey: 'platform.settings.fields.subscriptions.enabled',
        label: 'Enable subscriptions',
        description: 'Master toggle for subscription monetisation flows.',
        impact: 'Disabling halts renewal jobs and hides subscription CTAs across admin and member dashboards.',
      },
      'subscriptions.restrictedFeatures': {
        i18nKey: 'platform.settings.fields.subscriptions.restrictedFeatures',
        label: 'Restricted features',
        description: 'Feature keys that remain locked until a paid plan is active.',
        impact: 'Drives feature-flag overlays and upgrade prompts in the frontend shell.',
      },
      'subscriptions.plans': {
        i18nKey: 'platform.settings.fields.subscriptions.plans',
        label: 'Subscription plans',
        description: 'Plan catalogue including pricing, interval, and gated features.',
        impact: 'Synced to billing providers and access control policies when admins publish plan updates.',
      },
    },
  },
  payments: {
    i18nKey: 'platform.settings.sections.payments',
    title: 'Payment Processor Configuration',
    description:
      'Stores API credentials and operational toggles for Stripe and Escrow.com flows, including hold policies.',
    impact:
      'Credentials determine which processors are available to bookers; hold policies update finance automations and alerts.',
    fields: {
      'payments.provider': {
        i18nKey: 'platform.settings.fields.payments.provider',
        label: 'Active payment provider',
        description: 'Selects which processor is used for checkout and payouts.',
        impact: 'Switching providers validates credentials and updates downstream treasury routing + reporting labels.',
      },
      'payments.stripe.publishableKey': {
        i18nKey: 'platform.settings.fields.payments.stripe.publishableKey',
        label: 'Stripe publishable key',
        description: 'Public key used to initialise Stripe.js clients.',
        impact: 'Required for client-side payment flows and onboarding forms.',
      },
      'payments.stripe.secretKey': {
        i18nKey: 'platform.settings.fields.payments.stripe.secretKey',
        label: 'Stripe secret key',
        description: 'Private key used to sign Stripe API requests.',
        impact: 'Rotating re-establishes webhook signatures and payment intent creation; stored encrypted at rest.',
        sensitive: true,
      },
      'payments.stripe.webhookSecret': {
        i18nKey: 'platform.settings.fields.payments.stripe.webhookSecret',
        label: 'Stripe webhook secret',
        description: 'Verifies webhook payloads posted back to Gigvora.',
        impact: 'Required to trust payment status callbacks; stored encrypted at rest.',
        sensitive: true,
      },
      'payments.stripe.accountId': {
        i18nKey: 'platform.settings.fields.payments.stripe.accountId',
        label: 'Stripe Connect account',
        description: 'Optional connected account representing Gigvora treasury.',
        impact: 'Used when operating in Connect mode to direct payouts and transfers.',
      },
      'payments.escrow_com.apiKey': {
        i18nKey: 'platform.settings.fields.payments.escrow.apiKey',
        label: 'Escrow.com API key',
        description: 'Identifies the Gigvora escrow integration user.',
        impact: 'Needed for escrow API calls and event polling; stored encrypted at rest.',
        sensitive: true,
      },
      'payments.escrow_com.apiSecret': {
        i18nKey: 'platform.settings.fields.payments.escrow.apiSecret',
        label: 'Escrow.com API secret',
        description: 'Private credential for Escrow.com API access.',
        impact: 'Rotations require credential sync with Escrow.com support; stored encrypted at rest.',
        sensitive: true,
      },
      'payments.escrow_com.sandbox': {
        i18nKey: 'platform.settings.fields.payments.escrow.sandbox',
        label: 'Escrow sandbox mode',
        description: 'Determines whether Escrow.com operates against sandbox endpoints.',
        impact: 'Sandbox mode prevents live settlements and is only suitable for testing environments.',
      },
      'payments.escrowControls.defaultHoldPeriodHours': {
        i18nKey: 'platform.settings.fields.payments.escrowControls.defaultHoldPeriodHours',
        label: 'Escrow default hold period (hours)',
        description: 'Default number of hours funds remain on hold before release eligibility.',
        impact: 'Controls compliance timers and customer messaging around escrow releases.',
      },
      'payments.escrowControls.autoReleaseHours': {
        i18nKey: 'platform.settings.fields.payments.escrowControls.autoReleaseHours',
        label: 'Escrow auto release (hours)',
        description: 'Number of hours before automatic release triggers when no disputes are open.',
        impact: 'Aligns with regulatory obligations and service SLAs for fund release.',
      },
      'payments.escrowControls.requireManualApproval': {
        i18nKey: 'platform.settings.fields.payments.escrowControls.requireManualApproval',
        label: 'Require manual approval',
        description: 'Forces treasury review before releasing escrowed funds.',
        impact: 'Introduces manual workflow but provides additional compliance oversight.',
      },
      'payments.escrowControls.manualApprovalThreshold': {
        i18nKey: 'platform.settings.fields.payments.escrowControls.manualApprovalThreshold',
        label: 'Manual approval threshold',
        description: 'Transactions above this value require manual approval when manual reviews are enabled.',
        impact: 'Ensures large releases receive explicit compliance sign-off.',
      },
      'payments.escrowControls.notificationEmails': {
        i18nKey: 'platform.settings.fields.payments.escrowControls.notificationEmails',
        label: 'Escrow notification emails',
        description: 'Email recipients notified when escrow transitions occur.',
        impact: 'Keeps treasury stakeholders informed of high-value disbursements.',
      },
      'payments.escrowControls.statementDescriptor': {
        i18nKey: 'platform.settings.fields.payments.escrowControls.statementDescriptor',
        label: 'Statement descriptor',
        description: 'Descriptor appearing on payer bank statements for escrow charges.',
        impact: 'Affects dispute handling and transparency for customers.',
      },
    },
  },
  smtp: {
    i18nKey: 'platform.settings.sections.smtp',
    title: 'Transactional Email Delivery',
    description: 'SMTP host, credentials, and sender identity for operational messages.',
    impact:
      'Updates reconfigure the notification service, changing verification, onboarding, and alert delivery pipelines.',
    fields: {
      'smtp.host': {
        i18nKey: 'platform.settings.fields.smtp.host',
        label: 'SMTP host',
        description: 'Server address used for outbound mail.',
        impact: 'Invalid hosts disrupt all transactional email until corrected.',
      },
      'smtp.port': {
        i18nKey: 'platform.settings.fields.smtp.port',
        label: 'SMTP port',
        description: 'Network port for SMTP connections.',
        impact: 'Must align with provider requirements and firewall rules.',
      },
      'smtp.secure': {
        i18nKey: 'platform.settings.fields.smtp.secure',
        label: 'Use TLS',
        description: 'Determines whether TLS is required for SMTP connections.',
        impact: 'Enforces encryption expectations for email delivery.',
      },
      'smtp.username': {
        i18nKey: 'platform.settings.fields.smtp.username',
        label: 'SMTP username',
        description: 'Authentication username for the SMTP account.',
        impact: 'Required for providers enforcing authenticated relay.',
      },
      'smtp.password': {
        i18nKey: 'platform.settings.fields.smtp.password',
        label: 'SMTP password',
        description: 'Authentication secret for the SMTP account.',
        impact: 'Stored encrypted; rotation refreshes mailer credentials without redeploying the API.',
        sensitive: true,
      },
      'smtp.fromAddress': {
        i18nKey: 'platform.settings.fields.smtp.fromAddress',
        label: 'From address',
        description: 'Email address used as the sender for transactional messages.',
        impact: 'Visible to users; must pass SPF/DKIM validation.',
      },
      'smtp.fromName': {
        i18nKey: 'platform.settings.fields.smtp.fromName',
        label: 'From name',
        description: 'Display name attached to transactional emails.',
        impact: 'Influences recognition and trust for recipients.',
      },
    },
  },
  storage: {
    i18nKey: 'platform.settings.sections.storage',
    title: 'File Storage Integration',
    description: 'Cloudflare R2 credentials, bucket metadata, and CDN routing.',
    impact: 'Controls how assets, uploads, and backups are stored and fetched across the product.',
    fields: {
      'storage.provider': {
        i18nKey: 'platform.settings.fields.storage.provider',
        label: 'Storage provider',
        description: 'Selected storage backend for asset uploads.',
        impact: 'Determines SDK usage and access control policies.',
      },
      'storage.cloudflare_r2.accountId': {
        i18nKey: 'platform.settings.fields.storage.cloudflare.accountId',
        label: 'R2 account ID',
        description: 'Account identifier for the Cloudflare R2 integration.',
        impact: 'Required to authenticate API requests and manage buckets.',
      },
      'storage.cloudflare_r2.accessKeyId': {
        i18nKey: 'platform.settings.fields.storage.cloudflare.accessKeyId',
        label: 'R2 access key',
        description: 'Public portion of the R2 credential pair.',
        impact: 'Used for signature generation; requires matching secret to function.',
      },
      'storage.cloudflare_r2.secretAccessKey': {
        i18nKey: 'platform.settings.fields.storage.cloudflare.secretAccessKey',
        label: 'R2 secret access key',
        description: 'Private credential for R2 API access.',
        impact: 'Stored encrypted; rotation invalidates previous signed URLs.',
        sensitive: true,
      },
      'storage.cloudflare_r2.bucket': {
        i18nKey: 'platform.settings.fields.storage.cloudflare.bucket',
        label: 'R2 bucket',
        description: 'Primary bucket used for asset storage.',
        impact: 'Controls where uploads are persisted; referenced by CDN rules.',
      },
      'storage.cloudflare_r2.endpoint': {
        i18nKey: 'platform.settings.fields.storage.cloudflare.endpoint',
        label: 'R2 endpoint',
        description: 'Endpoint URL for R2 API requests.',
        impact: 'Must match Cloudflare configuration; influences latency.',
      },
      'storage.cloudflare_r2.publicBaseUrl': {
        i18nKey: 'platform.settings.fields.storage.cloudflare.publicBaseUrl',
        label: 'Public base URL',
        description: 'Base URL used when rendering public asset links.',
        impact: 'Used in emails, marketing pages, and API responses referencing hosted media.',
      },
    },
  },
  app: {
    i18nKey: 'platform.settings.sections.app',
    title: 'Application Identity',
    description: 'Brand name, environment tags, and routing URLs shared across clients.',
    impact: 'Used for link generation, telemetry tagging, and outbound messaging copy.',
    fields: {
      'app.name': {
        i18nKey: 'platform.settings.fields.app.name',
        label: 'Application name',
        description: 'Default product name shown across dashboards and communications.',
        impact: 'Appears in headings, notifications, and meta tags.',
      },
      'app.environment': {
        i18nKey: 'platform.settings.fields.app.environment',
        label: 'Environment label',
        description: 'Label indicating which deployment environment the admin is operating in.',
        impact: 'Supports telemetry tagging and environment-aware banners.',
      },
      'app.clientUrl': {
        i18nKey: 'platform.settings.fields.app.clientUrl',
        label: 'Client URL',
        description: 'Primary frontend URL for deep links.',
        impact: 'Feeds email templates and OAuth redirect whitelists.',
      },
      'app.apiUrl': {
        i18nKey: 'platform.settings.fields.app.apiUrl',
        label: 'API URL',
        description: 'Base API URL referenced by automation scripts and webhooks.',
        impact: 'Used when generating system webhooks and CLI instructions.',
      },
    },
  },
  database: {
    i18nKey: 'platform.settings.sections.database',
    title: 'Database Override Settings',
    description: 'Optional overrides for connection metadata when not using a URL.',
    impact: 'Used by runtime diagnostics and dependency guards for self-healing messaging.',
    fields: {
      'database.url': {
        i18nKey: 'platform.settings.fields.database.url',
        label: 'Database URL override',
        description: 'Full connection string if not relying on discrete host credentials.',
        impact: 'Stored encrypted; surfaces only to governance admins.',
        sensitive: true,
      },
      'database.host': {
        i18nKey: 'platform.settings.fields.database.host',
        label: 'Database host override',
        description: 'Hostname or IP when specifying discrete connection parameters.',
        impact: 'Feeds dependency health checks and support diagnostics.',
      },
      'database.port': {
        i18nKey: 'platform.settings.fields.database.port',
        label: 'Database port override',
        description: 'Port number used when specifying discrete connection parameters.',
        impact: 'Ensures dependency health checks connect to the correct port.',
      },
      'database.name': {
        i18nKey: 'platform.settings.fields.database.name',
        label: 'Database name override',
        description: 'Database name when not using a full URL.',
        impact: 'Used for dependency tests and runtime diagnostics.',
      },
      'database.username': {
        i18nKey: 'platform.settings.fields.database.username',
        label: 'Database username override',
        description: 'Username applied when not using a URL credential.',
        impact: 'Required for manual connection overrides.',
      },
      'database.password': {
        i18nKey: 'platform.settings.fields.database.password',
        label: 'Database password override',
        description: 'Password value when discrete credentials are provided.',
        impact: 'Stored encrypted at rest and used for dependency testing.',
        sensitive: true,
      },
    },
  },
  featureToggles: {
    i18nKey: 'platform.settings.sections.featureToggles',
    title: 'Feature Toggles',
    description: 'Global switches for escrow, subscription, and commission features.',
    impact: 'Feeds frontend guards and API policy checks to prevent unsupported workflows from activating.',
    fields: {
      'featureToggles.escrow': {
        i18nKey: 'platform.settings.fields.featureToggles.escrow',
        label: 'Enable escrow',
        description: 'Controls whether escrow workflows are available.',
        impact: 'Disabling removes escrow flows from bookings and treasury dashboards.',
      },
      'featureToggles.subscriptions': {
        i18nKey: 'platform.settings.fields.featureToggles.subscriptions',
        label: 'Enable subscriptions',
        description: 'Controls whether subscription features are available.',
        impact: 'Disabling hides subscription purchase and renewal flows.',
      },
      'featureToggles.commissions': {
        i18nKey: 'platform.settings.fields.featureToggles.commissions',
        label: 'Enable commissions',
        description: 'Controls whether commission workflows are available.',
        impact: 'Disabling removes commission calculations and related UI elements.',
      },
    },
  },
  maintenance: {
    i18nKey: 'platform.settings.sections.maintenance',
    title: 'Maintenance Windows & Messaging',
    description: 'Scheduled downtime windows and support contact details.',
    impact: 'Drives status banners, support prompts, and dependency guard behaviour during incidents.',
    fields: {
      'maintenance.windows': {
        i18nKey: 'platform.settings.fields.maintenance.windows',
        label: 'Maintenance windows',
        description: 'Scheduled maintenance windows with timing and impact notes.',
        impact: 'Displayed in admin dashboards and status messaging.',
      },
      'maintenance.statusPageUrl': {
        i18nKey: 'platform.settings.fields.maintenance.statusPageUrl',
        label: 'Status page URL',
        description: 'Link to the public status page for service updates.',
        impact: 'Shown in downtime notifications and support copy.',
      },
      'maintenance.supportContact': {
        i18nKey: 'platform.settings.fields.maintenance.supportContact',
        label: 'Support contact',
        description: 'Primary contact for maintenance communications.',
        impact: 'Displayed in banners and emergency messaging.',
      },
    },
  },
  homepage: {
    i18nKey: 'platform.settings.sections.homepage',
    title: 'Homepage Marketing Blocks',
    description: 'Announcement bar, hero content, value props, and testimonials for gigvora.com.',
    impact: 'Feeds the marketing site and cached SSR payloads; updates propagate to CDN rebuild tasks.',
    fields: {
      'homepage.announcementBar': {
        i18nKey: 'platform.settings.fields.homepage.announcementBar',
        label: 'Announcement bar',
        description: 'Controls announcement visibility, message, and CTA.',
        impact: 'Displayed on marketing site header for urgent communications.',
      },
      'homepage.hero': {
        i18nKey: 'platform.settings.fields.homepage.hero',
        label: 'Hero section',
        description: 'Headline, subcopy, CTAs, background media, and stats for homepage hero.',
        impact: 'First impression for visitors and influences conversions.',
      },
      'homepage.valueProps': {
        i18nKey: 'platform.settings.fields.homepage.valueProps',
        label: 'Value propositions',
        description: 'Cards describing core value propositions.',
        impact: 'Appears on marketing site; influences product positioning.',
      },
      'homepage.featureSections': {
        i18nKey: 'platform.settings.fields.homepage.featureSections',
        label: 'Feature sections',
        description: 'In-depth feature highlights with media and bullet lists.',
        impact: 'Keeps marketing experiences aligned with current product capabilities.',
      },
      'homepage.testimonials': {
        i18nKey: 'platform.settings.fields.homepage.testimonials',
        label: 'Testimonials',
        description: 'Customer quotes with attribution.',
        impact: 'Used across marketing surfaces and sales collateral.',
      },
      'homepage.faqs': {
        i18nKey: 'platform.settings.fields.homepage.faqs',
        label: 'FAQs',
        description: 'Frequently asked questions shown on the homepage.',
        impact: 'Provides self-serve answers and reduces support requests.',
      },
      'homepage.quickLinks': {
        i18nKey: 'platform.settings.fields.homepage.quickLinks',
        label: 'Quick links',
        description: 'Call-to-action links pinned to the homepage footer.',
        impact: 'Drives navigation to critical conversion funnels.',
      },
      'homepage.seo': {
        i18nKey: 'platform.settings.fields.homepage.seo',
        label: 'SEO metadata',
        description: 'SEO configuration including title, description, keywords, and OpenGraph image.',
        impact: 'Impacts search ranking and social previews.',
      },
    },
  },
  security: {
    i18nKey: 'platform.settings.sections.security',
    title: 'Security Tokens & Rotation Policy',
    description: 'Metrics bearer token and rotation contacts for operational security.',
    impact: 'Used by observability services and on-call notification flows.',
    fields: {
      'security.tokens.metricsBearer': {
        i18nKey: 'platform.settings.fields.security.tokens.metricsBearer',
        label: 'Metrics bearer token',
        description: 'Auth token for protected metrics endpoints.',
        impact: 'Rotations require cache refresh for monitoring agents.',
        sensitive: true,
      },
      'security.tokens.rotatedBy': {
        i18nKey: 'platform.settings.fields.security.tokens.rotatedBy',
        label: 'Token rotated by',
        description: 'User responsible for the last metrics token rotation.',
        impact: 'Provides audit context for rotations.',
      },
      'security.tokens.lastRotatedAt': {
        i18nKey: 'platform.settings.fields.security.tokens.lastRotatedAt',
        label: 'Last rotation timestamp',
        description: 'ISO timestamp when the metrics bearer token last changed.',
        impact: 'Supports rotation cadence enforcement and compliance reporting.',
      },
      'security.rotation.contactEmails': {
        i18nKey: 'platform.settings.fields.security.rotation.contactEmails',
        label: 'Rotation contacts',
        description: 'Contacts notified when rotations are due or overdue.',
        impact: 'Ensures accountable owners receive rotation reminders.',
      },
      'security.rotation.reminderHours': {
        i18nKey: 'platform.settings.fields.security.rotation.reminderHours',
        label: 'Rotation reminder cadence (hours)',
        description: 'Hours between rotation reminders.',
        impact: 'Controls compliance nag cadence to keep credentials fresh.',
      },
    },
  },
};

const DOCUMENTATION = deepFreeze({
  version: SCHEMA_VERSION,
  generatedAt: DOCUMENTATION_GENERATED_AT,
  sections: BASE_SECTIONS,
});

function collectSensitivePaths() {
  const paths = [];
  Object.values(DOCUMENTATION.sections).forEach((section) => {
    if (!section?.fields) return;
    Object.entries(section.fields).forEach(([path, definition]) => {
      if (definition?.sensitive) {
        paths.push(path);
      }
    });
  });
  return paths;
}

const SENSITIVE_PATHS = Object.freeze(collectSensitivePaths());
const SENSITIVE_PATH_SET = new Set(SENSITIVE_PATHS);

export function getPlatformSettingsDocumentation() {
  return clone(DOCUMENTATION);
}

export function getPlatformSettingsMetadata() {
  return {
    version: DOCUMENTATION.version,
    generatedAt: DOCUMENTATION.generatedAt,
    sensitiveFields: [...SENSITIVE_PATHS],
  };
}

export function getPlatformSettingsSectionKeys() {
  return Object.keys(DOCUMENTATION.sections);
}

export function listSensitivePlatformSettingPaths() {
  return [...SENSITIVE_PATHS];
}

export function isSensitivePlatformSetting(path) {
  return SENSITIVE_PATH_SET.has(path);
}

export const PLATFORM_SETTINGS_DOCUMENTATION = DOCUMENTATION;
export const PLATFORM_SETTINGS_SENSITIVE_PATHS = SENSITIVE_PATHS;
export const PLATFORM_SETTINGS_SENSITIVE_PATH_SET = SENSITIVE_PATH_SET;

