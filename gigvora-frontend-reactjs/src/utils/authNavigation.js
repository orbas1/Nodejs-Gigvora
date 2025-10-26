export const DASHBOARD_ROUTES = {
  admin: '/dashboard/admin',
  agency: '/dashboard/agency',
  company: '/dashboard/company',
  freelancer: '/dashboard/freelancer',
  headhunter: '/dashboard/headhunter',
  mentor: '/dashboard/mentor',
  user: '/feed',
};

export function resolveLanding(session) {
  if (!session) {
    return '/feed';
  }
  const key = session.primaryDashboard ?? session.memberships?.[0];
  return DASHBOARD_ROUTES[key] ?? '/feed';
}
