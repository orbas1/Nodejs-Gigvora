'use strict';

const localeSeeds = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    region: 'Global',
    coverage: 100,
    status: 'ga',
    supportLead: 'London localisation studio',
    lastUpdated: '2024-05-12T09:00:00Z',
    summary:
      'Editorial canon reviewed quarterly with AI prompts tuned for English-first teams and global partners.',
    direction: 'ltr',
    isDefault: true,
    metadata: { localeCode: 'en-GB', requestPath: '/support/localization' },
  },
  {
    code: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    flag: '🇫🇷',
    region: 'France • Canada • Belgium',
    coverage: 96,
    status: 'ga',
    supportLead: 'Paris localisation squad',
    lastUpdated: '2024-04-22T08:30:00Z',
    summary:
      'Trust, billing, and marketplace surfaces are fully translated with weekly QA on mentorship copy.',
    direction: 'ltr',
    metadata: { localeCode: 'fr-FR', requestPath: '/support/localization/french' },
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    flag: '🇪🇸',
    region: 'Spain • LATAM',
    coverage: 94,
    status: 'ga',
    supportLead: 'Madrid localisation pod',
    lastUpdated: '2024-04-29T10:15:00Z',
    summary:
      'Marketplace, wallet, and mentorship journeys include in-market tone while knowledge base updates ship twice weekly.',
    direction: 'ltr',
    metadata: { localeCode: 'es-ES', requestPath: '/support/localization/spanish' },
  },
  {
    code: 'pt',
    label: 'Portuguese',
    nativeLabel: 'Português',
    flag: '🇵🇹',
    region: 'Portugal • Brazil',
    coverage: 88,
    status: 'beta',
    supportLead: 'Lisbon localisation guild',
    lastUpdated: '2024-04-18T14:45:00Z',
    summary:
      'Core dashboards and billing flows localised; professional services copy is in beta with feedback loops every sprint.',
    direction: 'ltr',
    metadata: { localeCode: 'pt-PT', requestPath: '/support/localization/portuguese' },
  },
  {
    code: 'it',
    label: 'Italian',
    nativeLabel: 'Italiano',
    flag: '🇮🇹',
    region: 'Italy',
    coverage: 86,
    status: 'beta',
    supportLead: 'Milan editorial partners',
    lastUpdated: '2024-04-09T11:20:00Z',
    summary:
      'Navigation, invoicing, and mentorship modules complete; supply-side insights land in May localisation drop.',
    direction: 'ltr',
    metadata: { localeCode: 'it-IT', requestPath: '/support/localization/italian' },
  },
  {
    code: 'de',
    label: 'German',
    nativeLabel: 'Deutsch',
    flag: '🇩🇪',
    region: 'Germany • DACH',
    coverage: 92,
    status: 'ga',
    supportLead: 'Berlin localisation chapter',
    lastUpdated: '2024-04-12T12:25:00Z',
    summary:
      'Enterprise billing, compliance, and analytics dashboards fully reviewed with legal-approved terminology.',
    direction: 'ltr',
    metadata: { localeCode: 'de-DE', requestPath: '/support/localization/german' },
  },
  {
    code: 'pl',
    label: 'Polish',
    nativeLabel: 'Polski',
    flag: '🇵🇱',
    region: 'Poland • CEE',
    coverage: 82,
    status: 'beta',
    supportLead: 'Warsaw partner desk',
    lastUpdated: '2024-03-28T07:00:00Z',
    summary: 'Hiring workflows and compliance rails complete; mentor marketing copy undergoing editorial QA.',
    direction: 'ltr',
    metadata: { localeCode: 'pl-PL', requestPath: '/support/localization/polish' },
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    flag: '🇮🇳',
    region: 'India',
    coverage: 78,
    status: 'preview',
    supportLead: 'Bengaluru enablement hub',
    lastUpdated: '2024-03-18T06:45:00Z',
    summary:
      'Dashboard chrome, jobs, and messaging flows in preview; finance and legal copy due next localisation cycle.',
    direction: 'ltr',
    metadata: { localeCode: 'hi-IN', requestPath: '/support/localization/hindi' },
  },
  {
    code: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    flag: '🇦🇪',
    region: 'MENA',
    coverage: 74,
    status: 'preview',
    supportLead: 'Dubai localisation studio',
    lastUpdated: '2024-03-05T15:10:00Z',
    summary:
      'RTL layout, navigation, and trust centre localised; analytics wording under joint review with compliance leads.',
    direction: 'rtl',
    metadata: { localeCode: 'ar-AE', requestPath: '/support/localization/arabic' },
  },
  {
    code: 'ru',
    label: 'Russian',
    nativeLabel: 'Русский',
    flag: '🇷🇺',
    region: 'Central & Eastern Europe',
    coverage: 81,
    status: 'preview',
    supportLead: 'Tallinn localisation pod',
    lastUpdated: '2024-03-11T09:35:00Z',
    summary:
      'Marketplace and onboarding flows translated; compliance language is in stakeholder review ahead of GA.',
    direction: 'ltr',
    metadata: { localeCode: 'ru-RU', requestPath: '/support/localization/russian' },
  },
];

