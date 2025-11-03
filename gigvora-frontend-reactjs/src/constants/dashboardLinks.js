import { deepFreeze } from './menuSchema.js';

const dashboardLinks = deepFreeze({
  user: {
    label: 'User & Job Seeker',
    path: '/dashboard/user',
  },
  professional: {
    label: 'Professional',
    path: '/dashboard/professional',
  },
  admin: {
    label: 'Admin',
    path: '/dashboard/admin',
  },
  company: {
    label: 'Company',
    path: '/dashboard/company',
  },
});

export const DASHBOARD_LINKS = dashboardLinks;
