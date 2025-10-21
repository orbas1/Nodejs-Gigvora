import {
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SwatchIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import { deepFreeze } from './menuSchema.js';

const marketingNavigationConfig = deepFreeze([
  {
    id: 'solutions',
    label: 'Solutions',
    description: 'Role-specific workspaces, matching, and operations.',
    sections: [
      {
        title: 'Talent & hiring',
        items: [
          {
            name: 'Project & gig marketplace',
            description: 'Launch briefs, vet specialists, and manage milestones in one shared workspace.',
            to: '/gigs',
            icon: BriefcaseIcon,
          },
          {
            name: 'Recruitment & ATS',
            description: 'Synchronise company ATS pipelines with Gigvora interviews, evaluations, and decision logging.',
            to: '/dashboard/company/ats',
            icon: UsersIcon,
          },
          {
            name: 'Launchpad programmes',
            description: 'Curate Experience Launchpad cohorts with readiness scoring and mentor pairing.',
            to: '/launchpad',
            icon: AcademicCapIcon,
          },
        ],
      },
      {
        title: 'Operations & finance',
        items: [
          {
            name: 'Finance & escrow hub',
            description: 'Monitor balances, trigger payouts, and reconcile invoices with audit trails.',
            to: '/finance',
            icon: ChartBarIcon,
          },
          {
            name: 'Compliance & policies',
            description: 'Manage KYC, GDPR, and contract controls with evidence lockers and approvals.',
            to: '/trust-center',
            icon: ShieldCheckIcon,
          },
          {
            name: 'Community programmes',
            description: 'Host community groups, live sessions, and volunteering drives with moderation tooling.',
            to: '/groups',
            icon: GlobeAltIcon,
          },
        ],
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    description: 'Product capabilities powering hybrid teams.',
    sections: [
      {
        title: 'Core experiences',
        items: [
          {
            name: 'Timeline intelligence',
            description: 'Role-aware timeline with ads, recommendations, and real-time status banners.',
            to: '/feed',
            icon: SparklesIcon,
          },
          {
            name: 'Explorer search',
            description: 'Search people, opportunities, and groups with contextual filters and saved views.',
            to: '/search',
            icon: SwatchIcon,
          },
          {
            name: 'Creation Studio',
            description: 'Publish jobs, gigs, and resources with autosave, compliance scoring, and collaboration.',
            to: '/creation-studio',
            icon: RocketLaunchIcon,
          },
          {
            name: 'Member profiles',
            description: 'Deep dive into freelancer, mentor, and company work histories with live timelines.',
            to: '/community/users/me',
            icon: UsersIcon,
          },
        ],
      },
      {
        title: 'Dashboards',
        items: [
          {
            name: 'Admin operations',
            description: 'Unify approvals, incidents, releases, and communication cadences for platform leads.',
            to: '/dashboard/admin',
            icon: BuildingOffice2Icon,
          },
          {
            name: 'Agency growth',
            description: 'Manage pipelines, assignments, contracts, and cash flow with agency-specific automations.',
            to: '/dashboard/agency',
            icon: UsersIcon,
          },
          {
            name: 'Freelancer cockpit',
            description: 'Track gigs, deliverables, revenue, and wellbeing metrics in one secure hub.',
            to: '/dashboard/freelancer',
            icon: BriefcaseIcon,
          },
        ],
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    description: 'Guides, reports, and community updates.',
    sections: [
      {
        title: 'Insights',
        items: [
          {
            name: 'Blog & announcements',
            description: 'Stories on hiring, product delivery, and operations from global members.',
            to: '/blog',
            icon: GlobeAltIcon,
          },
          {
            name: 'Security operations',
            description: 'Review the security programme, incident playbooks, and dependency governance.',
            to: '/security-operations',
            icon: ShieldCheckIcon,
          },
          {
            name: 'Support & inbox',
            description: 'Chat with support, escalate cases, and browse the knowledge base.',
            to: '/inbox',
            icon: UsersIcon,
          },
        ],
      },
      {
        title: 'Company',
        items: [
          {
            name: 'About Gigvora',
            description: 'Understand our mission, operational guarantees, and impact programmes.',
            to: '/about',
            icon: BuildingOffice2Icon,
          },
          {
            name: 'Careers',
            description: 'Explore open roles across product, community, operations, and enablement.',
            to: '/pages',
            icon: BriefcaseIcon,
          },
          {
            name: 'Contact & partnerships',
            description: 'Book a consultation, join partner programmes, or request enterprise onboarding.',
            to: '/pages',
            icon: GlobeAltIcon,
          },
        ],
      },
      {
        title: 'Policies & help',
        items: [
          {
            name: 'Community guidelines',
            description: 'Rules, safety expectations, and escalation routes for every workspace.',
            to: '/community-guidelines',
            icon: UsersIcon,
          },
          {
            name: 'Terms & conditions',
            description: 'Contractual framework for using Gigvora’s marketplace and services.',
            to: '/terms',
            icon: ShieldCheckIcon,
          },
          {
            name: 'Privacy policy',
            description: 'How we collect, process, and protect personal data across the platform.',
            to: '/privacy',
            icon: SparklesIcon,
          },
          {
            name: 'Refund policy',
            description: 'Understand eligibility, timelines, and processes for refunds and credits.',
            to: '/refunds',
            icon: ChartBarIcon,
          },
          {
            name: 'FAQ',
            description: 'Quick answers about onboarding, payments, integrations, and support.',
            to: '/faq',
            icon: SwatchIcon,
          },
        ],
      },
    ],
  },
]);

export const marketingNavigation = marketingNavigationConfig;

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