const personaSeeds = [
  {
    personaKey: 'user',
    label: 'Member workspace',
    icon: 'user-circle',
    tagline: 'Organise personal projects, mentorship, and billing in one hub.',
    focusAreas: ['Workspace', 'Insights'],
    metrics: [
      { label: 'Projects', value: 'In flight', trend: '+3 this week', positive: true },
      { label: 'Inbox', value: 'Synced' },
    ],
    primaryCta: 'Open member hub',
    defaultRoute: '/dashboard/user',
    timelineEnabled: true,
    metadata: { journey: 'member' },
  },
  {
    personaKey: 'founder',
    label: 'Founder HQ',
    icon: 'rocket-launch',
    tagline: 'Raise capital, hire leaders, and review investor dashboards.',
    focusAreas: ['Capital', 'Community'],
    metrics: [
      { label: 'Pipeline', value: 'Active', trend: '5 warm investors', positive: true },
      { label: 'Advisors', value: 'Synced' },
    ],
    primaryCta: 'Review founder workspace',
    defaultRoute: '/dashboard/founder',
    timelineEnabled: true,
    metadata: { journey: 'founder' },
  },
  {
    personaKey: 'freelancer',
    label: 'Freelancer studio',
    icon: 'sparkles',
    tagline: 'Showcase portfolio, respond to briefs, and manage client billing.',
    focusAreas: ['Portfolio', 'Billing'],
    metrics: [
      { label: 'Opportunities', value: 'Curated', trend: '+11 invites', positive: true },
      { label: 'Payments', value: 'Instant' },
    ],
    primaryCta: 'Open freelancer studio',
    defaultRoute: '/dashboard/freelancer',
    timelineEnabled: true,
    metadata: { journey: 'freelancer' },
  },
  {
    personaKey: 'agency',
    label: 'Agency control centre',
    icon: 'building-office',
    tagline: 'Coordinate crews, retainers, and milestone billing for every client.',
    focusAreas: ['Delivery', 'Finance'],
    metrics: [
      { label: 'Clients', value: 'Portfolio', trend: '8 active retainers' },
      { label: 'Utilisation', value: 'Live' },
    ],
    primaryCta: 'Open agency control centre',
    defaultRoute: '/dashboard/agency',
    timelineEnabled: true,
    metadata: { journey: 'agency' },
  },
  {
    personaKey: 'company',
    label: 'Company HQ',
    icon: 'briefcase',
    tagline: 'Govern multi-team programs with hiring, finance, and compliance telemetry.',
    focusAreas: ['Hiring', 'Governance'],
    metrics: [
      { label: 'Seats', value: 'Unlimited' },
      { label: 'Insights', value: 'Executive' },
    ],
    primaryCta: 'Navigate company HQ',
    defaultRoute: '/dashboard/company',
    timelineEnabled: true,
    metadata: { journey: 'company' },
  },
  {
    personaKey: 'headhunter',
    label: 'Search operations',
    icon: 'magnifying-glass-circle',
    tagline: 'Manage candidate pipelines, share slates, and automate status updates.',
    focusAreas: ['Pipeline', 'Analytics'],
    metrics: [
      { label: 'Talent cloud', value: 'Synced', trend: '3 new slates', positive: true },
      { label: 'Reporting', value: 'Live' },
    ],
    primaryCta: 'Enter search operations',
    defaultRoute: '/dashboard/headhunter',
    timelineEnabled: true,
    metadata: { journey: 'headhunter' },
  },
  {
    personaKey: 'mentor',
    label: 'Mentor lounge',
    icon: 'academic-cap',
    tagline: 'Host sessions, track mentee wins, and recommend strategic templates.',
    focusAreas: ['Sessions', 'Playbooks'],
    metrics: [
      { label: 'Programs', value: 'Active' },
      { label: 'Outcomes', value: 'Tracked', trend: '+6 wins', positive: true },
    ],
    primaryCta: 'Visit mentor lounge',
    defaultRoute: '/dashboard/mentor',
    timelineEnabled: true,
    metadata: { journey: 'mentor' },
  },
  {
    personaKey: 'admin',
    label: 'Platform administration',
    icon: 'shield-check',
    tagline: 'Enforce policy, monitor telemetry, and orchestrate platform governance.',
    focusAreas: ['Security', 'Audits'],
    metrics: [
      { label: 'Controls', value: 'Delegated' },
      { label: 'Status', value: 'Realtime' },
    ],
    primaryCta: 'Manage platform admin',
    defaultRoute: '/dashboard/admin',
    timelineEnabled: false,
    metadata: { journey: 'admin' },
  },
];

