import {
  SparklesIcon,
  BriefcaseIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  UserGroupIcon,
  PresentationChartBarIcon,
  PencilSquareIcon,
  MegaphoneIcon,
  HeartIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Live' },
  { value: 'archived', label: 'Archive' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'members', label: 'Members' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'public', label: 'Public' },
];

export const FORMAT_OPTIONS = [
  { value: 'async', label: 'Async' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'in_person', label: 'In person' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'flex', label: 'Flex' },
];

export const APPLICATION_OPTIONS = [
  { value: 'gigvora', label: 'Gigvora form' },
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External link' },
  { value: 'email', label: 'Email' },
  { value: 'form', label: 'Custom form' },
];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'expert', label: 'Expert' },
];

export const PAYOUT_OPTIONS = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'stipend', label: 'Stipend' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'equity', label: 'Equity' },
];

export const CURRENCY_OPTIONS = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'SGD',
  'INR',
].map((value) => ({ value, label: value }));

export const ROLE_OPTIONS = [
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'agency', label: 'Agency' },
  { value: 'company', label: 'Company' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'headhunter', label: 'Headhunter' },
  { value: 'user', label: 'Member' },
  { value: 'admin', label: 'Admin' },
];

const baseDefaults = {
  status: 'draft',
  visibility: 'private',
  format: 'async',
  payoutType: 'fixed',
  applicationType: 'gigvora',
  compensationCurrency: 'USD',
  deliverables: [],
  tags: [],
  audienceSegments: [],
  roleAccess: [],
  metadata: {},
  settings: {},
  permissions: [
    { role: 'freelancer', canView: true, canEdit: true, canPublish: true, canManageAssets: true },
    { role: 'admin', canView: true, canEdit: true, canPublish: true, canManageAssets: true },
  ],
  packages: [
    { id: 'basic', name: 'Basic', price: '', deliveryTime: '', features: [] },
    { id: 'standard', name: 'Standard', price: '', deliveryTime: '', features: [] },
    { id: 'premium', name: 'Premium', price: '', deliveryTime: '', features: [] },
  ],
  faqs: [],
  assets: [],
};

export const CREATION_TYPES = [
  {
    id: 'gig',
    name: 'Gig',
    tagline: 'Package a service with 3 tiers like top marketplaces.',
    icon: SparklesIcon,
    accent: 'text-blue-600',
    defaults: {
      ...baseDefaults,
      format: 'async',
      payoutType: 'fixed',
      settings: { workflow: 'gig', fulfillment: 'workspace' },
      metadata: { category: 'gig', packagesEnabled: true },
    },
  },
  {
    id: 'job',
    name: 'Job',
    tagline: 'Post a role with pay and timeline.',
    icon: BriefcaseIcon,
    accent: 'text-emerald-600',
    defaults: {
      ...baseDefaults,
      payoutType: 'fixed',
      applicationType: 'external',
      settings: { workflow: 'job', review: 'talent-team' },
      metadata: { category: 'job' },
    },
  },
  {
    id: 'launchpad_job',
    name: 'Launchpad job',
    tagline: 'Invite Launchpad talent.',
    icon: RocketLaunchIcon,
    accent: 'text-indigo-600',
    defaults: {
      ...baseDefaults,
      payoutType: 'fixed',
      applicationType: 'internal',
      settings: { workflow: 'launchpad-job' },
      metadata: { category: 'launchpad_job', cohort: 'current' },
    },
  },
  {
    id: 'launchpad_project',
    name: 'Project',
    tagline: 'Spin up a Launchpad build.',
    icon: LightBulbIcon,
    accent: 'text-purple-600',
    defaults: {
      ...baseDefaults,
      payoutType: 'fixed',
      applicationType: 'internal',
      settings: { workflow: 'launchpad-project' },
      metadata: { category: 'launchpad_project' },
    },
  },
  {
    id: 'volunteering',
    name: 'Volunteer',
    tagline: 'Post a community help call.',
    icon: HeartIcon,
    accent: 'text-rose-600',
    defaults: {
      ...baseDefaults,
      payoutType: 'unpaid',
      applicationType: 'form',
      settings: { workflow: 'volunteer' },
      metadata: { category: 'volunteering' },
    },
  },
  {
    id: 'networking_session',
    name: 'Session',
    tagline: 'Plan a networking event.',
    icon: UsersIcon,
    accent: 'text-cyan-600',
    defaults: {
      ...baseDefaults,
      format: 'virtual',
      settings: { workflow: 'networking', reminders: ['48h', '2h'] },
      metadata: { category: 'networking' },
    },
  },
  {
    id: 'group',
    name: 'Group',
    tagline: 'Launch a member space.',
    icon: UserGroupIcon,
    accent: 'text-teal-600',
    defaults: {
      ...baseDefaults,
      payoutType: 'unpaid',
      settings: { workflow: 'group', moderation: 'community-manager' },
      metadata: { category: 'community' },
    },
  },
  {
    id: 'page',
    name: 'Page',
    tagline: 'Publish a landing page.',
    icon: PresentationChartBarIcon,
    accent: 'text-sky-600',
    defaults: {
      ...baseDefaults,
      settings: { workflow: 'page' },
      metadata: { category: 'page' },
    },
  },
  {
    id: 'blog_post',
    name: 'Blog',
    tagline: 'Ship a blog update.',
    icon: PencilSquareIcon,
    accent: 'text-orange-600',
    defaults: {
      ...baseDefaults,
      format: 'async',
      payoutType: 'unpaid',
      settings: { workflow: 'editorial' },
      metadata: { category: 'blog' },
    },
  },
  {
    id: 'ad',
    name: 'Ad',
    tagline: 'Launch a Gigvora ad buy.',
    icon: MegaphoneIcon,
    accent: 'text-fuchsia-600',
    defaults: {
      ...baseDefaults,
      format: 'async',
      payoutType: 'fixed',
      settings: { workflow: 'ads', review: 'marketing' },
      metadata: { category: 'ad' },
    },
  },
];

