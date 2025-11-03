import { freezeDeep } from '../utils/freezeDeep.js';

export const PROFILE_BLUEPRINT_VERSION = '2025.06';
export const DEFAULT_PROFILE_BLUEPRINT_ID = 'professional_profile';

const UNIVERSAL_NAV_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'portfolio', label: 'Portfolio & Posts' },
  { id: 'services', label: 'Services & Jobs' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'network', label: 'Network' },
  { id: 'about', label: 'About' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'activity', label: 'Activity' },
];

const UNIVERSAL_TOP_BAR = {
  sticky: true,
  fields: [
    { id: 'avatar', label: 'Avatar / Logo', type: 'image' },
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'headline', label: 'Primary role / headline', type: 'text' },
    { id: 'location', label: 'Country', type: 'location' },
    { id: 'timezone', label: 'Timezone', type: 'text' },
    {
      id: 'status',
      label: 'Status',
      type: 'status-pill',
      options: ['Available', 'Hiring', 'Actively looking'],
    },
  ],
  actionBar: [
    { id: 'message', label: 'Message', intent: 'primary' },
    { id: 'hire', label: 'Hire / Invite', intent: 'primary' },
    { id: 'follow', label: 'Follow', intent: 'neutral' },
    { id: 'save', label: 'Save', intent: 'neutral' },
    { id: 'share', label: 'Share', intent: 'ghost' },
    { id: 'report', label: 'Report', intent: 'ghost' },
  ],
  meta: {
    verifications: ['Email', 'Phone', 'KYC', 'Company registration', 'VAT'],
    trustSignals: ['Ratings', 'Reviews', 'On-platform tenure', 'Completion rate', 'Response time'],
  },
};

const UNIVERSAL_RIGHT_RAIL = [
  { id: 'followers', label: 'Followers & Following' },
  { id: 'availability', label: 'Availability calendar' },
  { id: 'quick-brief', label: 'Quick brief form' },
  { id: 'suggested', label: 'Suggested profiles / companies' },
  { id: 'safety', label: 'Safety tips' },
  { id: 'escrow', label: 'Escrow summary' },
  { id: 'compliance', label: 'Compliance badges' },
  { id: 'ad-slot', label: 'Sponsored slot' },
];

const UNIVERSAL_FOOTER = {
  ctas: [
    { id: 'invite', label: 'Invite to project' },
    { id: 'post-job', label: 'Post a job' },
    { id: 'create-service', label: 'Create a service' },
    { id: 'report', label: 'Report profile' },
  ],
};