const chromeConfigs = [
  {
    configKey: 'footer_navigation_sections',
    description: 'Footer navigation groupings for marketing and product hubs.',
    payload: [
      {
        title: 'Platform',
        links: [
          { label: 'Launchpad', to: '/launchpad' },
          { label: 'Jobs marketplace', to: '/jobs' },
          { label: 'Projects workspace', to: '/projects' },
          { label: 'Mentor lounge', to: '/mentors' },
          { label: 'Creator studio', to: '/creation-studio' },
        ],
      },
      {
        title: 'Solutions',
        links: [
          { label: 'Enterprise suite', to: '/solutions/enterprise' },
          { label: 'Agencies', to: '/solutions/agencies' },
          { label: 'Startups', to: '/solutions/startups' },
          { label: 'Universities', to: '/solutions/universities' },
          { label: 'Social impact', to: '/solutions/impact' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Support centre', to: '/support' },
          { label: 'Help library', to: '/resources' },
          { label: 'Community guidelines', to: '/community-guidelines' },
          { label: 'Privacy policy', to: '/privacy' },
          { label: 'Terms & conditions', to: '/terms' },
          { label: 'Refund policy', to: '/refunds' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', to: '/about' },
          { label: 'Careers', to: '/careers' },
          { label: 'Press', to: '/press' },
          { label: 'Trust centre', to: '/trust-center' },
          { label: 'Contact', to: '/support/contact' },
        ],
      },
    ],
  },
  {
    configKey: 'footer_status_highlights',
    description: 'Live status highlights displayed in the shell footer.',
    payload: [
      { id: 'uptime', label: 'Platform', status: 'Operational', detail: '99.99% uptime (30d)', icon: 'signal' },
      { id: 'support', label: 'Support', status: 'Live 24/5', detail: 'Avg response 6 minutes', icon: 'bolt' },
      { id: 'security', label: 'Security', status: 'Shielded', detail: 'SOC 2 • ISO 27001 • GDPR', icon: 'shield-check' },
    ],
  },
  {
    configKey: 'footer_community_programs',
    description: 'Community programmes available for members and partners.',
    payload: [
      { label: 'Creator circles', description: 'Curated peer groups launching monthly', to: '/community/creator-circles' },
      { label: 'Operator forums', description: 'Join live roundtables with mentors', to: '/community/forums' },
      { label: 'Product roadmap', description: 'See what ships next and vote on ideas', to: '/roadmap' },
    ],
  },
  {
    configKey: 'footer_office_locations',
    description: 'Global office hubs surfaced in the footer.',
    payload: ['London', 'Toronto', 'Lisbon', 'Singapore'],
  },
  {
    configKey: 'footer_certifications',
    description: 'Compliance and privacy certifications displayed in the footer.',
    payload: ['SOC 2 Type II', 'ISO 27001', 'GDPR ready', 'UK GDPR'],
  },
  {
    configKey: 'footer_social_links',
    description: 'Primary social channels for Gigvora.',
    payload: [
      { label: 'Follow on X', href: 'https://x.com/gigvora', icon: 'x' },
      { label: 'Follow on Instagram', href: 'https://instagram.com/gigvora', icon: 'instagram' },
      { label: 'Connect on LinkedIn', href: 'https://linkedin.com/company/gigvora', icon: 'linkedin' },
      { label: 'Like on Facebook', href: 'https://facebook.com/gigvora', icon: 'facebook' },
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const timestamp = new Date().toISOString();

    await queryInterface.bulkInsert(
      'navigation_locales',
      localeSeeds.map((locale, index) => ({
        ...locale,
        sortOrder: index,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    );

    await queryInterface.bulkInsert(
      'navigation_personas',
      personaSeeds.map((persona, index) => ({
        ...persona,
        sortOrder: index,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    );

    await queryInterface.bulkInsert(
      'navigation_chrome_configs',
      chromeConfigs.map((config) => ({
        ...config,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('navigation_chrome_configs', null, {});
    await queryInterface.bulkDelete('navigation_personas', null, {});
    await queryInterface.bulkDelete('navigation_locales', null, {});
  },
};