export function getTypeConfig(typeId) {
  return CREATION_TYPES.find((type) => type.id === typeId) ?? null;
}

export function buildInitialItem(typeId, ownerId, overrides = {}) {
  const type = getTypeConfig(typeId);
  const base = {
    ...baseDefaults,
    ...type?.defaults,
  };

  const packages = overrides.packages ?? base.packages.map((pkg) => ({ ...pkg }));
  const faqs = overrides.faqs ?? [...(base.faqs ?? [])];
  const metadata = {
    ...(base.metadata ?? {}),
    ...(overrides.metadata ?? {}),
  };
  if (packages && metadata) {
    metadata.packages = packages;
  }
  if (faqs && metadata) {
    metadata.faqs = faqs;
  }

  return {
    ownerId: ownerId ?? overrides.ownerId ?? null,
    type: typeId,
    title: '',
    summary: '',
    description: '',
    slug: '',
    status: base.status,
    visibility: base.visibility,
    format: base.format,
    payoutType: base.payoutType,
    applicationType: base.applicationType,
    compensationCurrency: base.compensationCurrency,
    deliverables: [...(base.deliverables ?? [])],
    tags: [...(base.tags ?? [])],
    audienceSegments: [...(base.audienceSegments ?? [])],
    roleAccess: [...(base.roleAccess ?? [])],
    metadata,
    settings: { ...(base.settings ?? {}) },
    permissions: overrides.permissions ?? base.permissions.map((permission) => ({ ...permission })),
    applicationUrl: '',
    applicationInstructions: '',
    applicationDeadline: null,
    startAt: null,
    endAt: null,
    scheduledAt: null,
    heroImageUrl: '',
    heroVideoUrl: '',
    thumbnailUrl: '',
    locationLabel: '',
    locationDetails: {},
    experienceLevel: '',
    commitmentHours: '',
    compensationMin: '',
    compensationMax: '',
    ctaLabel: '',
    ctaUrl: '',
    packages,
    faqs,
    assets: overrides.assets ?? [],
  };
}

export function extractPackages(metadata) {
  if (!metadata) {
    return baseDefaults.packages.map((pkg) => ({ ...pkg }));
  }
  const packages = metadata.packages ?? metadata.pricing ?? null;
  if (!packages || !Array.isArray(packages)) {
    return baseDefaults.packages.map((pkg) => ({ ...pkg }));
  }
  return packages.map((pkg, index) => ({
    id: pkg.id ?? baseDefaults.packages[index]?.id ?? `tier-${index + 1}`,
    name: pkg.name ?? baseDefaults.packages[index]?.name ?? `Tier ${index + 1}`,
    price: pkg.price ?? '',
    deliveryTime: pkg.deliveryTime ?? '',
    features: Array.isArray(pkg.features) ? pkg.features : [],
  }));
}

export function extractFaqs(metadata) {
  if (!metadata || !Array.isArray(metadata.faqs)) {
    return [];
  }
  return metadata.faqs.map((faq, index) => ({
    id: faq.id ?? `faq-${index + 1}`,
    question: faq.question ?? '',
    answer: faq.answer ?? '',
  }));
}
