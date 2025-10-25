import {
  AcademicCapIcon,
  BookOpenIcon,
  BookmarkSquareIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import { deepFreeze } from './menuSchema.js';

const marketingNavigationConfig = deepFreeze([
  {
    id: 'courses',
    label: 'Courses',
    description: 'Structured learning paths for product-led careers.',
    sections: [
      {
        title: 'Courses',
        items: [
          {
            name: 'Product leadership course',
            description: 'Master discovery-to-delivery rituals with live faculty feedback.',
            to: '/courses/product-leadership',
            icon: AcademicCapIcon,
          },
          {
            name: 'Service design sprint',
            description: 'Ship customer journeys in four weeks with studio critiques and retros.',
            to: '/courses/service-design',
            icon: SparklesIcon,
          },
          {
            name: 'Data storytelling labs',
            description: 'Translate product insights into executive-ready narratives and dashboards.',
            to: '/courses/data-storytelling',
            icon: ChartBarIcon,
          },
        ],
      },
      {
        title: 'Certificates',
        items: [
          {
            name: 'Delivery operations certificate',
            description: 'Level-up programme management with risk cadences and stakeholder playbooks.',
            to: '/courses/delivery-operations',
            icon: ShieldCheckIcon,
          },
          {
            name: 'Innovation playbook',
            description: 'Project-based credential for launching experiments that stick.',
            to: '/courses/innovation',
            icon: RocketLaunchIcon,
          },
        ],
      },
    ],
  },
  {
    id: 'communities',
    label: 'Communities',
    description: 'Join curated cohorts for accountability, practice, and peer mentorship.',
    sections: [
      {
        title: 'Communities',
        items: [
          {
            name: 'Product makers guild',
            description: 'Weekly salons with PMs, designers, and engineers building together.',
            to: '/communities/product-makers',
            icon: UsersIcon,
          },
          {
            name: 'Career switchers hub',
            description: 'Support network with roadmap templates and job search critiques.',
            to: '/communities/career-switchers',
            icon: GlobeAltIcon,
          },
          {
            name: 'Student build club',
            description: 'Hands-on build challenges, demo days, and hackathon retros.',
            to: '/communities/student-build-club',
            icon: SparklesIcon,
          },
        ],
      },
      {
        title: 'Events & chapters',
        items: [
          {
            name: 'Local chapters',
            description: 'Meet practitioners in your city for lightning talks and office hours.',
            to: '/communities/chapters',
            icon: BuildingOffice2Icon,
          },
          {
            name: 'Virtual masterminds',
            description: 'Small-group cohorts focused on accountability and peer reviews.',
            to: '/communities/masterminds',
            icon: AcademicCapIcon,
          },
        ],
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    description: 'Unlock tutors, ebooks, and templates that accelerate your next milestone.',
    sections: [
      {
        title: 'Tutors',
        items: [
          {
            name: 'Book a tutor',
            description: 'Schedule 1:1 sessions with vetted Edulure tutors across disciplines.',
            to: '/tutors',
            icon: AcademicCapIcon,
          },
          {
            name: 'Mentor marketplace',
            description: 'Pair with industry mentors for ongoing reviews and goal tracking.',
            to: '/mentors',
            icon: UsersIcon,
          },
        ],
      },
      {
        title: 'Ebooks',
        items: [
          {
            name: 'Product strategy playbook',
            description: 'Download step-by-step canvases for vision, roadmaps, and OKRs.',
            to: '/ebooks/product-strategy',
            icon: BookOpenIcon,
          },
          {
            name: 'Career storytelling kit',
            description: 'Interview scripts, portfolio prompts, and follow-up templates.',
            to: '/ebooks/storytelling-kit',
            icon: BookmarkSquareIcon,
          },
        ],
      },
    ],
  },
]);

const marketingSearchConfig = deepFreeze({
  id: 'marketing-search',
  label: 'Search Edulure',
  placeholder: 'Search courses, communities, tutors, ebooks',
  ariaLabel: 'Search Edulure catalogue',
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
