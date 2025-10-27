import { freezeDeep } from '../utils/freezeDeep.js';

const MARKETING_NAVIGATION = freezeDeep([
  {
    id: 'discover',
    label: 'Discover',
    description: 'Find the people, organisations, and signals that grow your marketplace reach.',
    governance: {
      analyticsId: 'marketing.discover',
      personas: ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter'],
      status: 'ga',
      surfaces: ['marketing-web', 'app-shell'],
      journeys: ['relationship-intelligence', 'audience-growth'],
    },
    theme: {
      button: 'bg-slate-900/5 hover:bg-slate-900/10',
    },
    sections: [
      {
        title: 'People & relationships',
        items: [
          {
            id: 'discover-connections',
            name: 'Connections',
            description: 'View introductions, track touch-points, and stay top of mind.',
            to: '/connections',
            icon: 'users',
            analyticsId: 'discover.connections',
            personas: ['user', 'freelancer', 'agency', 'company', 'mentor'],
            surfaces: ['web-app', 'mobile'],
            status: 'ga',
            featureFlag: null,
            journeys: ['relationship-intelligence'],
          },
          {
            id: 'discover-mentors',
            name: 'Mentors & advisors',
            description: 'Invite strategic partners to support your upcoming launches.',
            to: '/mentors',
            icon: 'light-bulb',
            analyticsId: 'discover.mentors',
            personas: ['user', 'company', 'freelancer', 'agency', 'mentor'],
            surfaces: ['web-app', 'mobile'],
            status: 'ga',
            featureFlag: null,
            journeys: ['mentorship'],
          },
          {
            id: 'discover-company-pages',
            name: 'Company pages',
            description: 'Showcase announcements and hiring signals from one branded hub.',
            to: '/pages',
            icon: 'building',
            analyticsId: 'discover.companyPages',
            personas: ['company', 'agency', 'headhunter'],
            surfaces: ['web-app'],
            status: 'ga',
            featureFlag: null,
            journeys: ['brand-storytelling'],
          },
        ],
      },
      {
        title: 'Communities',
        items: [
          {
            id: 'discover-groups',
            name: 'Professional groups',
            description: 'Host curated discussions and drops for your teams and partners.',
            to: '/groups',
            icon: 'squares-2x2',
            analyticsId: 'discover.groups',
            personas: ['user', 'company', 'agency', 'freelancer', 'mentor'],
            surfaces: ['web-app', 'mobile'],
            status: 'ga',
            featureFlag: null,
            journeys: ['community'],
          },
          {
            id: 'discover-explorer',
            name: 'Opportunities Explorer',
            description: 'Filter the network for people, teams, and organisations ready to collaborate.',
            to: '/search',
            icon: 'megaphone',
            analyticsId: 'discover.explorer',
            personas: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor'],
            surfaces: ['web-app', 'mobile'],
            status: 'ga',
            featureFlag: null,
            journeys: ['opportunity-matching'],
          },
        ],
      },
    ],
  },
  {
    id: 'collaborate',
    label: 'Collaborate',
    description: 'Coordinate delivery workstreams with dashboards built for hybrid teams.',
    governance: {
      analyticsId: 'marketing.collaborate',
      personas: ['freelancer', 'agency', 'company', 'launchpad', 'admin'],
      status: 'ga',
      surfaces: ['marketing-web', 'app-shell'],
      journeys: ['work-management', 'automation'],
    },
    theme: {
      button: 'bg-accent/5 hover:bg-accent/10',
      icon: 'text-accent',
    },
    sections: [
      {
        title: 'Team workspaces',
        items: [
          {
            id: 'collaborate-freelancer-pipeline',
            name: 'Freelancer pipeline',
            description: 'Manage briefs, nurture candidates, and convert offers together.',
            to: '/dashboard/freelancer/pipeline',
            icon: 'briefcase',
            analyticsId: 'collaborate.freelancerPipeline',
            personas: ['freelancer', 'agency', 'company'],
            surfaces: ['web-app'],
            status: 'ga',
            featureFlag: null,
            journeys: ['work-management'],
          },
          {
            id: 'collaborate-company-analytics',
            name: 'Company analytics',
            description: 'Monitor revenue, growth, and retention across business units.',
            to: '/dashboard/company/analytics',
            icon: 'chart-bar',
            analyticsId: 'collaborate.companyAnalytics',
            personas: ['company', 'admin'],
            surfaces: ['web-app'],
            status: 'ga',
            featureFlag: null,
            journeys: ['insights'],
          },
          {
            id: 'collaborate-agency-crm',
            name: 'Agency CRM',
            description: 'Align accounts, collaborators, and delivery playbooks in real time.',
            to: '/dashboard/agency/crm-pipeline',
            icon: 'globe',
            analyticsId: 'collaborate.agencyCrm',
            personas: ['agency', 'company', 'headhunter'],
            surfaces: ['web-app'],
            status: 'ga',
            featureFlag: null,
            journeys: ['crm'],
          },
        ],
      },
      {
        title: 'Automation',
        items: [
          {
            id: 'collaborate-launchpad',
            name: 'Experience Launchpad',
            description: 'Automate onboarding, playbooks, and launch readiness in one hub.',
            to: '/experience-launchpad',
            icon: 'rocket',
            analyticsId: 'collaborate.launchpad',
            personas: ['launchpad', 'company', 'agency'],
            surfaces: ['web-app'],
            status: 'beta',
            featureFlag: 'launchpad.experience',
            journeys: ['automation'],
          },
          {
            id: 'collaborate-trust-centre',
            name: 'Trust centre',
            description: 'Keep compliance, privacy, and risk controls transparent for partners.',
            to: '/trust-center',
            icon: 'shield-check',
            analyticsId: 'collaborate.trustCentre',
            personas: ['company', 'agency', 'admin'],
            surfaces: ['web-app'],
            status: 'ga',
            featureFlag: null,
            journeys: ['governance'],
          },
        ],
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    description: 'Stay informed with platform updates, billing guides, and customer stories.',
    governance: {
      analyticsId: 'marketing.resources',
      personas: ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'],
      status: 'ga',
      surfaces: ['marketing-web', 'help-centre'],
      journeys: ['enablement', 'billing'],
    },
    theme: {
      button: 'bg-amber-500/5 hover:bg-amber-500/10',
      icon: 'text-amber-500',
    },
    sections: [
      {
        title: 'Learn',
        items: [
          {
            id: 'resources-blog',
            name: 'Product blog',
            description: 'Discover the latest Gigvora releases and customer spotlights.',
            to: '/blog',
            icon: 'chart-bar',
            analyticsId: 'resources.blog',
            personas: ['user', 'freelancer', 'agency', 'company', 'mentor', 'admin', 'headhunter'],
            surfaces: ['marketing-web'],
            status: 'ga',
            featureFlag: null,
            journeys: ['enablement'],
          },
          {
            id: 'resources-hub',
            name: 'Resource hub',
            description: 'Guides, templates, and launch kits to support every team moment.',
            to: '/resources',
            icon: 'sparkles',
            analyticsId: 'resources.hub',
            personas: ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter'],
            surfaces: ['marketing-web', 'help-centre'],
            status: 'ga',
            featureFlag: null,
            journeys: ['enablement'],
          },
        ],
      },
      {
        title: 'Policies & support',
        items: [
          {
            id: 'resources-billing',
            name: 'Billing & subscriptions',
            description: 'Manage invoices, renewals, and plan usage in one place.',
            to: '/billing',
            icon: 'briefcase',
            analyticsId: 'resources.billing',
            personas: ['company', 'agency', 'freelancer', 'admin'],
            surfaces: ['web-app'],
            status: 'ga',
            featureFlag: null,
            journeys: ['billing'],
          },
          {
            id: 'resources-policies',
            name: 'Policy centre',
            description: 'Review security, privacy, and community standards anytime.',
            to: '/policies',
            icon: 'shield-check',
            analyticsId: 'resources.policies',
            personas: ['company', 'agency', 'admin', 'mentor'],
            surfaces: ['marketing-web', 'help-centre'],
            status: 'ga',
            featureFlag: null,
            journeys: ['governance'],
          },
        ],
      },
    ],
  },
]);

const MARKETING_SEARCH = freezeDeep({
  id: 'marketing-search',
  label: 'Search Gigvora',
  placeholder: 'Search projects, people, and teams',
  ariaLabel: 'Search the Gigvora workspace catalogue',
  to: '/search',
});

const ROLE_DASHBOARD_MAPPING = freezeDeep({
  user: '/dashboard/user',
  freelancer: '/dashboard/freelancer',
  agency: '/dashboard/agency',
  company: '/dashboard/company',
  mentor: '/dashboard/mentor',
  headhunter: '/dashboard/headhunter',
  launchpad: '/dashboard/launchpad',
  admin: '/dashboard/admin',
});

const TIMELINE_ACCESS_ROLES = freezeDeep([
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
  'admin',
]);

function resolvePrimaryRoleKey(session) {
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  const primaryCandidate =
    session?.primaryDashboard ?? session?.primaryMembership ?? session?.userType ?? memberships[0] ?? 'user';
  return primaryCandidate.toString().trim().toLowerCase();
}

function resolvePrimaryNavigation(session) {
  const baseNavigation = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      to: ROLE_DASHBOARD_MAPPING.user,
      icon: 'home',
      ariaLabel: 'Open your Gigvora dashboard',
      context: 'core',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      to: '/feed',
      icon: 'rss',
      ariaLabel: 'View network timeline',
      context: 'core',
    },
    {
      id: 'explorer',
      label: 'Explorer',
      to: '/search',
      icon: 'squares-2x2',
      ariaLabel: 'Discover opportunities and people',
      context: 'core',
    },
    {
      id: 'studio',
      label: 'Creation Studio',
      to: '/dashboard/user/creation-studio',
      icon: 'sparkles',
      ariaLabel: 'Launch the creation studio',
      context: 'core',
    },
    {
      id: 'inbox',
      label: 'Inbox',
      to: '/inbox',
      icon: 'chat-bubble',
      ariaLabel: 'Check messages',
      context: 'core',
    },
    {
      id: 'notifications',
      label: 'Alerts',
      to: '/notifications',
      icon: 'bell',
      ariaLabel: 'Review alerts and updates',
      context: 'core',
    },
  ];

  const primaryKey = resolvePrimaryRoleKey(session);
  const specialisedNav = [];

  if (primaryKey === 'admin') {
    specialisedNav.push({
      id: 'policies',
      label: 'Policies',
      to: '/dashboard/admin/policies',
      icon: 'shield-check',
      ariaLabel: 'Review policy centre',
      context: 'persona',
    });
  }

  if (primaryKey === 'company') {
    specialisedNav.push({
      id: 'ats',
      label: 'Talent ATS',
      to: '/dashboard/company/ats',
      icon: 'briefcase',
      ariaLabel: 'Open applicant tracking tools',
      context: 'persona',
    });
    specialisedNav.push({
      id: 'analytics',
      label: 'Analytics',
      to: '/dashboard/company/analytics',
      icon: 'chart-bar',
      ariaLabel: 'Explore hiring analytics',
      context: 'persona',
    });
  }

  if (primaryKey === 'freelancer') {
    specialisedNav.push({
      id: 'pipeline',
      label: 'Pipeline',
      to: '/dashboard/freelancer/pipeline',
      icon: 'presentation-chart',
      ariaLabel: 'Track project pipeline',
      context: 'persona',
    });
    specialisedNav.push({
      id: 'portfolio',
      label: 'Portfolio',
      to: '/dashboard/freelancer/portfolio',
      icon: 'folder',
      ariaLabel: 'Showcase your portfolio',
      context: 'persona',
    });
  }

  if (primaryKey === 'agency') {
    specialisedNav.push({
      id: 'crm',
      label: 'Agency CRM',
      to: '/dashboard/agency/crm-pipeline',
      icon: 'building',
      ariaLabel: 'Navigate to agency CRM',
      context: 'persona',
    });
    specialisedNav.push({
      id: 'finance',
      label: 'Finance',
      to: '/dashboard/agency/wallet-management',
      icon: 'banknotes',
      ariaLabel: 'Review agency finances',
      context: 'persona',
    });
  }

  if (primaryKey !== 'user' && primaryKey in ROLE_DASHBOARD_MAPPING) {
    baseNavigation[0] = {
      id: 'dashboard',
      label: 'Dashboard',
      to: ROLE_DASHBOARD_MAPPING[primaryKey],
      icon: 'home',
      ariaLabel: 'Open your Gigvora dashboard',
      context: 'core',
    };
  }

  if (specialisedNav.length) {
    return [baseNavigation[0], ...specialisedNav, ...baseNavigation.slice(1)];
  }

  return baseNavigation;
}