const userProfileBlueprint = {
  id: 'user_profile',
  slug: 'user-profile',
  type: 'user',
  label: 'User profile blueprint',
  persona: {
    primary: 'User',
    archetypes: ['Client', 'Buyer', 'Job seeker'],
    statuses: ['Hiring now', 'Actively applying', 'Browsing'],
  },
  hero: {
    banner: true,
    fields: ['name', 'headline', 'location', 'timezone', 'languages', 'budgetRange', 'availability'],
    primaryCtas: ['Post a job', 'Invite to brief', 'Message'],
    seekerCtas: ['Invite me', 'Refer me', 'Download CV'],
  },
  topBar: {
    ...UNIVERSAL_TOP_BAR,
    meta: {
      ...UNIVERSAL_TOP_BAR.meta,
      tenureLabel: 'Member since',
      completionLabel: 'Profile completion',
      responseLabel: 'Avg. response time',
    },
  },
  navigation: [...UNIVERSAL_NAV_TABS],
  layout: {
    variant: 'two-column',
    columns: {
      left: ['about', 'highlights', 'links', 'credentials', 'work-history', 'case-studies'],
      center: ['briefs', 'saved-lists', 'activity', 'references'],
      right: UNIVERSAL_RIGHT_RAIL.map((widget) => widget.id),
    },
    containerWidth: 1200,
  },
  modules: {
    about: { id: 'about', label: 'About', type: 'long-form', limit: 2500 },
    highlights: { id: 'highlights', label: 'Highlights', type: 'chips', limit: 12 },
    links: { id: 'links', label: 'Links', items: ['Website', 'LinkedIn', 'GitHub', 'Portfolio'] },
    credentials: { id: 'credentials', label: 'Credentials', fields: ['Education', 'Certifications', 'Licenses'] },
    'work-history': { id: 'work-history', label: 'Work history', style: 'timeline' },
    'case-studies': { id: 'case-studies', label: 'Case studies / Projects', style: 'cards' },
    briefs: {
      id: 'briefs',
      label: 'Hiring needs / Open briefs',
      fields: ['Role', 'Budget', 'Timeline', 'Location', 'Tagged skills'],
    },
    'saved-lists': { id: 'saved-lists', label: 'Saved services / Shortlists', visibility: 'optional' },
    activity: { id: 'activity', label: 'Posts & Activity feed' },
    references: { id: 'references', label: 'References', type: 'testimonials' },
    availability: { id: 'availability', label: 'Availability calendar' },
    'quick-brief': {
      id: 'quick-brief',
      label: 'Quick brief form',
      fields: ['Title', 'Budget', 'Deadline', 'Required skills'],
    },
    followers: { id: 'followers', label: 'Followers & Following' },
    suggestions: { id: 'suggestions', label: 'Suggested professionals', source: 'recommendations' },
    metrics: {
      id: 'metrics',
      label: 'Metrics',
      fields: ['Spend', 'Hire count', 'Time-to-hire', 'Response rate', 'Applications', 'Interview rate'],
    },
    ads: { id: 'ad-slot', label: 'Sponsored placement', variants: ['hero', 'right-rail', 'in-feed'] },
    safety: { id: 'safety', label: 'Safety tips' },
    escrow: { id: 'escrow', label: 'Escrow summary' },
    compliance: { id: 'compliance', label: 'Compliance badges' },
  },
  contexts: {
    public: {
      label: 'Public view',
      description: 'Visitors without an account see a read-only marketing surface.',
      columns: {
        left: ['about', 'highlights', 'links', 'case-studies'],
        center: ['briefs', 'activity', 'references'],
        right: ['availability', 'suggestions', 'safety', 'ad-slot'],
      },
      ctas: ['Invite to project', 'Share profile'],
      visibility: { hiddenModules: ['saved-lists', 'followers', 'quick-brief', 'escrow', 'compliance'] },
    },
    authenticated: {
      label: 'Authenticated viewer',
      description: 'Logged-in members can see additional intent and collaboration modules.',
      columns: {
        left: ['about', 'highlights', 'links', 'credentials', 'work-history', 'case-studies'],
        center: ['briefs', 'saved-lists', 'activity', 'references'],
        right: ['followers', 'quick-brief', 'availability', 'suggestions', 'escrow', 'compliance', 'ad-slot'],
      },
      ctas: ['Message', 'Follow', 'Invite to brief', 'Refer'],
      personalization: {
        recommendations: ['professionals', 'companies', 'groups'],
      },
    },
    owner: {
      label: 'Owner workspace',
      description: 'Profile owners unlock editing tools, analytics, and privacy controls.',
      columns: {
        left: ['about', 'highlights', 'links', 'credentials', 'work-history', 'case-studies'],
        center: ['briefs', 'saved-lists', 'activity', 'references', 'metrics'],
        right: ['followers', 'quick-brief', 'availability', 'suggestions', 'escrow', 'compliance'],
      },
      ctas: ['Edit profile', 'Manage visibility', 'Export CV'],
      management: {
        visibilityToggles: ['about', 'work-history', 'case-studies', 'saved-lists', 'references'],
        exports: ['Resume (PDF)', 'vCard'],
        analytics: ['Profile views', 'Brief conversions', 'Follower growth'],
      },
    },
  },
  recommendations: {
    order: ['professionals', 'services', 'companies', 'groups'],
    diversityRules: { maxPerEntity: 2, blendNewVsKnown: '70/30' },
  },
  seo: {
    schema: ['Person'],
    vanityPrefix: '/u/',
    openGraph: { type: 'profile', image: 'heroImageUrl' },
  },
  footer: UNIVERSAL_FOOTER,
};

