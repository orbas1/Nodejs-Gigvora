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
  DocumentArrowUpIcon,
  EnvelopeOpenIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export const CREATOR_ROLE_SET = new Set(['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin']);

export function evaluateCreationAccess(session) {
  const ownerId =
    session?.id ??
    session?.userId ??
    session?.user?.id ??
    (typeof session?.ownerId === 'number' || typeof session?.ownerId === 'string' ? session.ownerId : null);
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  const allowedRoles = memberships.filter((role) => CREATOR_ROLE_SET.has(role));
  const hasAccess = Boolean(ownerId) && allowedRoles.length > 0;
  return {
    ownerId,
    memberships,
    allowedRoles,
    hasAccess,
  };
}

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

const DEFAULT_FEATURE_FLAGS = {
  deliverables: true,
  applications: true,
  schedule: true,
  compensation: true,
  packages: true,
  faqs: true,
  heroMedia: true,
  gallery: true,
  experience: true,
  documentOutline: false,
  documentKeywords: false,
  documentHeadline: false,
  attachmentsLabel: 'Asset gallery',
};

function typeFeatures(overrides = {}) {
  return { ...DEFAULT_FEATURE_FLAGS, ...overrides };
}

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
    id: 'cv',
    name: 'CV',
    tagline: 'Craft ATS-ready resumes with reusable story blocks.',
    icon: DocumentArrowUpIcon,
    accent: 'text-slate-700',
    defaults: {
      ...baseDefaults,
      payoutType: 'unpaid',
      applicationType: 'internal',
      metadata: {
        category: 'cv',
        template: 'modern',
        sections: [],
        keywords: [],
        targetRoles: [],
        storyHighlights: [],
        tone: 'professional',
      },
      settings: { workflow: 'cv-document' },
    },
    features: typeFeatures({
      deliverables: false,
      applications: false,
      schedule: false,
      compensation: false,
      packages: false,
      faqs: false,
      heroMedia: false,
      documentOutline: true,
      documentKeywords: true,
      documentHeadline: true,
      attachmentsLabel: 'Supporting materials',
    }),
  },
  {
    id: 'cover_letter',
    name: 'Cover letter',
    tagline: 'Generate tailored introductions for every opportunity.',
    icon: EnvelopeOpenIcon,
    accent: 'text-amber-600',
    defaults: {
      ...baseDefaults,
      payoutType: 'unpaid',
      applicationType: 'internal',
      metadata: {
        category: 'cover_letter',
        template: 'story-led',
        sections: [],
        keywords: [],
        targetRoles: [],
        storyHighlights: [],
        tone: 'confident',
      },
      settings: { workflow: 'cover-letter' },
    },
    features: typeFeatures({
      deliverables: false,
      applications: false,
      schedule: false,
      compensation: false,
      packages: false,
      faqs: false,
      heroMedia: false,
      documentOutline: true,
      documentKeywords: true,
      documentHeadline: true,
      attachmentsLabel: 'Reference links',
    }),
  },
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
    features: typeFeatures(),
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
    features: typeFeatures(),
  },
  {
    id: 'launchpad_job',
    name: 'Experience Launchpad job',
    tagline: 'Invite Launchpad fellows into experiential roles.',
    icon: RocketLaunchIcon,
    accent: 'text-indigo-600',
    defaults: {
      ...baseDefaults,
      payoutType: 'fixed',
      applicationType: 'internal',
      settings: { workflow: 'launchpad-job' },
      metadata: { category: 'launchpad_job', cohort: 'current' },
    },
    features: typeFeatures({ schedule: true, applications: true, compensation: true }),
  },
  {
    id: 'project',
    name: 'Project',
    tagline: 'Spin up a delivery workspace with milestones.',
    icon: DocumentTextIcon,
    accent: 'text-purple-600',
    defaults: {
      ...baseDefaults,
      payoutType: 'fixed',
      format: 'hybrid',
      settings: { workflow: 'project', milestoneTracking: true },
      metadata: { category: 'project', milestoneTemplates: [] },
    },
    features: typeFeatures(),
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
    features: typeFeatures(),
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
    features: typeFeatures({ compensation: false }),
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
    features: typeFeatures({ packages: false }),
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
    features: typeFeatures({ compensation: false }),
  },
  {
    id: 'mentorship',
    name: 'Mentorship offering',
    tagline: 'Package mentoring tracks with billing preferences.',
    icon: AcademicCapIcon,
    accent: 'text-emerald-600',
    defaults: {
      ...baseDefaults,
      format: 'virtual',
      payoutType: 'hourly',
      applicationType: 'gigvora',
      settings: { workflow: 'mentorship', scheduling: 'calendar-sync' },
      metadata: { category: 'mentorship', focusAreas: [], cohortBased: false },
    },
    features: typeFeatures({ schedule: true, compensation: true, packages: true }),
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
    features: typeFeatures({ applications: false, schedule: false, compensation: false }),
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
    features: typeFeatures({ compensation: false, applications: false }),
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
    features: typeFeatures({ packages: false }),
  },
];

export function getTypeConfig(typeId) {
  const type = CREATION_TYPES.find((entry) => entry.id === typeId);
  if (!type) {
    return null;
  }
  return { ...type, features: type.features ?? typeFeatures() };
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