function buildRoleOptions(session) {
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  if (!memberships.length) {
    return [
      {
        key: 'user',
        label: 'User workspace',
        to: ROLE_DASHBOARD_MAPPING.user,
        timelineEnabled: true,
      },
    ];
  }

  const options = memberships
    .map((membership) => {
      const key = membership.toString().trim().toLowerCase();
      const to = ROLE_DASHBOARD_MAPPING[key];
      if (!to) {
        return null;
      }
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return {
        key,
        label,
        to,
        timelineEnabled: TIMELINE_ACCESS_ROLES.includes(key),
      };
    })
    .filter(Boolean);

  const unique = new Map();
  options.forEach((option) => {
    if (!unique.has(option.key)) {
      unique.set(option.key, option);
    }
  });

  return Array.from(unique.values());
}

function collectMarketingAuditEntries() {
  return MARKETING_NAVIGATION.flatMap((menu) =>
    menu.sections.flatMap((section) =>
      section.items.map((item) => {
        const menuPersonas = Array.isArray(menu.governance?.personas) ? menu.governance.personas : [];
        const itemPersonas = Array.isArray(item.personas) ? item.personas : [];
        const personas = Array.from(new Set([...menuPersonas, ...itemPersonas]));

        const menuSurfaces = Array.isArray(menu.governance?.surfaces) ? menu.governance.surfaces : [];
        const itemSurfaces = Array.isArray(item.surfaces) ? item.surfaces : [];
        const surfaces = Array.from(new Set([...menuSurfaces, ...itemSurfaces]));

        const menuJourneys = Array.isArray(menu.governance?.journeys) ? menu.governance.journeys : [];
        const itemJourneys = Array.isArray(item.journeys) ? item.journeys : [];
        const journeys = Array.from(new Set([...menuJourneys, ...itemJourneys]));

        return {
          menuId: menu.id,
          menuLabel: menu.label,
          sectionTitle: section.title,
          itemId: item.id,
          itemLabel: item.name,
          analyticsId: item.analyticsId ?? menu.governance?.analyticsId ?? `${menu.id}.${item.id}`,
          personas,
          surfaces,
          journeys,
          status: item.status ?? menu.governance?.status ?? 'ga',
          featureFlag: item.featureFlag ?? null,
        };
      }),
    ),
  );
}