const professionalProfileBlueprint = {
  id: 'professional_profile',
  slug: 'professional-profile',
  type: 'professional',
  label: 'Professional profile blueprint',
  persona: {
    primary: 'Professional',
    archetypes: ['Mentor', 'Gig seller', 'Freelancer', 'Headhunter'],
    statuses: ['Open to work', 'Booked', 'Mentor availability'],
  },
  hero: {
    banner: true,
    roleBadges: ['Mentor', 'Freelancer', 'Headhunter'],
    fields: ['name', 'headline', 'location', 'timezone', 'languages', 'rate', 'availability'],
    scorecards: ['Rating', 'Jobs completed', 'On-time %', 'Repeat clients %', 'Response time'],
    primaryCtas: ['Hire', 'Book a call', 'Request quote', 'Save'],
  },
  topBar: {
    ...UNIVERSAL_TOP_BAR,
    meta: {
      ...UNIVERSAL_TOP_BAR.meta,
      trustBadges: ['Top Rated', 'Rising Talent', 'Mentor+', 'Background-checked', 'Verified Expert'],
    },
  },
  navigation: [
    ...UNIVERSAL_NAV_TABS,
    { id: 'packages', label: 'Packages' },
    { id: 'mentorship', label: 'Mentorship' },
  ],
  layout: {
    variant: 'three-column',
    columns: {
      left: ['about', 'skills', 'tech-stack', 'portfolio', 'certifications', 'employment', 'thought-leadership'],
      center: ['services', 'packages', 'mentorship', 'headhunter', 'reviews', 'activity', 'ads-in-feed'],
      right: ['followers', 'instant-quote', 'availability', 'suggested-jobs', 'safety', 'escrow', 'ad-rail'],
    },
    containerWidth: 1200,
  },
  modules: {
    about: { id: 'about', label: 'About / Bio', type: 'long-form', limit: 2500 },
    skills: { id: 'skills', label: 'Highlighted skills', type: 'chips', limit: 5 },
    'tech-stack': { id: 'tech-stack', label: 'Tech stack', type: 'icons' },
    portfolio: { id: 'portfolio', label: 'Portfolio / Case studies', style: 'cards', metrics: true },
    certifications: { id: 'certifications', label: 'Certifications & qualifications' },
    employment: { id: 'employment', label: 'Employment & engagements', style: 'timeline' },
    'thought-leadership': { id: 'thought-leadership', label: 'Thought leadership', sources: ['Posts', 'Talks', 'Open-source'] },
    services: {
      id: 'services',
      label: 'Services / Gigs',
      layout: 'grid',
      tiers: ['Basic', 'Standard', 'Premium'],
      fields: ['Title', 'Promise', 'Price tiers', 'Deliverables', 'Revisions', 'ETA', 'Add-ons'],
      liveAvailability: true,
    },
    packages: {
      id: 'packages',
      label: 'Packages',
      description: 'Recurring work / retainers',
    },
    mentorship: {
      id: 'mentorship',
      label: 'Mentorship sessions',
      fields: ['Session types', 'Curriculum outline', 'Outcomes'],
    },
    headhunter: {
      id: 'headhunter',
      label: 'Headhunter playbooks',
      fields: ['Talent pool tags', 'Fee model', 'Terms & conditions'],
    },
    reviews: {
      id: 'reviews',
      label: 'Reviews & Testimonials',
      filters: ['All', 'By service'],
    },
    activity: { id: 'activity', label: 'Activity feed', adSlotFrequency: 6 },
    'instant-quote': { id: 'instant-quote', label: 'Instant quote', fields: ['Scope', 'Budget', 'Timeline'] },
    availability: { id: 'availability', label: 'Availability calendar / Booking' },
    followers: { id: 'followers', label: 'Followers & Following', placement: 'right-rail' },
    'suggested-jobs': { id: 'suggested-jobs', label: 'Suggested jobs & briefs', source: 'matching-briefs' },
    safety: { id: 'safety', label: 'Safety & Compliance badges' },
    escrow: { id: 'escrow', label: 'Escrow-enabled status' },
    'ad-rail': { id: 'ad-rail', label: 'Right rail ad slot', size: '300x250' },
    'ads-in-feed': { id: 'ads-in-feed', label: 'In-feed sponsored placement', cadence: 'every-6' },
    metrics: {
      id: 'metrics',
      label: 'Performance metrics',
      fields: ['Revenue bands', 'Job success', 'Dispute rate', 'Cancellation rate'],
      badges: ['Top Rated', 'Rising Talent'],
      visibility: 'owner-only',
    },
  },
  contexts: {
    public: {
      label: 'Public view',
      description: 'Showcases value proposition and proof without sensitive data.',
      columns: {
        left: ['about', 'skills', 'tech-stack', 'portfolio'],
        center: ['services', 'reviews', 'activity'],
        right: ['followers', 'availability', 'suggested-jobs', 'safety', 'ad-rail'],
      },
      ctas: ['Hire', 'Book a call', 'Share'],
      visibility: { hiddenModules: ['packages', 'mentorship', 'headhunter', 'instant-quote', 'followers', 'escrow'] },
    },
    authenticated: {
      label: 'Authenticated viewer',
      description: 'Logged-in clients can request quotes, view availability, and follow.',
      columns: {
        left: ['about', 'skills', 'tech-stack', 'portfolio', 'certifications', 'employment', 'thought-leadership'],
        center: ['services', 'packages', 'mentorship', 'reviews', 'activity'],
        right: ['followers', 'instant-quote', 'availability', 'suggested-jobs', 'safety', 'escrow', 'ad-rail'],
      },
      ctas: ['Hire', 'Request quote', 'Save', 'Follow'],
      personalization: { recommendations: ['jobs', 'clients', 'mentors', 'groups'] },
    },
    owner: {
      label: 'Owner workspace',
      description: 'Unlocks monetisation controls, pricing, analytics, and compliance.',
      columns: {
        left: ['about', 'skills', 'tech-stack', 'portfolio', 'certifications', 'employment', 'thought-leadership'],
        center: ['services', 'packages', 'mentorship', 'headhunter', 'reviews', 'activity', 'metrics'],
        right: ['followers', 'instant-quote', 'availability', 'suggested-jobs', 'safety', 'escrow'],
      },
      ctas: ['Edit services', 'Manage availability', 'Update pricing'],
      management: {
        monetisation: ['Add-ons', 'Expedited delivery', 'Mentorship pricing'],
        compliance: ['KYC', 'NDA templates', 'Escrow toggle'],
        analytics: ['Conversion rate by CTA', 'Repeat clients %', 'Revenue trends'],
      },
    },
  },
  recommendations: {
    order: ['services', 'similar-professionals', 'mentors', 'companies'],
    rules: { avoidCompetitorAds: true, freshnessWindowDays: 30 },
  },
  seo: {
    schema: ['Person', 'Product'],
    vanityPrefix: '/pro/',
    openGraph: { type: 'profile', image: 'heroImageUrl' },
  },
  footer: UNIVERSAL_FOOTER,
};

