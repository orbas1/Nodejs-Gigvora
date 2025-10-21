import { deepFreeze } from './menuSchema.js';

const dashboardLinks = deepFreeze({
  user: {
    label: 'User & Job Seeker',
    path: '/dashboard/user',
  },
  freelancer: {
    label: 'Freelancer',
    path: '/dashboard/freelancer',
  },
  admin: {
    label: 'Admin',
    path: '/dashboard/admin',
  },
  agency: {
    label: 'Agency',
    path: '/dashboard/agency',
  },
  company: {
    label: 'Company',
    path: '/dashboard/company',
  },
  headhunter: {
    label: 'Headhunter',
    path: '/dashboard/headhunter',
  },
  mentor: {
    label: 'Mentor',
    path: '/dashboard/mentor',
  },
});

export const DASHBOARD_LINKS = dashboardLinks;