function createNavigationGovernanceMatrix() {
  return {
    marketing: collectMarketingAuditEntries(),
    personaDashboards: Object.entries(ROLE_DASHBOARD_MAPPING).map(([role, path]) => ({
      role,
      path,
      timelineEnabled: TIMELINE_ACCESS_ROLES.includes(role),
    })),
    marketingSearch: MARKETING_SEARCH,
  };
}

const NAVIGATION_GOVERNANCE_BLUEPRINT = freezeDeep(createNavigationGovernanceMatrix());

export {
  MARKETING_NAVIGATION,
  MARKETING_SEARCH,
  ROLE_DASHBOARD_MAPPING,
  TIMELINE_ACCESS_ROLES,
  resolvePrimaryRoleKey,
  resolvePrimaryNavigation,
  buildRoleOptions,
  createNavigationGovernanceMatrix,
  NAVIGATION_GOVERNANCE_BLUEPRINT,
};

export default {
  MARKETING_NAVIGATION,
  MARKETING_SEARCH,
  ROLE_DASHBOARD_MAPPING,
  TIMELINE_ACCESS_ROLES,
  resolvePrimaryRoleKey,
  resolvePrimaryNavigation,
  buildRoleOptions,
  createNavigationGovernanceMatrix,
  NAVIGATION_GOVERNANCE_BLUEPRINT,
};