const companyProfileBlueprint = {
  id: 'company_profile',
  slug: 'company-profile',
  type: 'company',
  label: 'Company profile blueprint',
  persona: {
    primary: 'Company',
    archetypes: ['Agency', 'Company', 'Recruiter'],
    statuses: ['Hiring now', 'Open to clients', 'Accepting partnerships'],
  },
  hero: {
    banner: true,
    fields: ['companyName', 'tagline', 'locations', 'timezones', 'teamSize', 'foundedYear', 'companyType', 'status'],
    primaryCtas: ['Post a job', 'Invite to pitch', 'Follow', 'Contact'],
  },
  topBar: {
    ...UNIVERSAL_TOP_BAR,
    fields: [
      { id: 'logo', label: 'Logo', type: 'image' },
      { id: 'companyName', label: 'Company name', type: 'text' },
      { id: 'tagline', label: 'Tagline', type: 'text' },
      { id: 'locations', label: 'Locations', type: 'location-list' },
      { id: 'timezones', label: 'Timezones', type: 'text' },
      { id: 'status', label: 'Status', type: 'status-pill', options: ['Hiring now', 'Open to clients', 'Accepting partnerships'] },
    ],
    meta: {
      ...UNIVERSAL_TOP_BAR.meta,
      complianceBadges: ['Company registration', 'VAT', 'KYC/KYB'],
    },
  },
  navigation: [
    ...UNIVERSAL_NAV_TABS,
    { id: 'policies', label: 'Policies & Terms' },
    { id: 'team', label: 'Team' },
  ],
  layout: {
    variant: 'three-column',
    columns: {
      left: ['about', 'showreel', 'clients', 'awards', 'policies', 'team'],
      center: ['open-jobs', 'services', 'talent-pools', 'posts', 'reviews'],
      right: ['followers', 'rfp', 'book-demo', 'compliance', 'suggested-professionals', 'safety', 'ad-rail'],
    },
    containerWidth: 1200,
  },
  modules: {
    about: { id: 'about', label: 'About', type: 'long-form' },
    showreel: { id: 'showreel', label: 'Showreel / Case studies', style: 'carousel' },
    clients: { id: 'clients', label: 'Clients & logos', visibility: 'permission' },
    awards: { id: 'awards', label: 'Awards & certifications' },
    policies: {
      id: 'policies',
      label: 'Policies',
      categories: ['DEI', 'Remote', 'Data protection', 'Security'],
    },
    team: { id: 'team', label: 'Team', description: 'Key people, recruiters, mentors' },
    'open-jobs': {
      id: 'open-jobs',
      label: 'Open jobs',
      style: 'list',
      fields: ['Title', 'Level', 'Salary band', 'Location', 'Skills', 'Apply CTA'],
    },
    services: {
      id: 'services',
      label: 'Services',
      description: 'Packaged offerings with SLAs, retainers, pricing models',
    },
    'talent-pools': {
      id: 'talent-pools',
      label: 'Talent pools',
      fields: ['Niches', 'Roles', 'Time-to-shortlist', 'Fee structures'],
    },
    posts: { id: 'posts', label: 'Posts / Updates' },
    reviews: { id: 'reviews', label: 'Reviews from clients & talent' },
    rfp: {
      id: 'rfp',
      label: 'Quick RFP / Brief form',
      fields: ['Project title', 'Budget', 'Timeline', 'Scope'],
    },
    'book-demo': { id: 'book-demo', label: 'Book a call / demo', type: 'scheduler' },
    compliance: {
      id: 'compliance',
      label: 'Compliance & registration',
      fields: ['Company reg no.', 'VAT', 'KYC'],
    },
    followers: { id: 'followers', label: 'Followers & Following' },
    'suggested-professionals': {
      id: 'suggested-professionals',
      label: 'Suggested professionals',
      source: 'recommendations',
    },
    safety: { id: 'safety', label: 'Safety tips' },
    'ad-rail': { id: 'ad-rail', label: 'Right rail ad slot', size: '300x250', targeting: 'tooling/education' },
    metrics: {
      id: 'metrics',
      label: 'Metrics & signals',
      fields: ['Time-to-hire', 'Offer accept rate', 'Retention', 'Diversity metrics', 'Delivery SLA', 'Client NPS'],
    },
  },
  contexts: {
    public: {
      label: 'Public view',
      description: 'Marketing surface showcasing employer brand and offering.',
      columns: {
        left: ['about', 'showreel', 'clients', 'awards'],
        center: ['open-jobs', 'posts', 'reviews'],
        right: ['book-demo', 'suggested-professionals', 'safety', 'ad-rail'],
      },
      ctas: ['Follow', 'Share', 'Apply'],
      visibility: { hiddenModules: ['talent-pools', 'rfp', 'compliance', 'followers'] },
    },
    authenticated: {
      label: 'Authenticated viewer',
      description: 'Members can access RFP intake, compliance, and suggested collaborators.',
      columns: {
        left: ['about', 'showreel', 'clients', 'awards', 'policies', 'team'],
        center: ['open-jobs', 'services', 'talent-pools', 'posts', 'reviews'],
        right: ['followers', 'rfp', 'book-demo', 'compliance', 'suggested-professionals', 'safety', 'ad-rail'],
      },
      ctas: ['Apply now', 'Submit RFP', 'Follow'],
      personalization: { recommendations: ['professionals', 'agencies', 'mentors'] },
    },
    owner: {
      label: 'Owner workspace',
      description: 'Company managers control hiring funnels, services, and analytics.',
      columns: {
        left: ['about', 'showreel', 'clients', 'awards', 'policies', 'team'],
        center: ['open-jobs', 'services', 'talent-pools', 'posts', 'reviews', 'metrics'],
        right: ['followers', 'rfp', 'book-demo', 'compliance', 'suggested-professionals', 'safety'],
      },
      ctas: ['Post job', 'Invite to pitch', 'Manage policies'],
      management: {
        compliance: ['KYC/KYB renewal', 'Escrow providers', 'NDA templates'],
        analytics: ['Conversion by CTA', 'Candidate pipeline health', 'Client NPS'],
        visibility: ['Open jobs', 'Talent pools', 'Reviews'],
      },
    },
  },
  recommendations: {
    order: ['professionals', 'talent-pools', 'partner-agencies', 'mentors'],
    rules: { avoidCompetitorAds: true, sponsorCap: 0.1 },
  },
  seo: {
    schema: ['Organization', 'JobPosting'],
    vanityPrefix: '/c/',
    openGraph: { type: 'company', image: 'heroImageUrl' },
  },
  footer: {
    ...UNIVERSAL_FOOTER,
    ctas: [
      { id: 'apply', label: 'Apply now' },
      { id: 'submit-rfp', label: 'Submit RFP' },
      { id: 'book-demo', label: 'Book demo' },
      { id: 'report', label: 'Report profile' },
    ],
  },
};

