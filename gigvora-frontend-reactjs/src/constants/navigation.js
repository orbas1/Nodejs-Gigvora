import {
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  GlobeAltIcon,
  LightBulbIcon,
  MegaphoneIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import { deepFreeze } from './menuSchema.js';

const marketingNavigationConfig = deepFreeze([
  {
    id: 'discover',
    label: 'Discover',
    description: 'Find the people, organisations, and signals that grow your marketplace reach.',
    theme: {
      button: 'bg-slate-900/5 hover:bg-slate-900/10',
    },
    sections: [
      {
        title: 'People & relationships',
        items: [
          {
            name: 'Connections',
            description: 'View introductions, track touch-points, and stay top of mind.',
            to: '/connections',
            icon: UsersIcon,
          },
          {
            name: 'Mentors & advisors',
            description: 'Invite strategic partners to support your upcoming launches.',
            to: '/mentors',
            icon: LightBulbIcon,
          },
          {
            name: 'Company pages',
            description: 'Showcase announcements and hiring signals from one branded hub.',
            to: '/pages',
            icon: BuildingOffice2Icon,
          },
        ],
      },
      {
        title: 'Communities',
        items: [
          {
            name: 'Professional groups',
            description: 'Host curated discussions and drops for your teams and partners.',
            to: '/groups',
            icon: Squares2X2Icon,
          },
          {
            name: 'Opportunities Explorer',
            description: 'Filter the network for people, teams, and organisations ready to collaborate.',
            to: '/search',
            icon: MegaphoneIcon,
          },
        ],
      },
    ],
  },
  {
    id: 'collaborate',
    label: 'Collaborate',
    description: 'Coordinate delivery workstreams with dashboards built for hybrid teams.',
    theme: {
      button: 'bg-accent/5 hover:bg-accent/10',
      icon: 'text-accent',
    },
    sections: [
      {
        title: 'Team workspaces',
        items: [
          {
            name: 'Freelancer pipeline',
            description: 'Manage briefs, nurture candidates, and convert offers together.',
            to: '/dashboard/freelancer/pipeline',
            icon: BriefcaseIcon,
          },
          {
            name: 'Company analytics',
            description: 'Monitor revenue, growth, and retention across business units.',
            to: '/dashboard/company/analytics',
            icon: ChartBarIcon,
          },
          {
            name: 'Agency CRM',
            description: 'Align accounts, collaborators, and delivery playbooks in real time.',
            to: '/dashboard/agency/crm-pipeline',
            icon: GlobeAltIcon,
          },
        ],
      },
      {
        title: 'Automation',
        items: [
          {
            name: 'Experience Launchpad',
            description: 'Automate onboarding, playbooks, and launch readiness in one hub.',
            to: '/experience-launchpad',
            icon: RocketLaunchIcon,
          },
          {
            name: 'Trust centre',
            description: 'Keep compliance, privacy, and risk controls transparent for partners.',
            to: '/trust-center',
            icon: ShieldCheckIcon,
          },
        ],
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    description: 'Stay informed with platform updates, billing guides, and customer stories.',
    theme: {
      button: 'bg-amber-500/5 hover:bg-amber-500/10',
      icon: 'text-amber-500',
    },
    sections: [
      {
        title: 'Learn',
        items: [
          {
            name: 'Product blog',
            description: 'Discover the latest Gigvora releases and customer spotlights.',
            to: '/blog',
            icon: ChartBarIcon,
          },
          {
            name: 'Resource hub',
            description: 'Guides, templates, and launch kits to support every team moment.',
            to: '/resources',
            icon: SparklesIcon,
          },
        ],
      },
      {
        title: 'Policies & support',
        items: [
          {
            name: 'Billing & subscriptions',
            description: 'Manage invoices, renewals, and plan usage in one place.',
            to: '/billing',
            icon: BriefcaseIcon,
          },
          {
            name: 'Policy centre',
            description: 'Review security, privacy, and community standards anytime.',
            to: '/policies',
            icon: ShieldCheckIcon,
          },
        ],
      },
    ],
  },
]);

const marketingSearchConfig = deepFreeze({
  id: 'marketing-search',
  label: 'Search Gigvora',
  placeholder: 'Search projects, people, and teams',
  ariaLabel: 'Search the Gigvora workspace catalogue',
  to: '/search',
});

export const marketingNavigation = marketingNavigationConfig;
export const MARKETING_SEARCH = marketingSearchConfig;
export const PRIMARY_NAVIGATION = deepFreeze({
  search: marketingSearchConfig,
  menus: marketingNavigationConfig,
});

export const roleDashboardMapping = deepFreeze({
  user: '/dashboard/user',
  freelancer: '/dashboard/freelancer',
  agency: '/dashboard/agency',
  company: '/dashboard/company',
  mentor: '/dashboard/mentor',
  headhunter: '/dashboard/headhunter',
  launchpad: '/dashboard/launchpad',
  admin: '/dashboard/admin',
});

export const timelineAccessRoles = Object.freeze([
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
  'admin',
]);

export function resolvePrimaryRoleKey(session) {
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  const primary =
    session?.primaryDashboard || session?.primaryMembership || session?.userType || memberships[0] || 'user';
  return primary.toString().toLowerCase();
}

export function resolvePrimaryNavigation(session) {
  const baseNavigation = [
    { id: 'timeline', label: 'Timeline', to: '/feed' },
    { id: 'explorer', label: 'Explorer', to: '/search' },
    { id: 'studio', label: 'Creation Studio', to: '/dashboard/user/creation-studio' },
    { id: 'inbox', label: 'Inbox', to: '/inbox' },
    { id: 'notifications', label: 'Notifications', to: '/notifications' },
  ];

  const primaryKey = resolvePrimaryRoleKey(session);
  const dashboardPath = roleDashboardMapping[primaryKey] ?? roleDashboardMapping.user;

  const specialisedNav = [
    { id: 'dashboard', label: 'Dashboard', to: dashboardPath },
  ];

  if (primaryKey === 'admin') {
    specialisedNav.push({ id: 'policies', label: 'Policies', to: '/dashboard/admin/policies' });
  }

  if (primaryKey === 'company') {
    specialisedNav.push({ id: 'ats', label: 'ATS', to: '/dashboard/company/ats' });
    specialisedNav.push({ id: 'analytics', label: 'Analytics', to: '/dashboard/company/analytics' });
  }

  if (primaryKey === 'freelancer') {
    specialisedNav.push({ id: 'pipeline', label: 'Pipeline', to: '/dashboard/freelancer/pipeline' });
    specialisedNav.push({ id: 'portfolio', label: 'Portfolio', to: '/dashboard/freelancer/portfolio' });
  }

  if (primaryKey === 'agency') {
    specialisedNav.push({ id: 'crm', label: 'CRM', to: '/dashboard/agency/crm-pipeline' });
    specialisedNav.push({ id: 'finance', label: 'Finance', to: '/dashboard/agency/wallet-management' });
  }

  return [...specialisedNav, ...baseNavigation];
}

export function buildRoleOptions(session) {
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  if (!memberships.length) {
    return [{ key: 'user', label: 'User workspace', to: roleDashboardMapping.user }];
  }

  const options = memberships
    .map((membership) => {
      const key = membership.toString().toLowerCase();
      const to = roleDashboardMapping[key];
      if (!to) {
        return null;
      }
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const timelineEnabled = timelineAccessRoles.includes(key);
      return {
        key,
        label,
        to,
        timelineEnabled,
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