const eventProfileBlueprint = {
  id: 'event_profile',
  slug: 'event-profile',
  type: 'event',
  label: 'Event profile blueprint',
  persona: {
    primary: 'Event',
    archetypes: ['Conference', 'Workshop', 'Webinar', 'Community meetup'],
    statuses: ['Upcoming', 'Live', 'Completed'],
  },
  hero: {
    banner: true,
    eventBadge: ['Online', 'In-person', 'Hybrid'],
    fields: ['title', 'tagline', 'start', 'end', 'timezone', 'location', 'mode'],
    countdown: true,
    hostCard: true,
    primaryCtas: ['RSVP', 'Get ticket', 'Add to calendar', 'Share'],
  },
  navigation: [
    { id: 'overview', label: 'Overview' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'speakers', label: 'Speakers' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'updates', label: 'Updates' },
    { id: 'resources', label: 'Resources' },
    { id: 'attendees', label: 'Attendees' },
    { id: 'policies', label: 'Policies' },
  ],
  layout: {
    variant: 'three-column',
    columns: {
      left: ['overview', 'speakers', 'sponsors', 'policies'],
      center: ['agenda', 'tickets', 'updates', 'resources', 'attendees'],
      right: ['countdown', 'calendar-widget', 'host', 'host-events', 'recommended-events', 'ad-rail'],
    },
    containerWidth: 1200,
  },
  modules: {
    overview: { id: 'overview', label: 'Overview', type: 'rich-text', bullets: true },
    agenda: {
      id: 'agenda',
      label: 'Agenda / Schedule',
      type: 'agenda-grid',
      options: { timezoneSwitcher: true, multiTrack: true },
    },
    speakers: {
      id: 'speakers',
      label: 'Speakers',
      type: 'cards',
      fields: ['Name', 'Bio', 'Links'],
      linkToProfiles: true,
    },
    tickets: {
      id: 'tickets',
      label: 'Tickets',
      type: 'tiers',
      fields: ['Name', 'Price', 'Capacity', 'Waitlist', 'Refund policy'],
      promoCodes: true,
    },
    sponsors: {
      id: 'sponsors',
      label: 'Sponsors & Partners',
      type: 'logo-wall',
      tiers: ['Title', 'Gold', 'Silver', 'Community'],
    },
    updates: {
      id: 'updates',
      label: 'Updates & Announcements',
      type: 'feed',
      stickyFaq: true,
    },
    resources: {
      id: 'resources',
      label: 'Resources',
      type: 'resource-library',
      supportsPostEventContent: true,
    },
    attendees: {
      id: 'attendees',
      label: 'Attendees',
      type: 'avatars',
      privacy: 'opt-in',
    },
    policies: {
      id: 'policies',
      label: 'Policies',
      type: 'policy-list',
      categories: ['Code of conduct', 'Accessibility', 'Photo & recording', 'Refunds'],
    },
    faq: {
      id: 'faq',
      label: 'FAQ',
      type: 'accordion',
    },
    host: {
      id: 'host',
      label: 'Host',
      type: 'entity-card',
      links: ['profiles', 'pages'],
    },
    'calendar-widget': {
      id: 'calendar-widget',
      label: 'Calendar widget',
      type: 'calendar-links',
      exports: ['Google', 'Outlook', 'ICS'],
    },
    countdown: {
      id: 'countdown',
      label: 'Countdown',
      type: 'countdown',
    },
    'host-events': {
      id: 'host-events',
      label: "Host's other events",
      source: 'host-catalogue',
    },
    'recommended-events': {
      id: 'recommended-events',
      label: 'Recommended events',
      source: 'recommendations',
    },
    'ad-rail': {
      id: 'ad-rail',
      label: 'Right rail ad slot',
      size: '300x250',
      targeting: 'topic-aligned',
    },
    analytics: {
      id: 'analytics',
      label: 'Analytics',
      fields: ['Impressions', 'RSVPs', 'Check-ins', 'Replays', 'Ticket sales'],
      visibility: 'host-only',
    },
    'post-event': {
      id: 'post-event',
      label: 'Post-event recap',
      type: 'summary',
      actions: ['Share recordings', 'Send survey'],
    },
    'live-tools': {
      id: 'live-tools',
      label: 'Live mode tools',
      type: 'live-controls',
      features: ['Stream embed', 'Q&A', 'Polls', 'Chat'],
      visibility: 'host-only',
    },
    'check-in': {
      id: 'check-in',
      label: 'Check-in manager',
      type: 'attendance',
      visibility: 'host-only',
    },
  },
  contexts: {
    public: {
      label: 'Public landing',
      description: 'Anyone can preview the event details and purchase tickets.',
      columns: {
        left: ['overview', 'speakers', 'sponsors'],
        center: ['agenda', 'tickets', 'updates', 'resources'],
        right: ['countdown', 'calendar-widget', 'host', 'host-events', 'recommended-events', 'ad-rail'],
      },
      ctas: ['RSVP', 'Get ticket', 'Share'],
      visibility: { hiddenModules: ['attendees', 'analytics', 'post-event', 'live-tools', 'check-in'] },
    },
    authenticated: {
      label: 'Member view',
      description: 'Logged-in members unlock attendee roster and host context.',
      columns: {
        left: ['overview', 'speakers', 'policies'],
        center: ['agenda', 'tickets', 'updates', 'resources', 'attendees'],
        right: ['countdown', 'calendar-widget', 'host', 'host-events', 'recommended-events', 'ad-rail'],
      },
      ctas: ['RSVP', 'Add to calendar', 'Invite a colleague'],
      states: { rsvp: ['Going', 'Interested', 'Waitlist'] },
    },
    host: {
      label: 'Host workspace',
      description: 'Hosts manage tickets, live tools, and post-event workflows.',
      columns: {
        left: ['overview', 'speakers', 'policies', 'resources'],
        center: ['agenda', 'tickets', 'updates', 'attendees', 'post-event', 'analytics'],
        right: ['countdown', 'calendar-widget', 'host', 'host-events', 'live-tools', 'check-in', 'ad-rail'],
      },
      ctas: ['Edit event', 'Launch live mode', 'Export attendees'],
      management: {
        permissions: ['Host', 'Co-host', 'Staff', 'Speaker', 'Attendee'],
        workflows: ['Ticket issuance', 'Promo codes', 'Post-event survey'],
      },
    },
  },
  recommendations: {
    order: ['recommended-events', 'host-events', 'groups', 'pages'],
    hostEvents: true,
  },
  seo: {
    schema: ['Event'],
    vanityPrefix: '/events/',
    openGraph: { type: 'event', image: 'heroImageUrl' },
  },
  analytics: ['RSVP funnel', 'Ticket revenue', 'Attendance', 'Replay engagement'],
  notifications: ['RSVP confirmation', 'Reminder 24h', 'Reminder 1h', 'Last-minute changes'],
  footer: {
    ctas: [
      { id: 'rsvp', label: 'RSVP' },
      { id: 'get-ticket', label: 'Get ticket' },
      { id: 'share', label: 'Share event' },
      { id: 'report', label: 'Report event' },
    ],
  },
};

const groupProfileBlueprint = {
  id: 'group_profile',
  slug: 'group-profile',
  type: 'group',
  label: 'Group profile blueprint',
  persona: {
    primary: 'Group',
    archetypes: ['Public community', 'Private cohort', 'Invite-only guild'],
    statuses: ['Open', 'Request to join', 'Closed'],
  },
  hero: {
    banner: true,
    groupBadge: ['Public', 'Private', 'Invite-only'],
    fields: ['name', 'tagline', 'memberCount', 'topics', 'owner'],
    primaryCtas: ['Join', 'Request to join', 'Invite', 'Share'],
  },
  navigation: [
    { id: 'feed', label: 'Feed' },
    { id: 'about', label: 'About' },
    { id: 'members', label: 'Members' },
    { id: 'rules', label: 'Rules' },
    { id: 'files', label: 'Files' },
    { id: 'events', label: 'Events' },
  ],
  layout: {
    variant: 'three-column',
    columns: {
      left: ['about', 'rules', 'files'],
      center: ['feed', 'events', 'announcements'],
      right: ['join-bar', 'suggested-members', 'recommended-groups', 'ad-rail'],
    },
    containerWidth: 1200,
  },
  modules: {
    feed: {
      id: 'feed',
      label: 'Group feed',
      type: 'feed',
      supports: ['Posts', 'Polls', 'Jobs', 'Gigs'],
    },
    about: {
      id: 'about',
      label: 'About',
      type: 'rich-text',
      fields: ['Description', 'Topics', 'Locations', 'Languages'],
    },
    members: {
      id: 'members',
      label: 'Members',
      type: 'roster',
      filters: ['Owner', 'Admin', 'Moderator', 'Member'],
    },
    rules: {
      id: 'rules',
      label: 'Rules',
      type: 'policy-list',
      requireAckOnJoin: true,
    },
    files: {
      id: 'files',
      label: 'Files',
      type: 'resource-library',
      allowsPinned: true,
    },
    events: {
      id: 'events',
      label: 'Events',
      type: 'event-list',
      linksToEventProfiles: true,
    },
    announcements: {
      id: 'announcements',
      label: 'Announcements',
      type: 'highlight',
    },
    moderation: {
      id: 'moderation',
      label: 'Moderation queue',
      type: 'moderation-tools',
      visibility: 'owner-only',
      actions: ['Approve posts', 'Review reports', 'Mute', 'Ban'],
    },
    'join-bar': {
      id: 'join-bar',
      label: 'Join bar',
      type: 'cta-bar',
      states: ['Join', 'Request sent', 'Joined'],
    },
    'suggested-members': {
      id: 'suggested-members',
      label: 'Suggested members',
      source: 'social-graph',
    },
    'recommended-groups': {
      id: 'recommended-groups',
      label: 'Recommended groups',
      source: 'recommendations',
    },
    'ad-rail': {
      id: 'ad-rail',
      label: 'Ad slot',
      size: '300x250',
      targeting: 'tooling/education',
      optInRequired: true,
    },
    analytics: {
      id: 'analytics',
      label: 'Group analytics',
      fields: ['New members', 'DAU', 'Post engagement', 'Retention', 'Moderation actions'],
      visibility: 'owner-only',
    },
  },
  contexts: {
    public: {
      label: 'Public preview',
      description: 'Highlights mission, rules, and recent activity to attract members.',
      columns: {
        left: ['about', 'rules'],
        center: ['feed', 'announcements'],
        right: ['join-bar', 'recommended-groups'],
      },
      ctas: ['Join', 'Request to join', 'Share group'],
      visibility: { hiddenModules: ['files', 'members', 'events', 'moderation', 'analytics'] },
    },
    member: {
      label: 'Member view',
      description: 'Full access to feed, files, and member roster.',
      columns: {
        left: ['about', 'rules', 'files'],
        center: ['feed', 'events', 'announcements'],
        right: ['join-bar', 'suggested-members', 'recommended-groups', 'ad-rail'],
      },
      ctas: ['Create post', 'Invite', 'Share'],
    },
    owner: {
      label: 'Owner & moderators',
      description: 'Adds moderation controls, analytics, and membership gating.',
      columns: {
        left: ['about', 'rules', 'files'],
        center: ['feed', 'events', 'announcements', 'moderation', 'analytics'],
        right: ['join-bar', 'suggested-members', 'recommended-groups', 'ad-rail'],
      },
      ctas: ['Review queue', 'Invite members', 'Configure rules'],
      management: {
        roles: ['Owner', 'Admin', 'Moderator', 'Member'],
        entry: ['Join questions', 'Auto-approval rules'],
      },
    },
  },
  recommendations: {
    order: ['recommended-groups', 'events', 'pages'],
    diversityRules: { maxPerEntity: 2, blendNewVsKnown: '70/30' },
  },
  seo: {
    schema: ['Organization'],
    vanityPrefix: '/groups/',
    openGraph: { type: 'group', image: 'heroImageUrl' },
  },
  analytics: ['New members', 'Engagement', 'Retention', 'Moderation velocity'],
  notifications: ['Join requests', 'Post approvals', 'Mentions', 'Reports'],
  footer: {
    ctas: [
      { id: 'join', label: 'Join group' },
      { id: 'invite', label: 'Invite members' },
      { id: 'report', label: 'Report group' },
    ],
  },
};

const pageProfileBlueprint = {
  id: 'page_profile',
  slug: 'page-profile',
  type: 'page',
  label: 'Page profile blueprint',
  persona: {
    primary: 'Page',
    archetypes: ['Brand', 'Product', 'Practice', 'Local chapter'],
    statuses: ['Open', 'By appointment', 'Closed'],
  },
  hero: {
    banner: true,
    fields: ['name', 'category', 'locations', 'hours', 'status'],
    primaryCtas: ['Follow', 'Contact', 'Visit site', 'Book'],
  },
  navigation: [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products & Services' },
    { id: 'posts', label: 'Posts' },
    { id: 'team', label: 'Team' },
    { id: 'media', label: 'Media' },
    { id: 'locations', label: 'Locations' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'events', label: 'Events' },
  ],
  layout: {
    variant: 'three-column',
    columns: {
      left: ['about', 'highlights', 'media', 'testimonials'],
      center: ['products', 'services', 'posts', 'events', 'jobs'],
      right: ['lead-form', 'related-pages', 'ad-rail'],
    },
    containerWidth: 1200,
  },
  modules: {
    about: {
      id: 'about',
      label: 'About',
      type: 'rich-text',
      fields: ['Mission', 'Highlights'],
    },
    highlights: {
      id: 'highlights',
      label: 'Highlights',
      type: 'chips',
      items: ['Key facts', 'Industries', 'Regions'],
    },
    products: {
      id: 'products',
      label: 'Products',
      type: 'cards',
      ctas: ['Hire', 'Book demo', 'Buy'],
    },
    services: {
      id: 'services',
      label: 'Services',
      type: 'cards',
      includesPricing: true,
    },
    posts: {
      id: 'posts',
      label: 'Posts',
      type: 'feed',
    },
    team: {
      id: 'team',
      label: 'Team',
      type: 'roster',
      highlightManagers: true,
    },
    testimonials: {
      id: 'testimonials',
      label: 'Testimonials',
      type: 'quotes',
      provenanceBadges: true,
    },
    media: {
      id: 'media',
      label: 'Media',
      type: 'gallery',
      supportsVideo: true,
    },
    locations: {
      id: 'locations',
      label: 'Locations',
      type: 'map-list',
      showOpenHours: true,
    },
    jobs: {
      id: 'jobs',
      label: 'Jobs',
      type: 'job-list',
    },
    events: {
      id: 'events',
      label: 'Events',
      type: 'event-list',
    },
    'lead-form': {
      id: 'lead-form',
      label: 'Lead form',
      type: 'lead',
      fields: ['Name', 'Email', 'Company', 'Message', 'Consent'],
    },
    'related-pages': {
      id: 'related-pages',
      label: 'Related pages',
      source: 'recommendations',
    },
    'ad-rail': {
      id: 'ad-rail',
      label: 'Ad slot',
      size: '300x250',
      targeting: 'tools/education only',
    },
    analytics: {
      id: 'analytics',
      label: 'Page analytics',
      fields: ['Followers', 'Reach', 'CTA clicks', 'Leads'],
      visibility: 'owner-only',
    },
  },
  contexts: {
    public: {
      label: 'Public view',
      description: 'Marketing showcase for visitors discovering the page.',
      columns: {
        left: ['about', 'highlights', 'media'],
        center: ['products', 'services', 'posts'],
        right: ['lead-form', 'related-pages', 'ad-rail'],
      },
      ctas: ['Follow', 'Contact', 'Visit site'],
      visibility: { hiddenModules: ['jobs', 'events', 'analytics', 'testimonials'] },
    },
    follower: {
      label: 'Follower view',
      description: 'Followers see richer content, testimonials, and jobs/events.',
      columns: {
        left: ['about', 'highlights', 'media', 'testimonials'],
        center: ['products', 'services', 'posts', 'events', 'jobs'],
        right: ['lead-form', 'related-pages', 'ad-rail'],
      },
      ctas: ['Contact', 'Book', 'Share'],
    },
    owner: {
      label: 'Owner workspace',
      description: 'Managers access analytics, lead management, and scheduling.',
      columns: {
        left: ['about', 'highlights', 'media', 'testimonials'],
        center: ['products', 'services', 'posts', 'events', 'jobs', 'analytics'],
        right: ['lead-form', 'related-pages', 'ad-rail'],
      },
      ctas: ['Create post', 'Add product', 'View leads'],
      management: {
        roles: ['Owner', 'Manager', 'Editor', 'Analyst'],
        workflows: ['Draft/publish', 'Scheduling', 'Lead routing'],
      },
    },
  },
  recommendations: {
    order: ['related-pages', 'events', 'jobs', 'professionals'],
    rules: { avoidCompetitorAds: true, sponsorCap: 0.1 },
  },
  seo: {
    schema: ['Organization', 'Product', 'Service'],
    vanityPrefix: '/pages/',
    openGraph: { type: 'website', image: 'heroImageUrl' },
  },
  analytics: ['Followers', 'Reach', 'Lead conversion', 'Store visits'],
  notifications: ['New follower', 'Lead submitted', 'Post engagement'],
  footer: {
    ctas: [
      { id: 'follow', label: 'Follow page' },
      { id: 'contact', label: 'Contact' },
      { id: 'report', label: 'Report page' },
    ],
  },
};

const PROFILE_BLUEPRINTS = freezeDeep([
  userProfileBlueprint,
  professionalProfileBlueprint,
  companyProfileBlueprint,
  eventProfileBlueprint,
  groupProfileBlueprint,
  pageProfileBlueprint,
]);

export { PROFILE_BLUEPRINTS };

export function listProfileBlueprintsContract() {
  return PROFILE_BLUEPRINTS;
}

export function findProfileBlueprintContract(identifier) {
  if (!identifier) {
    return PROFILE_BLUEPRINTS.find((entry) => entry.id === DEFAULT_PROFILE_BLUEPRINT_ID) ?? PROFILE_BLUEPRINTS[0] ?? null;
  }
  const key = String(identifier).trim().toLowerCase();
  return (
    PROFILE_BLUEPRINTS.find(
      (entry) =>
        String(entry.id).toLowerCase() === key ||
        String(entry.slug ?? '').toLowerCase() === key ||
        String(entry.type ?? '').toLowerCase() === key,
    ) ?? null
  );
}

export default {
  PROFILE_BLUEPRINT_VERSION,
  DEFAULT_PROFILE_BLUEPRINT_ID,
  PROFILE_BLUEPRINTS,
  listProfileBlueprintsContract,
  findProfileBlueprintContract,
};
